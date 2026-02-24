export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** POST /api/printers/[id]/test — test wydruku (w trybie DEMO zwraca sukces bez wysyłki) */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const printer = await prisma.printer.findUnique({ where: { id } });
    if (!printer) return NextResponse.json({ error: "Drukarka nie istnieje" }, { status: 404 });

    // W trybie DEMO nie wysyłamy do sprzętu — symulacja sukcesu
    return NextResponse.json({
      ok: true,
      message: "Test wydruku zakończony (tryb DEMO — brak fizycznej drukarki)",
      printerName: printer.name,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd testu drukarki" }, { status: 500 });
  }
}
