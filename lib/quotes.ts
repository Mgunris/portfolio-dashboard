import type { HistoryPoint, Quote } from "./types";

const CHART_URL = (symbol: string, range: string, interval: string) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;

// Yahoo's public chart endpoint requires a browser-like User-Agent or it
// rejects the request outright.
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; PortfolioDashboard/1.0)" };

interface ChartResult {
  meta: {
    regularMarketPrice?: number;
    previousClose?: number;
    chartPreviousClose?: number;
    currency?: string;
  };
  timestamp?: number[];
  indicators: {
    quote: { close: (number | null)[] }[];
  };
}

async function fetchChart(symbol: string, range: string, interval: string): Promise<ChartResult> {
  const res = await fetch(CHART_URL(symbol, range, interval), {
    headers: HEADERS,
    // Quotes change constantly; never let Next cache this route's fetches.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Yahoo Finance request failed (${res.status})`);
  }
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const error = json?.chart?.error;
  if (error) {
    throw new Error(error.description || "Unknown error from Yahoo Finance");
  }
  if (!result) {
    throw new Error(`No data returned for ${symbol}`);
  }
  return result as ChartResult;
}

/** Current price + previous close for a single symbol. */
export async function getQuote(symbol: string): Promise<Quote> {
  try {
    const result = await fetchChart(symbol, "5d", "1d");
    const meta = result.meta;
    return {
      symbol,
      price: meta.regularMarketPrice ?? null,
      previousClose: meta.chartPreviousClose ?? meta.previousClose ?? null,
      currency: meta.currency ?? null,
    };
  } catch (err) {
    return {
      symbol,
      price: null,
      previousClose: null,
      currency: null,
      error: err instanceof Error ? err.message : "Failed to fetch quote",
    };
  }
}

export async function getQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const results = await Promise.all(unique.map((s) => getQuote(s)));
  const map: Record<string, Quote> = {};
  for (const r of results) map[r.symbol] = r;
  return map;
}

/** Daily closing price history for charting, most recent `range` of data. */
export async function getHistory(symbol: string, range: string = "3mo"): Promise<HistoryPoint[]> {
  const result = await fetchChart(symbol, range, "1d");
  const timestamps = result.timestamp ?? [];
  const closes = result.indicators.quote?.[0]?.close ?? [];
  const points: HistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null) continue;
    points.push({
      date: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      close,
    });
  }
  return points;
}
