import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

/** GET /api/printers/[id] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const p = await prisma.printer.findUnique({
      where: { id },
      include: {
        categoryAssignments: { include: { category: { select: { id: true, name: true } } } },
      },
    });
    if (!p) return NextResponse.json({ error: "Drukarka nie istnieje" }, { status: 404 });
    return NextResponse.json({
      id: p.id,
      name: p.name,
      type: p.type,
      connectionType: p.connectionType,
      address: p.address,
      port: p.port,
      model: p.model,
      isActive: p.isActive,
      categories: p.categoryAssignments.map((a) => ({ id: a.category.id, name: a.category.name })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania drukarki" }, { status: 500 });
  }
}

/** PATCH /api/printers/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, connectionType, address, port, model, isActive } = body as {
      name?: string;
      type?: string;
      connectionType?: string;
      address?: string | null;
      port?: number | null;
      model?: string | null;
      isActive?: boolean;
    };

    const data: {
      name?: string;
      type?: "FISCAL" | "KITCHEN" | "BAR" | "SYSTEM";
      connectionType?: string;
      address?: string | null;
      port?: number | null;
      model?: string | null;
      isActive?: boolean;
    } = {};
    if (name !== undefined) data.name = name.trim();
    if (type !== undefined) {
      const valid = ["FISCAL", "KITCHEN", "BAR", "SYSTEM"];
      if (valid.includes(type)) data.type = type as "FISCAL" | "KITCHEN" | "BAR" | "SYSTEM";
    }
    if (connectionType !== undefined) data.connectionType = connectionType;
    if (address !== undefined) data.address = address?.trim() ?? null;
    if (port !== undefined) data.port = port ?? null;
    if (model !== undefined) data.model = model?.trim() ?? null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const printer = await prisma.printer.update({
      where: { id },
      data,
    });
    autoExportConfigSnapshot();
    return NextResponse.json(printer);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji drukarki" }, { status: 500 });
  }
}

/** DELETE /api/printers/[id] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.printerCategory.deleteMany({ where: { printerId: id } });
    await prisma.printer.delete({ where: { id } });
    autoExportConfigSnapshot();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania drukarki" }, { status: 500 });
  }
}
