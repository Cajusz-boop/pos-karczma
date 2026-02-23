import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export const dynamic = 'force-dynamic';


const createGroupSchema = z.object({
  name: z.string().min(1, "Wymagana nazwa").max(50),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  modifiers: z.array(z.object({
    name: z.string().min(1),
    priceDelta: z.number().optional(),
    sortOrder: z.number().int().optional(),
  })).optional(),
});

const updateGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50).optional(),
  minSelect: z.number().int().min(0).optional(),
  maxSelect: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
});

const modifierSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(1).max(50),
  priceDelta: z.number().optional(),
  sortOrder: z.number().int().optional(),
});

const updateModifierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50).optional(),
  priceDelta: z.number().optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * GET /api/modifiers â€” list all modifier groups with modifiers
 */
export async function GET() {
  try {
    const groups = await prisma.modifierGroup.findMany({
      include: {
        modifiers: { orderBy: { sortOrder: "asc" } },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ groups });
  } catch (e) {
    console.error("[Modifiers GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania modyfikatorĂłw" }, { status: 500 });
  }
}

/**
 * POST /api/modifiers â€” create a group (optionally with modifiers) or add a modifier to a group
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Adding a single modifier to existing group
    if (body.groupId && !body.modifiers) {
      const parsed = modifierSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const modifier = await prisma.modifier.create({
        data: {
          groupId: parsed.data.groupId,
          name: parsed.data.name,
          priceDelta: parsed.data.priceDelta ?? 0,
          sortOrder: parsed.data.sortOrder ?? 0,
        },
      });
      autoExportConfigSnapshot();
      return NextResponse.json({ modifier }, { status: 201 });
    }

    // Creating a new group
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const group = await prisma.modifierGroup.create({
      data: {
        name: parsed.data.name,
        minSelect: parsed.data.minSelect ?? 0,
        maxSelect: parsed.data.maxSelect ?? 1,
        isRequired: parsed.data.isRequired ?? false,
        modifiers: parsed.data.modifiers ? {
          create: parsed.data.modifiers.map((m, idx) => ({
            name: m.name,
            priceDelta: m.priceDelta ?? 0,
            sortOrder: m.sortOrder ?? idx,
          })),
        } : undefined,
      },
      include: { modifiers: true },
    });

    autoExportConfigSnapshot();
    return NextResponse.json({ group }, { status: 201 });
  } catch (e) {
    console.error("[Modifiers POST]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d tworzenia" }, { status: 500 });
  }
}

/**
 * PATCH /api/modifiers â€” update a group or modifier
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Update modifier option
    if (body.modifierId) {
      const parsed = updateModifierSchema.safeParse({ id: body.modifierId, ...body });
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const { id, ...data } = parsed.data;
      const modifier = await prisma.modifier.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.priceDelta !== undefined && { priceDelta: data.priceDelta }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        },
      });
      autoExportConfigSnapshot();
      return NextResponse.json({ modifier });
    }

    // Update group
    const parsed = updateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const { id, ...data } = parsed.data;
    const group = await prisma.modifierGroup.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.minSelect !== undefined && { minSelect: data.minSelect }),
        ...(data.maxSelect !== undefined && { maxSelect: data.maxSelect }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
      },
    });
    autoExportConfigSnapshot();
    return NextResponse.json({ group });
  } catch (e) {
    console.error("[Modifiers PATCH]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d aktualizacji" }, { status: 500 });
  }
}

/**
 * DELETE /api/modifiers â€” delete a group or modifier
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const modifierId = searchParams.get("modifierId");

    if (modifierId) {
      await prisma.modifier.delete({ where: { id: modifierId } });
      autoExportConfigSnapshot();
      return NextResponse.json({ ok: true });
    }

    if (groupId) {
      const group = await prisma.modifierGroup.findUnique({
        where: { id: groupId },
        include: { _count: { select: { products: true } } },
      });
      if (group && group._count.products > 0) {
        return NextResponse.json(
          { error: `Grupa jest przypisana do ${group._count.products} produktĂłw` },
          { status: 400 }
        );
      }
      // Delete modifiers first
      await prisma.modifier.deleteMany({ where: { groupId } });
      await prisma.modifierGroup.delete({ where: { id: groupId } });
      autoExportConfigSnapshot();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Wymagane groupId lub modifierId" }, { status: 400 });
  } catch (e) {
    console.error("[Modifiers DELETE]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d usuwania" }, { status: 500 });
  }
}
