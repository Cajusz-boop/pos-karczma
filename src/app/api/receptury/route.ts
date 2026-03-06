export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/jwt";

const UNITS = ["kg", "g", "l", "ml", "litr", "dag", "szt", "op", "porcja"] as const;

function canAccessReceptury(roleName: string, isOwner: boolean) {
  return roleName === "ADMIN" || roleName === "SZEF_KUCHNI" || isOwner;
}

async function requireRecepturyAccess() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 }) };
  if (!canAccessReceptury(user.roleName, user.isOwner)) {
    return { error: NextResponse.json({ error: "Brak dostępu do receptur" }, { status: 403 }) };
  }
  return { user };
}

/** GET /api/receptury — lista receptur (dostęp bez logowania dla linku szefa kuchni) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tag");
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const includeArchived = searchParams.get("archived") === "1";

    const where: Prisma.RecipeDishWhereInput = {};
    if (!includeArchived) where.isArchived = false;
    if (status && ["AKTYWNA", "ARCHIWALNA"].includes(status)) {
      where.status = status as "AKTYWNA" | "ARCHIWALNA";
    }
    if (tagId) where.recipeTags = { some: { tagId: parseInt(tagId, 10) } };
    if (search) where.name = { contains: search };

    const recipes = await prisma.recipeDish.findMany({
      where,
      include: {
        _count: { select: { ingredients: true } },
        recipeTags: { include: { tag: true } },
        ingredients: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { select: { name: true } },
            subRecipe: { select: { name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      recipes.map((r) => ({
        id: r.id,
        recipeNumber: r.recipeNumber,
        name: r.name,
        status: r.status,
        basePortions: r.basePortions,
        portionUnit: r.portionUnit,
        notes: r.notes,
        isArchived: r.isArchived,
        ingredientCount: r._count.ingredients,
        tags: r.recipeTags.map((rt) => ({ id: rt.tag.id, name: rt.tag.name, color: rt.tag.color })),
        ingredients: r.ingredients.map((i) => ({
          name: i.product?.name ?? i.subRecipe?.name ?? "?",
          quantity: i.quantity,
          unit: i.unit,
        })),
        createdAt: r.createdAt,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania receptur" }, { status: 500 });
  }
}

/** POST /api/receptury — utwórz recepturę */
export async function POST(request: NextRequest) {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;

  try {
    const body = await request.json();
    const {
      recipeNumber,
      name,
      basePortions = 1,
      portionUnit = "porcja",
      status = "AKTYWNA",
      notes,
      tagIds = [],
      ingredients = [],
    } = body as {
      recipeNumber?: number;
      name: string;
      basePortions?: number;
      portionUnit?: string;
      status?: string;
      notes?: string | null;
      tagIds?: number[];
      ingredients?: { productId?: number; subRecipeId?: number; quantity: number; unit: string; sortOrder?: number }[];
    };

    if (!name?.trim()) return NextResponse.json({ error: "Nazwa receptury jest wymagana (min. 3 znaki)" }, { status: 400 });
    if (name.trim().length < 3) return NextResponse.json({ error: "Nazwa receptury jest wymagana (min. 3 znaki)" }, { status: 400 });
    const portions = Math.max(0.001, Number(basePortions) || 1);
    const pUnit = String(portionUnit || "porcja").slice(0, 20);
    const st = ["AKTYWNA", "ARCHIWALNA"].includes(status || "") ? status : "AKTYWNA";

    const ing = Array.isArray(ingredients) ? ingredients : [];
    const validIngredients = ing
      .filter((i) => (i.productId != null) !== (i.subRecipeId != null))
      .filter((i) => Number(i.quantity) > 0)
      .map((i, idx) => ({
        productId: i.productId ?? null,
        subRecipeId: i.subRecipeId ?? null,
        quantity: Math.max(0, Number(i.quantity) || 0),
        unit: UNITS.includes(i.unit as (typeof UNITS)[number]) ? i.unit : "kg",
        sortOrder: i.sortOrder ?? idx,
      }));

    if (validIngredients.length === 0) {
      return NextResponse.json({ error: "Receptura musi mieć co najmniej jeden składnik" }, { status: 400 });
    }

    let rn = recipeNumber;
    if (rn == null || typeof rn !== "number") {
      const max = await prisma.recipeDish.aggregate({ _max: { recipeNumber: true } });
      rn = (max._max.recipeNumber ?? 0) + 1;
    }

    const recipe = await prisma.recipeDish.create({
      data: {
        recipeNumber: rn,
        name: name.trim(),
        basePortions: portions,
        portionUnit: pUnit,
        status: st as "AKTYWNA" | "ARCHIWALNA",
        notes: notes?.trim() || null,
        ingredients: { create: validIngredients },
        recipeTags: { create: (tagIds || []).map((tagId: number) => ({ tagId })) },
      },
      include: { _count: { select: { ingredients: true } }, recipeTags: { include: { tag: true } } },
    });

    return NextResponse.json({
      id: recipe.id,
      recipeNumber: recipe.recipeNumber,
      name: recipe.name,
      status: recipe.status,
      basePortions: recipe.basePortions,
      portionUnit: recipe.portionUnit,
      ingredientCount: recipe._count.ingredients,
      tags: recipe.recipeTags.map((rt) => ({ id: rt.tag.id, name: rt.tag.name, color: rt.tag.color })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia receptury" }, { status: 500 });
  }
}
