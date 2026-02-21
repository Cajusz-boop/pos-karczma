import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export async function GET() {
  try {
    const menus = await prisma.banquetMenu.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(
      menus.map((m) => ({
        id: m.id,
        name: m.name,
        eventType: m.eventType,
        itemsJson: m.itemsJson,
        pricePerPerson: Number(m.pricePerPerson),
        isTemplate: m.isTemplate,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania menu bankietowych" }, { status: 500 });
  }
}

type MenuItem = { productId: string; name: string; quantity: number; courseNumber: number };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, eventType, items, pricePerPerson, isTemplate } = body as {
      name: string;
      eventType?: string | null;
      items: MenuItem[];
      pricePerPerson: number;
      isTemplate?: boolean;
    };
    if (!name?.trim()) return NextResponse.json({ error: "Nazwa menu jest wymagana" }, { status: 400 });
    const itemsNorm = (Array.isArray(items) ? items : []).map((i) => ({
      productId: i.productId,
      name: i.name ?? "",
      quantity: Number(i.quantity) || 1,
      courseNumber: Number(i.courseNumber) || 1,
    }));
    const menu = await prisma.banquetMenu.create({
      data: {
        name: name.trim(),
        eventType: eventType?.trim() ?? null,
        itemsJson: itemsNorm as unknown as object,
        pricePerPerson: Number(pricePerPerson) || 0,
        isTemplate: isTemplate ?? true,
      },
    });
    autoExportConfigSnapshot();
    return NextResponse.json({ id: menu.id, name: menu.name });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd tworzenia menu" }, { status: 500 });
  }
}
