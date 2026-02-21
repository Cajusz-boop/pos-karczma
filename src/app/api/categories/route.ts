import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";
import { cached, cacheDelete, cacheDeletePattern } from "@/lib/redis";

const createCategorySchema = z.object({
  name: z.string().min(1, "Wymagana nazwa").max(50),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
  isSeasonal: z.boolean().optional(),
  seasonStart: z.string().datetime().optional(),
  seasonEnd: z.string().datetime().optional(),
});

const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  color: z.string().max(20).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
  isSeasonal: z.boolean().optional(),
  seasonStart: z.string().datetime().nullable().optional(),
  seasonEnd: z.string().datetime().nullable().optional(),
});

const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int(),
  })),
});

export const revalidate = 60;

async function fetchCategoriesWithCount() {
  return prisma.category.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * GET /api/categories — list all categories with product count
 */
export async function GET() {
  try {
    const categories = await cached(
      "categories-list",
      fetchCategoriesWithCount,
      { ttl: 120, prefix: "pos" }
    );

    return NextResponse.json({ categories }, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    console.error("[Categories GET]", e);
    return NextResponse.json({ error: "Błąd pobierania kategorii" }, { status: 500 });
  }
}

/**
 * POST /api/categories — create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const category = await prisma.category.create({
      data: {
        name: data.name,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder ?? 0,
        color: data.color ?? null,
        icon: data.icon ?? null,
        isSeasonal: data.isSeasonal ?? false,
        seasonStart: data.seasonStart ? new Date(data.seasonStart) : null,
        seasonEnd: data.seasonEnd ? new Date(data.seasonEnd) : null,
      },
    });

    autoExportConfigSnapshot();
    await Promise.all([
      cacheDelete("categories-list", "pos"),
      cacheDelete("categories", "pos"),
      cacheDeletePattern("products:*", "pos"),
    ]);

    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    console.error("[Categories POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia kategorii" }, { status: 500 });
  }
}

/**
 * PATCH /api/categories — update a category
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a reorder request
    if (body.items && Array.isArray(body.items)) {
      const parsed = reorderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Nieprawidłowe dane kolejności" }, { status: 400 });
      }

      await prisma.$transaction(
        parsed.data.items.map((item) =>
          prisma.category.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          })
        )
      );

      autoExportConfigSnapshot();
      await Promise.all([
        cacheDelete("categories-list", "pos"),
        cacheDelete("categories", "pos"),
      ]);

      return NextResponse.json({ ok: true });
    }

    // Single category update
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isSeasonal !== undefined) updateData.isSeasonal = data.isSeasonal;
    if (data.seasonStart !== undefined) updateData.seasonStart = data.seasonStart ? new Date(data.seasonStart) : null;
    if (data.seasonEnd !== undefined) updateData.seasonEnd = data.seasonEnd ? new Date(data.seasonEnd) : null;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    autoExportConfigSnapshot();
    await Promise.all([
      cacheDelete("categories-list", "pos"),
      cacheDelete("categories", "pos"),
      cacheDeletePattern("products:*", "pos"),
    ]);

    return NextResponse.json({ category });
  } catch (e) {
    console.error("[Categories PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji kategorii" }, { status: 500 });
  }
}

/**
 * DELETE /api/categories — delete a category (only if no products)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Wymagane id" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategoria nie istnieje" }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: `Kategoria ma ${category._count.products} produktów — przenieś je najpierw` },
        { status: 400 }
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: `Kategoria ma ${category._count.children} podkategorii — usuń je najpierw` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    autoExportConfigSnapshot();
    await Promise.all([
      cacheDelete("categories-list", "pos"),
      cacheDelete("categories", "pos"),
      cacheDeletePattern("products:*", "pos"),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Categories DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania kategorii" }, { status: 500 });
  }
}
