"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryPoint } from "@/lib/types";

export default function PriceHistoryChart({ symbol }: { symbol: string }) {
  const [history, setHistory] = useState<HistoryPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHistory(null);
    setError(null);
    fetch(`/api/quotes?history=${encodeURIComponent(symbol)}&range=3mo`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setHistory(data.history);
        }
      })
      .catch(() => !cancelled && setError("Failed to load price history"));
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white/70 mb-2">{symbol} — 3 month price history</h3>
      {error && <p className="text-xs text-loss">{error}</p>}
      {!error && !history && <p className="text-xs text-white/40">Loading…</p>}
      {history && history.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={history}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8b95a1" }} minTickGap={30} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "#8b95a1" }}
              width={50}
            />
            <Tooltip
              contentStyle={{ background: "#12161c", border: "1px solid #2a2f38", fontSize: 12 }}
              labelStyle={{ color: "#e5e9ee" }}
            />
            <Line type="monotone" dataKey="close" stroke="#22c55e" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )}
      {history && history.length === 0 && (
        <p className="text-xs text-white/40">No history available.</p>
      )}
    </div>
  );
}
