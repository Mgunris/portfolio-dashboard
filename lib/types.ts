export interface Holding {
  id: number;
  symbol: string;
  shares: number;
  costBasis: number; // price paid per share
  purchaseDate: string; // ISO date
  notes: string | null;
  createdAt: string;
}

export interface Quote {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  currency: string | null;
  error?: string;
}

export interface HistoryPoint {
  date: string; // ISO date
  close: number;
}
