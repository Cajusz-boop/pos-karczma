import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET - lista raportów skanera
export async function GET() {
  try {
    const reports = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: "scanner_report_",
        },
      },
      orderBy: {
        key: "desc",
      },
    });

    const parsedReports = reports.map((r) => {
      const data = r.value as Record<string, unknown>;
      const meta = data.meta as Record<string, unknown> | undefined;
      return {
        id: r.id,
        key: r.key,
        hostname: meta?.hostname || "Nieznany",
        timestamp: meta?.timestamp || r.key.replace("scanner_report_", ""),
        platform: data.platform || {},
        checks: data.checks || {},
        bistro: data.bistro || [],
        recommendations: data.recommendations || [],
        network: data.network || [],
        hardware: data.hardware || {},
      };
    });

    return NextResponse.json(parsedReports);
  } catch (error) {
    console.error("Error fetching scanner reports:", error);
    return NextResponse.json({ error: "Błąd pobierania raportów" }, { status: 500 });
  }
}

// POST - przyjmij nowy raport
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Walidacja podstawowa
    if (!body.meta || !body.checks) {
      return NextResponse.json({ error: "Nieprawidłowy format raportu" }, { status: 400 });
    }

    const timestamp = body.meta.timestamp || new Date().toISOString();
    const hostname = body.meta.hostname || "unknown";
    const key = `scanner_report_${timestamp.replace(/[:.]/g, "-")}_${hostname}`;

    // Zapisz raport w SystemConfig
    await prisma.systemConfig.upsert({
      where: { key },
      create: {
        key,
        value: body,
      },
      update: {
        value: body,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Raport zapisany",
      key,
    });
  } catch (error) {
    console.error("Error saving scanner report:", error);
    return NextResponse.json({ error: "Błąd zapisywania raportu" }, { status: 500 });
  }
}

// DELETE - usuń raport
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Brak klucza raportu" }, { status: 400 });
    }

    await prisma.systemConfig.delete({
      where: { key },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scanner report:", error);
    return NextResponse.json({ error: "Błąd usuwania raportu" }, { status: 500 });
  }
}
