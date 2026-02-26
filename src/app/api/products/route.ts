export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createProductSchema } from "@/lib/validation";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";
import { cached, cacheDeletePattern } from "@/lib/redis";

const CACHE_TTL = 120;

async function fetchCategoriesFromDb() {
  return prisma.category.findMany({
    where: { parentId: null, isActive: true },
    select: {
      id: true,
      name: true,
      parentId: true,
      sortOrder: true,
      color: true,
      icon: true,
      imageUrl: true,
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          parentId: true,
          sortOrder: true,
          color: true,
          icon: true,
          imageUrl: true,
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              parentId: true,
              sortOrder: true,
              color: true,
              icon: true,
              imageUrl: true,
            },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

async function fetchProductsFromDb(showAll: boolean, minimal: boolean) {
  const productWhere = showAll ? {} : { isActive: true, isAvailable: true };
  
  return prisma.product.findMany({
    where: productWhere,
    select: {
      id: true,
      name: true,
      nameShort: true,
      categoryId: true,
      priceGross: true,
      taxRateId: true,
      isActive: true,
      isAvailable: true,
      color: true,
      imageUrl: minimal ? false : true,
      sortOrder: true,
      category: { select: { id: true, name: true, parentId: true, color: true, icon: true } },
      taxRate: { select: { id: true, fiscalSymbol: true } },
      modifierGroups: minimal ? false : {
        include: {
          modifierGroup: {
            select: {
              name: true,
              minSelect: true,
              maxSelect: true,
              isRequired: true,
              modifiers: {
                orderBy: { sortOrder: "asc" },
                select: { id: true, name: true, priceDelta: true, sortOrder: true },
              },
            },
          },
        },
      },
      allergens: minimal ? false : {
        include: { allergen: { select: { code: true, name: true, icon: true } } },
      },
    },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });
}

export async function GET(request: NextRequest) {
  try {
    const showAll = request.nextUrl.searchParams.get("all") === "true";
    const minimal = request.nextUrl.searchParams.get("minimal") === "true";
    
    const cacheKey = `products:${showAll ? "all" : "active"}:${minimal ? "min" : "full"}`;
    
    const [categories, products] = await Promise.all([
      cached("categories", fetchCategoriesFromDb, { ttl: CACHE_TTL, prefix: "pos" }),
      cached(cacheKey, () => fetchProductsFromDb(showAll, minimal), { ttl: CACHE_TTL, prefix: "pos" }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productList = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      nameShort: p.nameShort,
      categoryId: p.categoryId,
      category: p.category,
      priceGross: Number(p.priceGross),
      taxRateId: p.taxRateId,
      taxRate: p.taxRate,
      isActive: p.isActive,
      isAvailable: p.isAvailable,
      color: p.color,
      imageUrl: p.imageUrl ?? null,
      sortOrder: p.sortOrder,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modifierGroups: (p.modifierGroups ?? []).map((pm: any) => ({
        modifierGroupId: pm.modifierGroupId,
        name: pm.modifierGroup.name,
        minSelect: pm.modifierGroup.minSelect,
        maxSelect: pm.modifierGroup.maxSelect,
        isRequired: pm.modifierGroup.isRequired,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modifiers: pm.modifierGroup.modifiers.map((m: any) => ({
          id: m.id,
          name: m.name,
          priceDelta: Number(m.priceDelta),
          sortOrder: m.sortOrder,
        })),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allergens: (p.allergens ?? []).map((pa: any) => ({
        code: pa.allergen.code,
        name: pa.allergen.name,
        icon: pa.allergen.icon,
      })),
    }));

    const categoryTree = categories.map((c) => ({
      id: c.id,
      name: c.name,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      color: c.color,
      icon: c.icon,
      imageUrl: c.imageUrl,
      children: (c.children ?? []).map((ch) => ({
        id: ch.id,
        name: ch.name,
        parentId: ch.parentId,
        sortOrder: ch.sortOrder,
        color: ch.color,
        icon: ch.icon,
        imageUrl: ch.imageUrl,
        children: (ch.children ?? []).map((ch2) => ({
          id: ch2.id,
          name: ch2.name,
          parentId: ch2.parentId,
          sortOrder: ch2.sortOrder,
          color: ch2.color,
          icon: ch2.icon,
          imageUrl: ch2.imageUrl,
        })),
      })),
    }));

    return NextResponse.json({
      categories: categoryTree,
      products: productList,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania produktów" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, createProductSchema);
    if (valError) return valError;

    const { name, categoryId, taxRateId, priceGross } = data;
    const nameShort = (data as Record<string, unknown>).nameShort as string | undefined;
    const color = (data as Record<string, unknown>).color as string | undefined;
    const sortOrder = (data as Record<string, unknown>).sortOrder as number | undefined;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Kategoria nie istnieje" }, { status: 404 });
    }
    const taxRate = await prisma.taxRate.findUnique({ where: { id: taxRateId } });
    if (!taxRate) {
      return NextResponse.json({ error: "Stawka VAT nie istnieje" }, { status: 404 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.slice(0, 100),
        nameShort: (nameShort ?? name).slice(0, 40),
        categoryId,
        taxRateId,
        priceGross,
        color: color ?? null,
        sortOrder: sortOrder ?? 0,
      },
      include: {
        category: { select: { id: true, name: true } },
        taxRate: { select: { id: true, fiscalSymbol: true } },
      },
    });

    autoExportConfigSnapshot();
    
    await cacheDeletePattern("products:*", "pos");

    return NextResponse.json({
      id: product.id,
      name: product.name,
      nameShort: product.nameShort,
      categoryId: product.categoryId,
      category: product.category,
      priceGross: Number(product.priceGross),
      taxRateId: product.taxRateId,
      taxRate: product.taxRate,
      isAvailable: product.isAvailable,
      isActive: product.isActive,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia produktu" }, { status: 500 });
  }
}
