import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { Holding } from "./types";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "portfolio.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    shares REAL NOT NULL,
    cost_basis REAL NOT NULL,
    purchase_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

function rowToHolding(row: any): Holding {
  return {
    id: row.id,
    symbol: row.symbol,
    shares: row.shares,
    costBasis: row.cost_basis,
    purchaseDate: row.purchase_date,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function listHoldings(): Holding[] {
  const rows = db.prepare("SELECT * FROM holdings ORDER BY symbol ASC, purchase_date ASC").all();
  return rows.map(rowToHolding);
}

export function addHolding(input: {
  symbol: string;
  shares: number;
  costBasis: number;
  purchaseDate: string;
  notes?: string | null;
}): Holding {
  const stmt = db.prepare(
    "INSERT INTO holdings (symbol, shares, cost_basis, purchase_date, notes) VALUES (?, ?, ?, ?, ?)"
  );
  const result = stmt.run(
    input.symbol.trim().toUpperCase(),
    input.shares,
    input.costBasis,
    input.purchaseDate,
    input.notes ?? null
  );
  const row = db.prepare("SELECT * FROM holdings WHERE id = ?").get(result.lastInsertRowid);
  return rowToHolding(row);
}

export function deleteHolding(id: number): void {
  db.prepare("DELETE FROM holdings WHERE id = ?").run(id);
}

export default db;
