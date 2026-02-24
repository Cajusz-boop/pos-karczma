export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";
import type { FiscalPrinterConfig } from "@/lib/fiscal";

const CONFIG_KEY = "fiscal_printer";

const DEFAULT_CONFIG: FiscalPrinterConfig = {
  mode: "DEMO",
  connectionType: "TCP",
  address: "",
  port: 9100,
  model: "Posnet Thermal",
  baudRate: 9600,
};

/** GET /api/fiscal/config — current fiscal printer configuration */
export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });

    const value = config?.value && typeof config.value === "object"
      ? { ...DEFAULT_CONFIG, ...(config.value as object) }
      : DEFAULT_CONFIG;

    return NextResponse.json(value);
  } catch (e) {
    console.error(e);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}

/** PUT /api/fiscal/config — update fiscal printer configuration */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mode,
      connectionType,
      address,
      port,
      model,
      baudRate,
    } = body as Partial<FiscalPrinterConfig>;

    const newConfig: FiscalPrinterConfig = {
      mode: mode === "LIVE" ? "LIVE" : "DEMO",
      connectionType: (connectionType as "USB" | "COM" | "TCP") ?? "TCP",
      address: address ?? "",
      port: port ?? 9100,
      model: model ?? "Posnet Thermal",
      baudRate: baudRate ?? 9600,
    };

    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: newConfig as unknown as object },
      update: { value: newConfig as unknown as object },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "FISCAL_CONFIG_UPDATE", "SystemConfig", CONFIG_KEY, undefined, {
      mode: newConfig.mode,
      connectionType: newConfig.connectionType,
      address: newConfig.address,
      port: newConfig.port,
    });

    autoExportConfigSnapshot();
    return NextResponse.json(newConfig);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu konfiguracji" }, { status: 500 });
  }
}
