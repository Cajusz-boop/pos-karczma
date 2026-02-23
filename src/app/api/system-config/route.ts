import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';


const DEFAULT_CONFIG: Record<string, unknown> = {
  maxOrderNumber: 9999,
  resetOrderNumberDaily: true,
  resetOrderNumberAfterShift: false,
  cashDeclarationPerUser: false,
  shiftReportPerWorkstation: false,
  useOwnInvoiceNumbers: false,
  maintainDateAcrossShift: false,
  timeFromLastModification: false,
  fiscalErrorAllowContinue: false,
  hideSetContentsOnClick: false,
  reservationAlertMinutes: 30,
  billingIntervalMinutes: null,
  rwDocumentTypes: ["Straty", "Surowce", "ZuĹĽycie"],
  vatDescriptions: {
    A: "UsĹ‚ugi gastronomiczne",
    B: "UsĹ‚ugi gastronomiczne",
    C: "UsĹ‚ugi gastronomiczne",
  },
};

/**
 * GET /api/system-config - get all system config
 */
export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany();
    
    const result: Record<string, unknown> = { ...DEFAULT_CONFIG };
    for (const config of configs) {
      result[config.key] = config.value;
    }

    return NextResponse.json({ config: result, defaults: DEFAULT_CONFIG });
  } catch (e) {
    console.error("[SystemConfig GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania konfiguracji" }, { status: 500 });
  }
}

/**
 * PUT /api/system-config - update system config
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Klucz jest wymagany" }, { status: 400 });
    }

    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    const config = await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SYSTEM_CONFIG_UPDATED", "SystemConfig", config.id, { key, oldValue: existing?.value }, { key, value });

    return NextResponse.json({ config, message: `Ustawienie "${key}" zaktualizowane` });
  } catch (e) {
    console.error("[SystemConfig PUT]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d aktualizacji konfiguracji" }, { status: 500 });
  }
}

/**
 * PATCH /api/system-config - bulk update multiple keys
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "NieprawidĹ‚owe dane" }, { status: 400 });
    }

    const updates: { key: string; value: unknown }[] = [];

    for (const [key, value] of Object.entries(body)) {
      await prisma.systemConfig.upsert({
        where: { key },
        create: { key, value: value as object },
        update: { value: value as object },
      });
      updates.push({ key, value });
    }

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SYSTEM_CONFIG_BULK_UPDATE", "SystemConfig", "bulk", undefined, { updates });

    return NextResponse.json({
      message: `Zaktualizowano ${updates.length} ustawieĹ„`,
      updated: updates.map((u) => u.key),
    });
  } catch (e) {
    console.error("[SystemConfig PATCH]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d aktualizacji konfiguracji" }, { status: 500 });
  }
}

/**
 * DELETE /api/system-config - reset config to default
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Klucz jest wymagany" }, { status: 400 });
    }

    await prisma.systemConfig.delete({
      where: { key },
    }).catch(() => {});

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SYSTEM_CONFIG_RESET", "SystemConfig", key);

    const defaultValue = DEFAULT_CONFIG[key] ?? null;

    return NextResponse.json({
      message: `Ustawienie "${key}" przywrĂłcone do domyĹ›lnego`,
      defaultValue,
    });
  } catch (e) {
    console.error("[SystemConfig DELETE]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d resetowania konfiguracji" }, { status: 500 });
  }
}
