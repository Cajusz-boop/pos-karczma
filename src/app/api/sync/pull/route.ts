export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


interface ModifierGroupRef { modifierGroupId: string }
interface AllergenRef { allergenId: string }
interface ModifierItem { id: string; name: string; priceDelta: number; sortOrder: number }

const TABLE_CONFIG: Record<string, {
  model: string;
  transform: (records: Record<string, unknown>[], timestamp: string) => unknown[];
}> = {
  products: {
    model: "product",
    transform: (records: Record<string, unknown>[], timestamp: string) =>
      records.map((p) => ({
        id: p.id,
        name: p.name,
        nameShort: p.nameShort ?? undefined,
        categoryId: p.categoryId,
        priceGross: Number(p.priceGross),
        taxRateId: p.taxRateId,
        isActive: p.isActive,
        isAvailable: p.isAvailable,
        sortOrder: p.sortOrder,
        color: p.color ?? undefined,
        imageUrl: p.imageUrl ?? undefined,
        isWeightBased: p.isWeightBased,
        unit: p.unit ?? undefined,
        productType: p.productType,
        isSet: p.isSet,
        estimatedPrepMinutes: p.estimatedPrepMinutes ?? undefined,
        noPrintKitchen: p.noPrintKitchen ?? false,
        modifierGroupIds: ((p.modifierGroups as ModifierGroupRef[]) ?? []).map((mg) => mg.modifierGroupId),
        allergenIds: ((p.allergens as AllergenRef[]) ?? []).map((a) => a.allergenId),
        _serverUpdatedAt: timestamp,
      })),
  },
  categories: {
    model: "category",
    transform: (records: Record<string, unknown>[], timestamp: string) =>
      records.map((c) => ({
        id: c.id,
        name: c.name,
        parentId: c.parentId ?? undefined,
        sortOrder: c.sortOrder,
        color: c.color ?? undefined,
        icon: c.icon ?? undefined,
        imageUrl: c.imageUrl ?? undefined,
        isActive: c.isActive,
        isSeasonal: c.isSeasonal ?? false,
        seasonStart: (c.seasonStart as Date)?.toISOString(),
        seasonEnd: (c.seasonEnd as Date)?.toISOString(),
        _serverUpdatedAt: timestamp,
      })),
  },
  rooms: {
    model: "room",
    transform: (records: Record<string, unknown>[], timestamp: string) =>
      records.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        capacity: r.capacity ?? 0,
        isActive: r.isActive,
        isSeasonal: r.isSeasonal ?? false,
        sortOrder: r.sortOrder,
        _serverUpdatedAt: timestamp,
      })),
  },
  tables: {
    model: "table",
    transform: (records: Record<string, unknown>[], timestamp: string) =>
      records.map((t) => ({
        id: t.id,
        roomId: t.roomId,
        number: t.number,
        seats: t.seats,
        shape: t.shape,
        status: t.status,
        // Normalize isAvailable — MySQL/Prisma może zwrócić 0/1; null/undefined → true
        isAvailable: t.isAvailable !== false && t.isAvailable !== 0,
        description: t.description ?? undefined,
        positionX: t.positionX ?? 0,
        positionY: t.positionY ?? 0,
        width: t.width ?? 80,
        height: t.height ?? 80,
        _serverUpdatedAt: timestamp,
      })),
  },
  modifiers: {
    model: "modifierGroup",
    transform: (records: Record<string, unknown>[], timestamp: string) =>
      records.map((mg) => ({
        id: mg.id,
        name: mg.name,
        minSelect: mg.minSelect,
        maxSelect: mg.maxSelect,
        isRequired: mg.isRequired,
        modifiers: ((mg.modifiers as ModifierItem[]) ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          priceDelta: Number(m.priceDelta),
          sortOrder: m.sortOrder,
        })),
        _serverUpdatedAt: timestamp,
      })),
  },
  "tax-rates": {
    model: "taxRate",
    transform: (records: Record<string, unknown>[], timestamp: string) =>
      records.map((t) => ({
        id: t.id,
        name: t.name,
        ratePercent: Number(t.ratePercent),
        fiscalSymbol: t.fiscalSymbol,
        isDefault: t.isDefault,
        _serverUpdatedAt: timestamp,
      })),
  },
  allergens: {
    model: "allergen",
    transform: (records: Record<string, unknown>[], timestamp: string) =>
      records.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        icon: a.icon ?? undefined,
        _serverUpdatedAt: timestamp,
      })),
  },
};

export async function GET(request: NextRequest) {
  if (process.env.CAPACITOR_BUILD === "1") {
    return NextResponse.json({
      data: [],
      serverTimestamp: new Date().toISOString(),
      hasMore: false,
    });
  }
  const table = request.nextUrl.searchParams.get("table");
  // `since` reserved for incremental sync (not yet implemented for these tables)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _since = request.nextUrl.searchParams.get("since");

  if (!table || !(table in TABLE_CONFIG)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  const config = TABLE_CONFIG[table];

  try {
    const include = table === "products"
      ? { modifierGroups: { select: { modifierGroupId: true } }, allergens: { select: { allergenId: true } } }
      : table === "modifiers"
        ? { modifiers: { orderBy: { sortOrder: "asc" as const } } }
        : undefined;

    type PrismaModels = "product" | "category" | "room" | "table" | "modifierGroup" | "taxRate" | "allergen";
    const modelName = config.model as PrismaModels;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = await (prisma[modelName] as any).findMany({
      ...(include && { include }),
      take: 1000,
    });

    const serverTimestamp = new Date().toISOString();
    const transformed = config.transform(records, serverTimestamp);

    if (table === "tables") {
      console.log(`[SyncPull] tables: ${records.length} records from DB`);
    }

    return NextResponse.json({
      data: transformed,
      serverTimestamp,
      hasMore: records.length === 1000,
    });
  } catch (e) {
    console.error(`[SyncPull] Error for ${table}:`, e);
    return NextResponse.json({ error: "Sync pull failed" }, { status: 500 });
  }
}
