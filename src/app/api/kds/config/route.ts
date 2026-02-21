import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export interface KDSConfig {
  defaultMode: "tile" | "allday" | "expo";
  fontSize: "SM" | "MD" | "LG" | "XL";
  soundEnabled: boolean;
  soundNewOrder: string;
  soundAlarm: string;
  warningMinutes: number;
  criticalMinutes: number;
  autoRefreshSeconds: number;
  showAllergens: boolean;
  showModifiers: boolean;
  showCourseNumber: boolean;
  darkMode: boolean;
}

const DEFAULT_CONFIG: KDSConfig = {
  defaultMode: "tile",
  fontSize: "MD",
  soundEnabled: true,
  soundNewOrder: "chime",
  soundAlarm: "alarm",
  warningMinutes: 10,
  criticalMinutes: 20,
  autoRefreshSeconds: 5,
  showAllergens: true,
  showModifiers: true,
  showCourseNumber: true,
  darkMode: true,
};

const CONFIG_KEY = "kds_config";

/**
 * GET /api/kds/config — get KDS configuration
 */
export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    if (config?.value && typeof config.value === "object") {
      return NextResponse.json({ config: { ...DEFAULT_CONFIG, ...(config.value as object) } });
    }
    return NextResponse.json({ config: DEFAULT_CONFIG });
  } catch (e) {
    console.error("[KDS Config GET]", e);
    return NextResponse.json({ config: DEFAULT_CONFIG });
  }
}

/**
 * PUT /api/kds/config — update KDS configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const config: KDSConfig = {
      defaultMode: body.defaultMode ?? DEFAULT_CONFIG.defaultMode,
      fontSize: body.fontSize ?? DEFAULT_CONFIG.fontSize,
      soundEnabled: body.soundEnabled ?? DEFAULT_CONFIG.soundEnabled,
      soundNewOrder: body.soundNewOrder ?? DEFAULT_CONFIG.soundNewOrder,
      soundAlarm: body.soundAlarm ?? DEFAULT_CONFIG.soundAlarm,
      warningMinutes: Math.max(1, Number(body.warningMinutes) || DEFAULT_CONFIG.warningMinutes),
      criticalMinutes: Math.max(1, Number(body.criticalMinutes) || DEFAULT_CONFIG.criticalMinutes),
      autoRefreshSeconds: Math.max(1, Number(body.autoRefreshSeconds) || DEFAULT_CONFIG.autoRefreshSeconds),
      showAllergens: body.showAllergens ?? DEFAULT_CONFIG.showAllergens,
      showModifiers: body.showModifiers ?? DEFAULT_CONFIG.showModifiers,
      showCourseNumber: body.showCourseNumber ?? DEFAULT_CONFIG.showCourseNumber,
      darkMode: body.darkMode ?? DEFAULT_CONFIG.darkMode,
    };

    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: config as unknown as object },
      update: { value: config as unknown as object },
    });

    autoExportConfigSnapshot();
    return NextResponse.json({ config });
  } catch (e) {
    console.error("[KDS Config PUT]", e);
    return NextResponse.json({ error: "Błąd zapisu konfiguracji KDS" }, { status: 500 });
  }
}
