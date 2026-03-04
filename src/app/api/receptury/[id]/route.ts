export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

/** GET /api/receptury/[id] — jedna receptura z składnikami */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;
  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    const recipe = await prisma.recipeDish.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { include: { product: true, subRecipe: true }, orderBy: { sortOrder: "asc" } },
        recipeTags: { include: { tag: true } },
      },
    });
    if (!recipe) return NextResponse.json({ error: "Receptura nie znaleziona" }, { status: 404 });

    return NextResponse.json({
      id: recipe.id,
      recipeNumber: recipe.recipeNumber,
      name: recipe.name,
      status: recipe.status,
      basePortions: recipe.basePortions,
      portionUnit: recipe.portionUnit,
      notes: recipe.notes,
      isArchived: recipe.isArchived,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      tags: recipe.recipeTags.map((rt) => ({ id: rt.tag.id, name: rt.tag.name, color: rt.tag.color })),
      ingredients: recipe.ingredients.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product?.name ?? null,
        subRecipeId: i.subRecipeId,
        subRecipeName: i.subRecipe?.name ?? null,
        quantity: i.quantity,
        unit: i.unit,
        sortOrder: i.sortOrder,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania receptury" }, { status: 500 });
  }
}

/** PUT /api/receptury/[id] — edycja receptury (replace-all składniki i tagi) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;

  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    const body = await request.json();
    const {
      name,
      basePortions,
      portionUnit,
      status,
      notes,
      tagIds = [],
      ingredients = [],
    } = body as {
      name?: string;
      basePortions?: number;
      portionUnit?: string;
      status?: string;
      notes?: string | null;
      tagIds?: number[];
      ingredients?: { productId?: number; subRecipeId?: number; quantity: number; unit: string; sortOrder?: number }[];
    };

    const existing = await prisma.recipeDish.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { include: { product: true, subRecipe: true }, orderBy: { sortOrder: "asc" } },
        recipeTags: { include: { tag: true } },
      },
    });
    if (!existing) return NextResponse.json({ error: "Receptura nie znaleziona" }, { status: 404 });

    const { user } = check;
    const snapshot = {
      name: existing.name,
      status: existing.status,
      basePortions: existing.basePortions,
      portionUnit: existing.portionUnit,
      notes: existing.notes,
      tags: existing.recipeTags.map((rt) => ({ id: rt.tag.id, name: rt.tag.name, color: rt.tag.color })),
      ingredients: existing.ingredients.map((i) => ({
        productId: i.productId,
        productName: i.product?.name ?? null,
        subRecipeId: i.subRecipeId,
        subRecipeName: i.subRecipe?.name ?? null,
        quantity: i.quantity,
        unit: i.unit,
        sortOrder: i.sortOrder,
      })),
    };
    await prisma.recipeHistory.create({
      data: {
        recipeId,
        changedBy: user.userId,
        changeNote: "Edycja receptury",
        snapshot,
      },
    });

    if (name !== undefined && name.trim().length < 3) {
      return NextResponse.json({ error: "Nazwa receptury jest wymagana (min. 3 znaki)" }, { status: 400 });
    }

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

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim() || existing.name;
    if (basePortions !== undefined) data.basePortions = Math.max(0.001, Number(basePortions) || 1);
    if (portionUnit !== undefined) data.portionUnit = String(portionUnit || "porcja").slice(0, 20);
    if (status !== undefined && ["AKTYWNA", "ARCHIWALNA"].includes(status)) {
      data.status = status;
    }
    if (notes !== undefined) data.notes = notes?.trim() || null;

    await prisma.$transaction([
      prisma.recipeDishIngredient.deleteMany({ where: { recipeId } }),
      prisma.recipeDishTag.deleteMany({ where: { recipeId } }),
      prisma.recipeDish.update({
        where: { id: recipeId },
        data: {
          ...data,
          ingredients: { create: validIngredients },
          recipeTags: { create: (tagIds || []).map((tagId: number) => ({ tagId })) },
        },
      }),
    ]);

    const updated = await prisma.recipeDish.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { include: { product: true, subRecipe: true } },
        recipeTags: { include: { tag: true } },
      },
    });
    if (!updated) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
    return NextResponse.json({
      ...updated,
      ingredients: updated.ingredients.map((i) => ({
        ...i,
        productName: i.product?.name ?? null,
        subRecipeName: i.subRecipe?.name ?? null,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji receptury" }, { status: 500 });
  }
}

/** PATCH /api/receptury/[id] — częściowa aktualizacja (tylko status i/lub tagIds) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;

  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    const body = await request.json();
    const { status, tagIds } = body as { status?: string; tagIds?: number[] };

    const existing = await prisma.recipeDish.findUnique({ where: { id: recipeId } });
    if (!existing) return NextResponse.json({ error: "Receptura nie znaleziona" }, { status: 404 });

    const updates: { status?: "AKTYWNA" | "ARCHIWALNA" } = {};
    if (status !== undefined && ["AKTYWNA", "ARCHIWALNA"].includes(status)) {
      updates.status = status as "AKTYWNA" | "ARCHIWALNA";
    }

    if (tagIds !== undefined) {
      await prisma.recipeDishTag.deleteMany({ where: { recipeId } });
      const ids = Array.isArray(tagIds) ? tagIds.filter((id): id is number => Number.isInteger(id)) : [];
      if (ids.length > 0) {
        await prisma.recipeDishTag.createMany({
          data: ids.map((tagId) => ({ recipeId, tagId })),
        });
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.recipeDish.update({
        where: { id: recipeId },
        data: updates,
      });
    }

    const updated = await prisma.recipeDish.findUnique({
      where: { id: recipeId },
      include: { recipeTags: { include: { tag: true } } },
    });
    if (!updated) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      tags: updated.recipeTags.map((rt) => ({ id: rt.tag.id, name: rt.tag.name, color: rt.tag.color })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji receptury" }, { status: 500 });
  }
}

/** DELETE /api/receptury/[id] — archiwizacja (isArchived = true) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireRecepturyAccess();
  if (check.error) return check.error;

  try {
    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });

    await prisma.recipeDish.update({
      where: { id: recipeId },
      data: { isArchived: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd archiwizacji receptury" }, { status: 500 });
  }
}
