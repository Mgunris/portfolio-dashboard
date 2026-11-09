"use client";

import type { Holding, Quote } from "@/lib/types";

function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function ChangeCell({ value, pct }: { value: number | null; pct: number | null }) {
  if (value == null || pct == null) return <span className="text-white/40">—</span>;
  const positive = value >= 0;
  const color = positive ? "text-gain" : "text-loss";
  const sign = positive ? "+" : "";
  return (
    <span className={color}>
      {sign}
      {fmtUsd(value)} ({sign}
      {pct.toFixed(2)}%)
    </span>
  );
}

export default function HoldingsTable({
  holdings,
  quotes,
  onDelete,
  onSelect,
  selectedSymbol,
}: {
  holdings: Holding[];
  quotes: Record<string, Quote>;
  onDelete: (id: number) => void;
  onSelect: (symbol: string) => void;
  selectedSymbol: string | null;
}) {
  if (holdings.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center text-white/60">
        No holdings yet. Add a stock below to start tracking it.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-white/60 uppercase text-xs">
          <tr>
            <th className="px-3 py-2 text-left">Symbol</th>
            <th className="px-3 py-2 text-right">Shares</th>
            <th className="px-3 py-2 text-right">Avg Cost</th>
            <th className="px-3 py-2 text-right">Price</th>
            <th className="px-3 py-2 text-right">Day Change</th>
            <th className="px-3 py-2 text-right">Market Value</th>
            <th className="px-3 py-2 text-right">Unrealized P&L</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const q = quotes[h.symbol];
            const price = q?.price ?? null;
            const prevClose = q?.previousClose ?? null;
            const dayChangePerShare = price != null && prevClose != null ? price - prevClose : null;
            const dayChangePct =
              dayChangePerShare != null && prevClose ? (dayChangePerShare / prevClose) * 100 : null;
            const dayChangeTotal = dayChangePerShare != null ? dayChangePerShare * h.shares : null;

            const marketValue = price != null ? price * h.shares : null;
            const costTotal = h.costBasis * h.shares;
            const gainTotal = marketValue != null ? marketValue - costTotal : null;
            const gainPct = gainTotal != null ? (gainTotal / costTotal) * 100 : null;

            const isSelected = selectedSymbol === h.symbol;

            return (
              <tr
                key={h.id}
                onClick={() => onSelect(h.symbol)}
                className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${
                  isSelected ? "bg-white/10" : ""
                }`}
              >
                <td className="px-3 py-2 font-medium">
                  {h.symbol}
                  {q?.error && (
                    <span className="ml-2 text-xs text-loss" title={q.error}>
                      ⚠
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">{h.shares}</td>
                <td className="px-3 py-2 text-right">{fmtUsd(h.costBasis)}</td>
                <td className="px-3 py-2 text-right">{fmtUsd(price)}</td>
                <td className="px-3 py-2 text-right">
                  <ChangeCell value={dayChangeTotal} pct={dayChangePct} />
                </td>
                <td className="px-3 py-2 text-right">{fmtUsd(marketValue)}</td>
                <td className="px-3 py-2 text-right">
                  <ChangeCell value={gainTotal} pct={gainPct} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(h.id);
                    }}
                    className="text-white/40 hover:text-loss text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
