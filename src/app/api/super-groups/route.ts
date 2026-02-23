import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';


const createSchema = z.object({
  number: z.number().int().min(1).max(10),
  name: z.string().min(1, "Nazwa jest wymagana"),
  categoryIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial().extend({
  id: z.string().min(1),
});

/**
 * GET /api/super-groups - list all super groups
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get("includeProducts") === "true";

    const superGroups = await prisma.superGroup.findMany({
      include: includeProducts ? {
        products: {
          where: { isActive: true },
          select: { id: true, name: true, priceGross: true },
        },
        _count: { select: { products: true } },
      } : {
        _count: { select: { products: true } },
      },
      orderBy: { number: "asc" },
    });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return NextResponse.json({
      superGroups: superGroups.map((sg) => ({
        id: sg.id,
        number: sg.number,
        name: sg.name,
        categoryIds: sg.categoryIds as string[],
        categoryNames: (sg.categoryIds as string[]).map((id) => categoryMap.get(id) ?? id),
        isActive: sg.isActive,
        productCount: sg._count.products,
        products: includeProducts && 'products' in sg ? sg.products : undefined,
      })),
    });
  } catch (e) {
    console.error("[SuperGroups GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania nadgrup" }, { status: 500 });
  }
}

/**
 * POST /api/super-groups - create super group
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { number, name, categoryIds, isActive } = parsed.data;

    const existing = await prisma.superGroup.findUnique({
      where: { number },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Nadgrupa o numerze ${number} juĹĽ istnieje` },
        { status: 400 }
      );
    }

    const superGroup = await prisma.superGroup.create({
      data: {
        number,
        name,
        categoryIds,
        isActive,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SUPER_GROUP_CREATED", "SuperGroup", superGroup.id, undefined, {
      number,
      name,
    });

    return NextResponse.json({ superGroup }, { status: 201 });
  } catch (e) {
    console.error("[SuperGroups POST]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d tworzenia nadgrupy" }, { status: 500 });
  }
}

/**
 * PATCH /api/super-groups - update super group
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    if (updateData.number !== undefined) {
      const existing = await prisma.superGroup.findFirst({
        where: { number: updateData.number, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Nadgrupa o numerze ${updateData.number} juĹĽ istnieje` },
          { status: 400 }
        );
      }
    }

    const superGroup = await prisma.superGroup.update({
      where: { id },
      data: updateData,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SUPER_GROUP_UPDATED", "SuperGroup", superGroup.id, undefined, updateData);

    return NextResponse.json({ superGroup });
  } catch (e) {
    console.error("[SuperGroups PATCH]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d aktualizacji nadgrupy" }, { status: 500 });
  }
}

/**
 * DELETE /api/super-groups - delete super group
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brak ID nadgrupy" }, { status: 400 });
    }

    await prisma.product.updateMany({
      where: { superGroupId: id },
      data: { superGroupId: null },
    });

    await prisma.superGroup.delete({
      where: { id },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SUPER_GROUP_DELETED", "SuperGroup", id);

    return NextResponse.json({ message: "Nadgrupa usuniÄ™ta" });
  } catch (e) {
    console.error("[SuperGroups DELETE]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d usuwania nadgrupy" }, { status: 500 });
  }
}
