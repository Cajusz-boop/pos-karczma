import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

/**
 * POST /api/products/import — import products from CSV
 * Body: { csv: string, mode: "create" | "update" | "upsert" }
 *
 * CSV format (semicolon separated):
 * Nazwa;Nazwa skrócona;Kategoria;Cena brutto;Koszt;Stawka VAT;Aktywny
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csv, mode = "upsert" } = body as { csv?: string; mode?: string };

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "Wymagane pole csv z treścią pliku" }, { status: 400 });
    }

    const lines = csv.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ error: "Plik musi mieć nagłówek i co najmniej 1 wiersz danych" }, { status: 400 });
    }

    // Skip header
    const dataLines = lines.slice(1);

    // Cache categories and tax rates
    const categories = await prisma.category.findMany();
    const taxRates = await prisma.taxRate.findMany();

    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const taxRateMap = new Map<string, string>();
    for (const tr of taxRates) {
      taxRateMap.set(tr.fiscalSymbol.toLowerCase(), tr.id);
      taxRateMap.set(`${Number(tr.ratePercent)}%`, tr.id);
      taxRateMap.set(String(Number(tr.ratePercent)), tr.id);
    }

    const defaultTaxRate = taxRates.find((t) => t.isDefault) ?? taxRates[0];
    const defaultCategory = categories[0];

    if (!defaultTaxRate || !defaultCategory) {
      return NextResponse.json({ error: "Brak kategorii lub stawek VAT w systemie" }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const cols = line.split(";").map((c) => c.replace(/^"|"$/g, "").trim());

      const name = cols[0];
      const nameShort = cols[1] || null;
      const categoryName = cols[2] || "";
      const priceGross = parseFloat(cols[3]?.replace(",", ".") ?? "0");
      const costPrice = cols[4] ? parseFloat(cols[4].replace(",", ".")) : null;
      const taxRateStr = cols[5] || "";
      const isActive = cols[6] ? cols[6].toUpperCase() !== "NIE" : true;

      if (!name) {
        results.errors.push(`Wiersz ${i + 2}: brak nazwy`);
        results.skipped++;
        continue;
      }

      if (isNaN(priceGross) || priceGross < 0) {
        results.errors.push(`Wiersz ${i + 2}: nieprawidłowa cena "${cols[3]}"`);
        results.skipped++;
        continue;
      }

      // Resolve category
      let categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        // Create category if not found
        if (categoryName) {
          const newCat = await prisma.category.create({
            data: { name: categoryName },
          });
          categoryId = newCat.id;
          categoryMap.set(categoryName.toLowerCase(), newCat.id);
        } else {
          categoryId = defaultCategory.id;
        }
      }

      // Resolve tax rate
      let taxRateId = taxRateMap.get(taxRateStr.toLowerCase());
      if (!taxRateId) {
        taxRateId = defaultTaxRate.id;
      }

      // Check if product exists
      const existing = await prisma.product.findFirst({
        where: { name, categoryId },
      });

      if (existing && (mode === "update" || mode === "upsert")) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            nameShort,
            priceGross,
            costPrice,
            taxRateId,
            isActive,
          },
        });
        results.updated++;
      } else if (!existing && (mode === "create" || mode === "upsert")) {
        await prisma.product.create({
          data: {
            name,
            nameShort,
            categoryId,
            priceGross,
            costPrice,
            taxRateId,
            isActive,
          },
        });
        results.created++;
      } else {
        results.skipped++;
      }
    }

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRODUCTS_IMPORTED", "Product", undefined, undefined, {
      mode,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
    });

    autoExportConfigSnapshot();

    return NextResponse.json({
      ...results,
      total: dataLines.length,
    });
  } catch (e) {
    console.error("[Products Import]", e);
    return NextResponse.json({ error: "Błąd importu" }, { status: 500 });
  }
}
