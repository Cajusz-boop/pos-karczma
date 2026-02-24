export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/products/export — export all products as CSV
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        taxRate: { select: { fiscalSymbol: true, ratePercent: true } },
      },
      orderBy: [{ category: { name: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    });

    const BOM = "\uFEFF";
    const header = "Nazwa;Nazwa skrócona;Kategoria;Cena brutto;Koszt;Stawka VAT;Symbol fiskalny;Aktywny;Dostępny;Kolejność;Kolor;Czas przygotowania (min)\n";

    let csv = BOM + header;

    for (const p of products) {
      csv += [
        `"${p.name}"`,
        `"${p.nameShort ?? ""}"`,
        `"${p.category.name}"`,
        Number(p.priceGross).toFixed(2),
        p.costPrice ? Number(p.costPrice).toFixed(2) : "",
        `${Number(p.taxRate.ratePercent)}%`,
        p.taxRate.fiscalSymbol,
        p.isActive ? "TAK" : "NIE",
        p.isAvailable ? "TAK" : "NIE",
        p.sortOrder,
        p.color ?? "",
        p.estimatedPrepMinutes ?? "",
      ].join(";") + "\n";
    }

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="menu_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    console.error("[Products Export]", e);
    return NextResponse.json({ error: "Błąd eksportu" }, { status: 500 });
  }
}
