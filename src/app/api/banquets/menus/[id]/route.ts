import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menu = await prisma.banquetMenu.findUnique({ where: { id } });
    if (!menu) return NextResponse.json({ error: "Menu nie istnieje" }, { status: 404 });
    return NextResponse.json({
      id: menu.id,
      name: menu.name,
      eventType: menu.eventType,
      itemsJson: menu.itemsJson,
      pricePerPerson: Number(menu.pricePerPerson),
      isTemplate: menu.isTemplate,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania menu" }, { status: 500 });
  }
}

type MenuItem = { productId: string; name: string; quantity: number; courseNumber: number };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, eventType, items, pricePerPerson, isTemplate } = body as {
      name?: string;
      eventType?: string | null;
      items?: MenuItem[];
      pricePerPerson?: number;
      isTemplate?: boolean;
    };
    const menu = await prisma.banquetMenu.findUnique({ where: { id } });
    if (!menu) return NextResponse.json({ error: "Menu nie istnieje" }, { status: 404 });
    const data: { name?: string; eventType?: string | null; itemsJson?: object; pricePerPerson?: number; isTemplate?: boolean } = {};
    if (name != null) data.name = name.trim();
    if (eventType !== undefined) data.eventType = eventType?.trim() ?? null;
    if (items !== undefined) {
      data.itemsJson = (Array.isArray(items) ? items : []).map((i) => ({
        productId: i.productId,
        name: i.name ?? "",
        quantity: Number(i.quantity) || 1,
        courseNumber: Number(i.courseNumber) || 1,
      })) as unknown as object;
    }
    if (pricePerPerson !== undefined) data.pricePerPerson = Number(pricePerPerson);
    if (isTemplate !== undefined) data.isTemplate = Boolean(isTemplate);
    const updated = await prisma.banquetMenu.update({ where: { id }, data });
    autoExportConfigSnapshot();
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji menu" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menu = await prisma.banquetMenu.findUnique({ where: { id }, include: { events: true } });
    if (!menu) return NextResponse.json({ error: "Menu nie istnieje" }, { status: 404 });
    if (menu.events.length > 0) {
      return NextResponse.json({ error: "Menu jest przypisane do imprez. Nie można usunąć." }, { status: 400 });
    }
    await prisma.banquetMenu.delete({ where: { id } });
    autoExportConfigSnapshot();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania menu" }, { status: 500 });
  }
}
