"use client";

import { useState } from "react";

export default function AddHoldingForm({ onAdd }: { onAdd: () => void }) {
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, shares, costBasis, purchaseDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add holding");
        return;
      }
      setSymbol("");
      setShares("");
      setCostBasis("");
      onAdd();
    } catch {
      setError("Network error while adding holding");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60 mb-3">
        Add a holding
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol (e.g. AAPL)"
          required
          className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <input
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          placeholder="Shares"
          type="number"
          step="any"
          min="0"
          required
          className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <input
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          placeholder="Cost per share ($)"
          type="number"
          step="any"
          min="0"
          required
          className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <input
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          type="date"
          required
          className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-3 py-2 text-sm font-medium"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-loss">{error}</p>}
    </form>
  );
}
