import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const GLOBAL_OPTIONS_DEFAULTS = {
  maxOrderNumber: 9999,
  resetOrderOnNewDay: true,
  resetOrderOnShiftEnd: false,
  cashDeclarationPerUser: false,
  shiftReportPerStation: false,
  customInvoiceNumbering: false,
  keepDateOverMidnight: false,
  showTimeFromLastModified: false,
  fiscalErrorAllowContinue: false,
  hideSetContentsOnClick: false,
  reservationWarningMinutes: 15,
  timeBillingEnabled: false,
  timeBillingIntervals: [],
  generalInvoiceDescriptions: { vat23: "", vat8: "", vat5: "", vat0: "" },
  rwDescriptions: { loss: "Straty", ingredients: "Surowce", usage: "Zużycie" },
};

const optionsSchema = z.object({
  maxOrderNumber: z.number().int().min(100).max(999999).optional(),
  resetOrderOnNewDay: z.boolean().optional(),
  resetOrderOnShiftEnd: z.boolean().optional(),
  cashDeclarationPerUser: z.boolean().optional(),
  shiftReportPerStation: z.boolean().optional(),
  customInvoiceNumbering: z.boolean().optional(),
  keepDateOverMidnight: z.boolean().optional(),
  showTimeFromLastModified: z.boolean().optional(),
  fiscalErrorAllowContinue: z.boolean().optional(),
  hideSetContentsOnClick: z.boolean().optional(),
  reservationWarningMinutes: z.number().int().min(0).max(120).optional(),
  timeBillingEnabled: z.boolean().optional(),
  timeBillingIntervals: z.array(z.object({
    minutes: z.number().int().min(1),
    price: z.number().min(0),
  })).optional(),
  generalInvoiceDescriptions: z.object({
    vat23: z.string().optional(),
    vat8: z.string().optional(),
    vat5: z.string().optional(),
    vat0: z.string().optional(),
  }).optional(),
  rwDescriptions: z.object({
    loss: z.string().optional(),
    ingredients: z.string().optional(),
    usage: z.string().optional(),
  }).optional(),
});

/**
 * GET /api/settings/global-options - get all global options
 */
export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "globalOptions" },
    });

    const options = config?.value
      ? { ...GLOBAL_OPTIONS_DEFAULTS, ...(config.value as object) }
      : GLOBAL_OPTIONS_DEFAULTS;

    return NextResponse.json({
      options,
      defaults: GLOBAL_OPTIONS_DEFAULTS,
    });
  } catch (e) {
    console.error("[GlobalOptions GET]", e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

/**
 * PUT /api/settings/global-options - update global options
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = optionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const existing = await prisma.systemConfig.findUnique({
      where: { key: "globalOptions" },
    });

    const newOptions = {
      ...(existing?.value as object ?? {}),
      ...parsed.data,
    };

    await prisma.systemConfig.upsert({
      where: { key: "globalOptions" },
      update: { value: newOptions },
      create: { key: "globalOptions", value: newOptions },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "GLOBAL_OPTIONS_UPDATED", "SystemConfig", "globalOptions", undefined, parsed.data);

    return NextResponse.json({
      options: { ...GLOBAL_OPTIONS_DEFAULTS, ...newOptions },
      message: "Opcje globalne zapisane",
    });
  } catch (e) {
    console.error("[GlobalOptions PUT]", e);
    return NextResponse.json({ error: "Błąd zapisywania" }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/global-options - reset to defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    await prisma.systemConfig.deleteMany({
      where: { key: "globalOptions" },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "GLOBAL_OPTIONS_RESET", "SystemConfig", "globalOptions");

    return NextResponse.json({
      options: GLOBAL_OPTIONS_DEFAULTS,
      message: "Przywrócono domyślne opcje globalne",
    });
  } catch (e) {
    console.error("[GlobalOptions DELETE]", e);
    return NextResponse.json({ error: "Błąd resetowania" }, { status: 500 });
  }
}
