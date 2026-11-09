"use client";

import { useCallback, useEffect, useState } from "react";
import type { Holding, Quote } from "@/lib/types";
import HoldingsTable from "@/components/HoldingsTable";
import AddHoldingForm from "@/components/AddHoldingForm";
import SummaryTiles from "@/components/SummaryTiles";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import SuggestionsPanel from "@/components/SuggestionsPanel";

export default function Home() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const holdingsRes = await fetch("/api/holdings");
    const holdingsData = await holdingsRes.json();
    const nextHoldings: Holding[] = holdingsData.holdings ?? [];
    setHoldings(nextHoldings);

    if (nextHoldings.length > 0) {
      const symbols = Array.from(new Set(nextHoldings.map((h) => h.symbol))).join(",");
      const quotesRes = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
      const quotesData = await quotesRes.json();
      setQuotes(quotesData.quotes ?? {});
      setSelectedSymbol((prev) => prev ?? nextHoldings[0].symbol);
    } else {
      setQuotes({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(id: number) {
    await fetch(`/api/holdings?id=${id}`, { method: "DELETE" });
    refresh();
  }

  // Aggregate per-symbol lots into portfolio totals. Cost basis is tracked for
  // every holding (it's known regardless of live prices), but gain/loss and
  // value are only summed over holdings with a resolved quote — otherwise a
  // missing price would look like the position lost 100% of its value.
  let totalValue = 0;
  let totalCost = 0;
  let costWithPrice = 0;
  let dayChange = 0;
  let prevTotalValue = 0;
  let anyPriced = false;
  for (const h of holdings) {
    const q = quotes[h.symbol];
    const cost = h.costBasis * h.shares;
    totalCost += cost;
    if (q?.price != null) {
      anyPriced = true;
      totalValue += q.price * h.shares;
      costWithPrice += cost;
      if (q.previousClose != null) {
        dayChange += (q.price - q.previousClose) * h.shares;
        prevTotalValue += q.previousClose * h.shares;
      }
    }
  }
  const totalGain = totalValue - costWithPrice;
  const totalGainPct = anyPriced && costWithPrice > 0 ? (totalGain / costWithPrice) * 100 : null;
  const dayChangePct = anyPriced && prevTotalValue > 0 ? (dayChange / prevTotalValue) * 100 : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Portfolio Dashboard</h1>
        <p className="text-sm text-white/50">
          Track your holdings, see daily gains/losses, and get AI-assisted sell/buy suggestions.
        </p>
      </header>

      <SummaryTiles
        totalValue={totalValue}
        totalCost={totalCost}
        dayChange={dayChange}
        dayChangePct={dayChangePct}
        totalGain={totalGain}
        totalGainPct={totalGainPct}
        hasPrices={anyPriced}
      />

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">Holdings</h2>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs text-white/50 hover:text-white/90"
        >
          {loading ? "Refreshing…" : "Refresh prices"}
        </button>
      </div>

      <HoldingsTable
        holdings={holdings}
        quotes={quotes}
        onDelete={handleDelete}
        onSelect={setSelectedSymbol}
        selectedSymbol={selectedSymbol}
      />

      <AddHoldingForm onAdd={refresh} />

      {selectedSymbol && (
        <div className="mt-6">
          <PriceHistoryChart symbol={selectedSymbol} />
        </div>
      )}

      <SuggestionsPanel hasHoldings={holdings.length > 0} />
    </main>
  );
}
