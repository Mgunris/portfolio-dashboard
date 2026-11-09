import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { listHoldings } from "@/lib/db";
import { getHistory, getQuotes } from "@/lib/quotes";

const SUGGESTION_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "2-3 sentence overview of portfolio health and market context.",
    },
    holdings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          action: { type: "string", enum: ["sell", "trim", "hold", "add"] },
          reasoning: { type: "string" },
        },
        required: ["symbol", "action", "reasoning"],
        additionalProperties: false,
      },
    },
    newIdeas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          thesis: { type: "string" },
        },
        required: ["symbol", "thesis"],
        additionalProperties: false,
      },
    },
    disclaimer: { type: "string" },
  },
  required: ["summary", "holdings", "newIdeas", "disclaimer"],
  additionalProperties: false,
};

export async function POST() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Add it to your .env.local file to enable AI suggestions (see README).",
      },
      { status: 501 }
    );
  }

  const holdings = listHoldings();
  if (holdings.length === 0) {
    return NextResponse.json({ error: "Add at least one holding before requesting suggestions." }, { status: 400 });
  }

  const symbols = holdings.map((h) => h.symbol);
  const quotes = await getQuotes(symbols);

  const portfolioLines = holdings.map((h) => {
    const q = quotes[h.symbol];
    const price = q?.price;
    const gainPct = price ? (((price - h.costBasis) / h.costBasis) * 100).toFixed(1) : "n/a";
    return `- ${h.symbol}: ${h.shares} shares @ avg cost $${h.costBasis.toFixed(2)}, purchased ${h.purchaseDate}, current price ${
      price ? `$${price.toFixed(2)}` : "unavailable"
    }, unrealized ${gainPct}%`;
  });

  // Pull a short recent trend (last ~10 trading days) per holding to give the model
  // some momentum context beyond a single price point.
  const trends = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const history = await getHistory(symbol, "1mo");
        const recent = history.slice(-10);
        return `${symbol}: ${recent.map((p) => p.close.toFixed(2)).join(" -> ")}`;
      } catch {
        return `${symbol}: trend unavailable`;
      }
    })
  );

  const prompt = `You are a cautious financial research assistant helping a retail investor review their portfolio.

Current holdings:
${portfolioLines.join("\n")}

Recent daily closing price trends (oldest to newest, last ~10 trading days):
${trends.join("\n")}

Task:
1. For EACH holding above, recommend one action: "sell", "trim", "hold", or "add", with a short concrete reason grounded in the price data given (not just generic advice).
2. Suggest 2-4 NEW stock ideas the investor doesn't currently own that could complement or diversify this portfolio, with a one-sentence thesis each.
3. Write a brief overall summary of portfolio health.
4. Include a short disclaimer that this is not financial advice and is based only on the limited price data provided, not fundamentals or news.

Be specific and reference the actual price levels/trends given. Do not fabricate news events or fundamentals you weren't given.`;

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SUGGESTION_SCHEMA },
      },
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Claude returned no text output." }, { status: 502 });
    }
    const parsed = JSON.parse(textBlock.text);
    return NextResponse.json({ suggestions: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get suggestions from Claude" },
      { status: 502 }
    );
  }
}
