export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health — health check endpoint
 * Returns system status including database connectivity.
 * Public route (no auth required).
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.database = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    {
      ok: allOk,
      timestamp: Date.now(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? "dev",
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}

export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
