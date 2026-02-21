import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        order: { select: { orderNumber: true } },
        banquetEvent: { select: { id: true, eventType: true, guestCount: true } },
      },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Faktura nie istnieje" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd odczytu faktury" }, { status: 500 });
  }
}
