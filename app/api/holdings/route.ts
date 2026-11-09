import { NextRequest, NextResponse } from "next/server";
import { addHolding, deleteHolding, listHoldings } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ holdings: listHoldings() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { symbol, shares, costBasis, purchaseDate, notes } = body ?? {};

  if (typeof symbol !== "string" || !symbol.trim()) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }
  const sharesNum = Number(shares);
  const costBasisNum = Number(costBasis);
  if (!Number.isFinite(sharesNum) || sharesNum <= 0) {
    return NextResponse.json({ error: "shares must be a positive number" }, { status: 400 });
  }
  if (!Number.isFinite(costBasisNum) || costBasisNum <= 0) {
    return NextResponse.json({ error: "costBasis must be a positive number" }, { status: 400 });
  }
  if (typeof purchaseDate !== "string" || !purchaseDate) {
    return NextResponse.json({ error: "purchaseDate is required" }, { status: 400 });
  }

  const holding = addHolding({
    symbol,
    shares: sharesNum,
    costBasis: costBasisNum,
    purchaseDate,
    notes: typeof notes === "string" ? notes : null,
  });
  return NextResponse.json({ holding }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 });
  }
  deleteHolding(Number(id));
  return NextResponse.json({ ok: true });
}
