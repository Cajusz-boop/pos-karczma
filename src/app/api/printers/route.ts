export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";


/** GET /api/printers "” lista drukarek (filtr: type, isActive) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");

    const where: Prisma.PrinterWhereInput = {};
    if (type) where.type = type as "FISCAL" | "KITCHEN" | "BAR" | "SYSTEM";
    if (isActive === "true" || isActive === "false") where.isActive = isActive === "true";

    const printers = await prisma.printer.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        categoryAssignments: { include: { category: { select: { id: true, name: true } } } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      printers.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        connectionType: p.connectionType,
        address: p.address,
        port: p.port,
        model: p.model,
        isActive: p.isActive,
        categories: p.categoryAssignments.map((a) => ({ id: a.category.id, name: a.category.name })),
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd listy drukarek" }, { status: 500 });
  }
}

/** POST /api/printers "” dodanie drukarki */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, connectionType, address, port, model, isActive } = body as {
      name: string;
      type: string;
      connectionType?: string;
      address?: string | null;
      port?: number | null;
      model?: string | null;
      isActive?: boolean;
    };

    if (!name?.trim() || !type) {
      return NextResponse.json({ error: "Wymagane: name, type" }, { status: 400 });
    }

    const validTypes = ["FISCAL", "KITCHEN", "BAR", "SYSTEM"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Nieprawidłowy typ drukarki" }, { status: 400 });
    }

    const printer = await prisma.printer.create({
      data: {
        name: name.trim(),
        type: type as "FISCAL" | "KITCHEN" | "BAR" | "SYSTEM",
        connectionType: connectionType ?? "USB",
        address: address?.trim() ?? null,
        port: port ?? null,
        model: model?.trim() ?? null,
        isActive: isActive !== false,
      },
    });

    autoExportConfigSnapshot();
    return NextResponse.json({ id: printer.id, name: printer.name, type: printer.type });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia drukarki" }, { status: 500 });
  }
}

/** PATCH /api/printers "” edycja drukarki i przypisanie kategorii */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, categoryIds, ...data } = body as {
      id?: string;
      name?: string;
      type?: string;
      connectionType?: string;
      address?: string | null;
      port?: number | null;
      model?: string | null;
      isActive?: boolean;
      categoryIds?: string[];
    };

    if (!id) {
      return NextResponse.json({ error: "Wymagane id drukarki" }, { status: 400 });
    }

    // Update printer fields
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.connectionType !== undefined) updateData.connectionType = data.connectionType;
    if (data.address !== undefined) updateData.address = data.address?.trim() ?? null;
    if (data.port !== undefined) updateData.port = data.port;
    if (data.model !== undefined) updateData.model = data.model?.trim() ?? null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const printer = await prisma.printer.update({
      where: { id },
      data: updateData,
    });

    // Update category assignments if provided
    if (categoryIds !== undefined) {
      await prisma.printerCategory.deleteMany({ where: { printerId: id } });
      if (categoryIds.length > 0) {
        await prisma.printerCategory.createMany({
          data: categoryIds.map((categoryId) => ({ printerId: id, categoryId })),
        });
      }
    }

    autoExportConfigSnapshot();
    return NextResponse.json({ printer });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji drukarki" }, { status: 500 });
  }
}

/** DELETE /api/printers "” usunięcie drukarki */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Wymagane id" }, { status: 400 });
    }

    // Remove category assignments first
    await prisma.printerCategory.deleteMany({ where: { printerId: id } });
    await prisma.printer.delete({ where: { id } });

    autoExportConfigSnapshot();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania drukarki" }, { status: 500 });
  }
}
