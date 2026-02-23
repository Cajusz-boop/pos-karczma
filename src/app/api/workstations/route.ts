import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';

function toJsonInput<T>(value: T | null | undefined): T | typeof Prisma.JsonNull | undefined {
  if (value === null) return Prisma.JsonNull;
  return value;
}

const createWorkstationSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  allowedCategoryIds: z.array(z.string()).nullable().optional(),
  allowedRoomIds: z.array(z.string()).nullable().optional(),
  defaultPriceLevelId: z.string().nullable().optional(),
  defaultRoomId: z.string().nullable().optional(),
  askQuantityRegular: z.boolean().optional(),
  askQuantityWeighted: z.boolean().optional(),
  askPrice: z.boolean().optional(),
  askPriceManual: z.boolean().optional(),
  autoSendKitchen: z.boolean().optional(),
  autoLogoutOnChange: z.boolean().optional(),
  refreshOnExit: z.boolean().optional(),
  showOtherGroups: z.boolean().optional(),
  ordersOldestFirst: z.boolean().optional(),
  showOnlyOwn: z.boolean().optional(),
  pluginOnEnter: z.string().nullable().optional(),
  pluginOnExit: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const updateWorkstationSchema = createWorkstationSchema.partial().extend({
  id: z.string().min(1),
});

/**
 * GET /api/workstations - list all workstations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const workstations = await prisma.workstationConfig.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ workstations });
  } catch (e) {
    console.error("[Workstations GET]", e);
    return NextResponse.json({ error: "Błąd pobierania stanowisk" }, { status: 500 });
  }
}

/**
 * POST /api/workstations - create workstation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createWorkstationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const existing = await prisma.workstationConfig.findUnique({
      where: { name: parsed.data.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Stanowisko "${parsed.data.name}" już istnieje` },
        { status: 400 }
      );
    }

    const workstation = await prisma.workstationConfig.create({
      data: {
        ...parsed.data,
        allowedCategoryIds: toJsonInput(parsed.data.allowedCategoryIds),
        allowedRoomIds: toJsonInput(parsed.data.allowedRoomIds),
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "WORKSTATION_CREATED", "WorkstationConfig", workstation.id, undefined, {
      name: workstation.name,
    });

    return NextResponse.json({ workstation }, { status: 201 });
  } catch (e) {
    console.error("[Workstations POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia stanowiska" }, { status: 500 });
  }
}

/**
 * PATCH /api/workstations - update workstation
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateWorkstationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    if (updateData.name) {
      const existing = await prisma.workstationConfig.findFirst({
        where: { name: updateData.name, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Stanowisko "${updateData.name}" już istnieje` },
          { status: 400 }
        );
      }
    }

    const workstation = await prisma.workstationConfig.update({
      where: { id },
      data: {
        ...updateData,
        allowedCategoryIds: updateData.allowedCategoryIds !== undefined
          ? toJsonInput(updateData.allowedCategoryIds)
          : undefined,
        allowedRoomIds: updateData.allowedRoomIds !== undefined
          ? toJsonInput(updateData.allowedRoomIds)
          : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "WORKSTATION_UPDATED", "WorkstationConfig", id, undefined, updateData);

    return NextResponse.json({ workstation });
  } catch (e) {
    console.error("[Workstations PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji stanowiska" }, { status: 500 });
  }
}

/**
 * DELETE /api/workstations - delete workstation
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brak ID stanowiska" }, { status: 400 });
    }

    await prisma.workstationConfig.delete({
      where: { id },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "WORKSTATION_DELETED", "WorkstationConfig", id);

    return NextResponse.json({ message: "Stanowisko usunięte" });
  } catch (e) {
    console.error("[Workstations DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania stanowiska" }, { status: 500 });
  }
}
