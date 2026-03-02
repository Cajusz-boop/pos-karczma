export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";


/**
 * GET /api/settings?key=xxx "” get a system config value
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const config = await prisma.systemConfig.findUnique({ where: { key } });
      return NextResponse.json({ key, value: config?.value ?? null });
    }

    const configs = await prisma.systemConfig.findMany();
    return NextResponse.json({
      settings: configs.map((c) => ({ key: c.key, value: c.value })),
    });
  } catch (e) {
    console.error("[Settings GET]", e);
    return NextResponse.json({ error: "Błąd pobierania ustawień" }, { status: 500 });
  }
}

/**
 * PUT /api/settings "” upsert a system config value
 * Body: { key, value }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body as { key?: string; value?: unknown };

    if (!key) {
      return NextResponse.json({ error: "Wymagany klucz" }, { status: 400 });
    }

    await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object },
    });

    autoExportConfigSnapshot();

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Settings PUT]", e);
    return NextResponse.json({ error: "Błąd zapisu ustawień" }, { status: 500 });
  }
}
