# Stock Portfolio Dashboard

Track the stocks you own, see your daily and total gain/loss, and get AI-assisted
sell/buy suggestions — all self-hosted, no external portfolio service required.

## Features

- **Add your holdings**: symbol, number of shares, cost per share, purchase date.
- **Live prices** pulled from Yahoo Finance's public chart endpoint (no API key needed).
- **Daily P&L**: today's dollar/percent change per holding and across the whole portfolio.
- **Unrealized P&L**: total gain/loss vs. your cost basis.
- **Price history chart** (3 months) for whichever holding you click on.
- **AI suggestions**: click "Get suggestions" to have Claude review your current
  holdings and recent price trends and suggest sell/trim/hold/add actions per
  holding, plus a few new ideas to consider. Requires your own Anthropic API key.

## Setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY (optional — only needed for AI suggestions)
npm run dev
```

Open http://localhost:3000.

Holdings are stored locally in a SQLite file at `data/portfolio.db` (created
automatically on first run). Nothing leaves your machine except:

- Requests to Yahoo Finance's public `query1.finance.yahoo.com` chart endpoint,
  to fetch current/historical prices.
- Requests to the Anthropic API when you click "Get suggestions" (only the
  symbols, share counts, cost basis, and recent price trends are sent — no
  personal information).

## Notes & limitations

- Prices come from Yahoo Finance's unofficial public endpoint. It has no
  authentication and can rate-limit or change without notice — if a quote
  shows a ⚠ icon, hover it to see the error.
- The AI suggestions feature calls `claude-opus-5` and is explicitly scoped to
  reason only from the price data you see in the dashboard (not real-time news
  or fundamentals). It is not financial advice.
- This is designed for a single local user. There's no auth — don't expose it
  to the public internet as-is.

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- better-sqlite3 for local storage
- Recharts for the price history chart
- `@anthropic-ai/sdk` for AI suggestions
