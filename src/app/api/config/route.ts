import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

const KNOWN_KEYS = [
  "companyName",
  "companyNip",
  "companyAddress",
  "invoiceNumberPrefix",
  "currency",
  "sessionTimeoutMinutes",
  "autoReportTime",
  "discountThresholdPercent",
] as const;

/** GET /api/config — zwraca znane klucze z SystemConfig */
export async function GET() {
  try {
    const rows = await prisma.systemConfig.findMany({
      where: { key: { in: [...KNOWN_KEYS] } },
    });
    const config: Record<string, unknown> = {};
    for (const r of rows) {
      config[r.key] = r.value;
    }
    for (const k of KNOWN_KEYS) {
      if (config[k] === undefined) {
        if (k === "companyName") config[k] = "Karczma Łabędź";
        else if (k === "currency") config[k] = "PLN";
        else if (k === "sessionTimeoutMinutes") config[k] = 5;
        else if (k === "autoReportTime") config[k] = "23:55";
        else if (k === "discountThresholdPercent") config[k] = 10;
        else if (k === "invoiceNumberPrefix") config[k] = "FV";
        else config[k] = null;
      }
    }
    return NextResponse.json(config);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd konfiguracji" }, { status: 500 });
  }
}

/** PATCH /api/config — zapisuje klucze (body: Record<string, unknown> lub { key, value }) */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = Array.isArray(body.entries)
      ? body.entries
      : body.key != null
        ? [[body.key, body.value]]
        : Object.entries(body);

    for (const [key, value] of entries as [string, unknown][]) {
      if (!key || typeof key !== "string") continue;
      await prisma.systemConfig.upsert({
        where: { key },
        create: { key, value: value != null ? (value as object) : {} },
        update: { value: value != null ? (value as object) : {} },
      });
    }

    autoExportConfigSnapshot();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu konfiguracji" }, { status: 500 });
  }
}
