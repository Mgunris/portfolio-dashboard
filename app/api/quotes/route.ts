import { NextRequest, NextResponse } from "next/server";
import { getHistory, getQuotes } from "@/lib/quotes";

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols");
  const historyFor = req.nextUrl.searchParams.get("history");
  const range = req.nextUrl.searchParams.get("range") ?? "3mo";

  if (historyFor) {
    try {
      const history = await getHistory(historyFor, range);
      return NextResponse.json({ symbol: historyFor, history });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to fetch history" },
        { status: 502 }
      );
    }
  }

  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols query param is required" }, { status: 400 });
  }
  const symbols = symbolsParam.split(",").map((s) => s.trim()).filter(Boolean);
  const quotes = await getQuotes(symbols);
  return NextResponse.json({ quotes });
}
