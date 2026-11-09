"use client";

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function ChangeText({ value, pct }: { value: number; pct: number | null }) {
  if (pct == null) return <span className="text-white/40">—</span>;
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

export default function SummaryTiles({
  totalValue,
  totalCost,
  dayChange,
  dayChangePct,
  totalGain,
  totalGainPct,
  hasPrices,
}: {
  totalValue: number;
  totalCost: number;
  dayChange: number;
  dayChangePct: number | null;
  totalGain: number;
  totalGainPct: number | null;
  hasPrices: boolean;
}) {
  const tiles = [
    { label: "Portfolio Value", value: hasPrices ? fmtUsd(totalValue) : "—" },
    {
      label: "Today's P&L",
      value: hasPrices ? <ChangeText value={dayChange} pct={dayChangePct} /> : "—",
    },
    { label: "Total P&L", value: <ChangeText value={totalGain} pct={totalGainPct} /> },
    { label: "Total Cost Basis", value: fmtUsd(totalCost) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50 mb-1">{t.label}</div>
          <div className="text-lg font-semibold">{t.value}</div>
        </div>
      ))}
    </div>
  );
}
