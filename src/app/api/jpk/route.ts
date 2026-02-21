import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJpkV7M } from "@/lib/jpk/jpk-v7m";
import { auditLog } from "@/lib/audit";

/**
 * GET /api/jpk?year=2026&month=2 — generate JPK_V7M XML
 * Returns XML file as download.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get("year");
    const monthStr = searchParams.get("month");

    if (!yearStr || !monthStr) {
      return NextResponse.json(
        { error: "Wymagane parametry: year, month" },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Nieprawidłowy rok lub miesiąc" },
        { status: 400 }
      );
    }

    // Get company config
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { in: ["companyNip", "companyName", "companyAddress", "companyEmail", "companyPhone"] },
      },
    });

    const configMap: Record<string, string> = {};
    for (const c of configs) {
      configMap[c.key] = typeof c.value === "string" ? c.value : String(c.value ?? "");
    }

    const jpkConfig = {
      nip: configMap.companyNip || "0000000000",
      companyName: configMap.companyName || "Karczma Łabędź",
      companyAddress: configMap.companyAddress || "",
      email: configMap.companyEmail || undefined,
      phone: configMap.companyPhone || undefined,
    };

    const xml = await generateJpkV7M(year, month, jpkConfig);

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "JPK_GENERATE", "JPK", `${year}-${String(month).padStart(2, "0")}`, undefined, {
      year,
      month,
      xmlLength: xml.length,
    });

    const filename = `JPK_V7M_${year}_${String(month).padStart(2, "0")}.xml`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd generowania JPK_V7M" },
      { status: 500 }
    );
  }
}
