"use client";

import { useState } from "react";

interface HoldingSuggestion {
  symbol: string;
  action: "sell" | "trim" | "hold" | "add";
  reasoning: string;
}
interface NewIdea {
  symbol: string;
  thesis: string;
}
interface Suggestions {
  summary: string;
  holdings: HoldingSuggestion[];
  newIdeas: NewIdea[];
  disclaimer: string;
}

const ACTION_STYLES: Record<string, string> = {
  sell: "bg-loss/20 text-loss border-loss/40",
  trim: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  hold: "bg-white/10 text-white/70 border-white/20",
  add: "bg-gain/20 text-gain border-gain/40",
};

export default function SuggestionsPanel({ hasHoldings }: { hasHoldings: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Suggestions | null>(null);

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/suggestions", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to get suggestions");
        return;
      }
      setData(json.suggestions);
    } catch {
      setError("Network error while requesting suggestions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
          AI Sell / Buy Suggestions
        </h2>
        <button
          onClick={fetchSuggestions}
          disabled={loading || !hasHoldings}
          className="rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-3 py-1.5 text-sm font-medium"
        >
          {loading ? "Thinking…" : "Get suggestions"}
        </button>
      </div>

      {!hasHoldings && (
        <p className="text-xs text-white/40">Add at least one holding to request suggestions.</p>
      )}
      {error && <p className="text-xs text-loss">{error}</p>}

      {data && (
        <div className="space-y-4 text-sm">
          <p className="text-white/80">{data.summary}</p>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-white/50 mb-2">Your holdings</h3>
            <div className="space-y-2">
              {data.holdings.map((h) => (
                <div key={h.symbol} className="flex items-start gap-2">
                  <span
                    className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium uppercase ${
                      ACTION_STYLES[h.action] ?? ACTION_STYLES.hold
                    }`}
                  >
                    {h.action}
                  </span>
                  <span>
                    <span className="font-medium">{h.symbol}</span> — {h.reasoning}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {data.newIdeas.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-white/50 mb-2">New ideas</h3>
              <div className="space-y-2">
                {data.newIdeas.map((idea) => (
                  <div key={idea.symbol}>
                    <span className="font-medium">{idea.symbol}</span> — {idea.thesis}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-white/40 italic">{data.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
