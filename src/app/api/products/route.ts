import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createProductSchema } from "@/lib/validation";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export async function GET(request: NextRequest) {
  try {
    const showAll = request.nextUrl.searchParams.get("all") === "true";
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            orderBy: { sortOrder: "asc" },
            include: {
              children: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: showAll ? {} : { isActive: true },
        include: {
          category: { select: { id: true, name: true, parentId: true, color: true, icon: true } },
          taxRate: { select: { id: true, fiscalSymbol: true } },
          modifierGroups: {
            include: {
              modifierGroup: {
                include: {
                  modifiers: { orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
          allergens: { include: { allergen: { select: { code: true, name: true, icon: true } } } },
        },
        orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
      }),
    ]);

    const productList = products.map((p) => ({
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
      imageUrl: p.imageUrl,
      sortOrder: p.sortOrder,
      modifierGroups: p.modifierGroups.map((pm) => ({
        modifierGroupId: pm.modifierGroupId,
        name: pm.modifierGroup.name,
        minSelect: pm.modifierGroup.minSelect,
        maxSelect: pm.modifierGroup.maxSelect,
        isRequired: pm.modifierGroup.isRequired,
        modifiers: pm.modifierGroup.modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          priceDelta: Number(m.priceDelta),
          sortOrder: m.sortOrder,
        })),
      })),
      allergens: p.allergens.map((pa) => ({
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
      children: (c.children ?? []).map((ch) => ({
        id: ch.id,
        name: ch.name,
        parentId: ch.parentId,
        sortOrder: ch.sortOrder,
        color: ch.color,
        icon: ch.icon,
        children: (ch.children ?? []).map((ch2) => ({
          id: ch2.id,
          name: ch2.name,
          parentId: ch2.parentId,
          sortOrder: ch2.sortOrder,
          color: ch2.color,
          icon: ch2.icon,
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
