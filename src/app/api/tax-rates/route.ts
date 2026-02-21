import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

const createSchema = z.object({
  name: z.string().min(1, "Wymagana nazwa").max(30),
  ratePercent: z.number().min(0).max(100),
  fiscalSymbol: z.string().min(1, "Wymagany symbol fiskalny").max(2),
  isDefault: z.boolean().optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(30).optional(),
  ratePercent: z.number().min(0).max(100).optional(),
  fiscalSymbol: z.string().min(1).max(2).optional(),
  isDefault: z.boolean().optional(),
});

/**
 * GET /api/tax-rates — list all tax rates with product count
 */
export async function GET() {
  try {
    const rates = await prisma.taxRate.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { fiscalSymbol: "asc" },
    });
    return NextResponse.json({ rates });
  } catch (e) {
    console.error("[TaxRates GET]", e);
    return NextResponse.json({ error: "Błąd pobierania stawek VAT" }, { status: 500 });
  }
}

/**
 * POST /api/tax-rates — create a new tax rate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    // Check unique fiscal symbol
    const existing = await prisma.taxRate.findFirst({
      where: { fiscalSymbol: parsed.data.fiscalSymbol },
    });
    if (existing) {
      return NextResponse.json({ error: `Symbol ${parsed.data.fiscalSymbol} jest już używany` }, { status: 400 });
    }

    // If setting as default, unset others
    if (parsed.data.isDefault) {
      await prisma.taxRate.updateMany({ data: { isDefault: false } });
    }

    const rate = await prisma.taxRate.create({
      data: {
        name: parsed.data.name,
        ratePercent: parsed.data.ratePercent,
        fiscalSymbol: parsed.data.fiscalSymbol,
        isDefault: parsed.data.isDefault ?? false,
      },
    });

    autoExportConfigSnapshot();

    return NextResponse.json({ rate }, { status: 201 });
  } catch (e) {
    console.error("[TaxRates POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia stawki VAT" }, { status: 500 });
  }
}

/**
 * PATCH /api/tax-rates — update a tax rate
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    const { id, ...data } = parsed.data;

    // Check unique fiscal symbol if changing
    if (data.fiscalSymbol) {
      const existing = await prisma.taxRate.findFirst({
        where: { fiscalSymbol: data.fiscalSymbol, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: `Symbol ${data.fiscalSymbol} jest już używany` }, { status: 400 });
      }
    }

    if (data.isDefault) {
      await prisma.taxRate.updateMany({ data: { isDefault: false } });
    }

    const rate = await prisma.taxRate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.ratePercent !== undefined && { ratePercent: data.ratePercent }),
        ...(data.fiscalSymbol !== undefined && { fiscalSymbol: data.fiscalSymbol }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });

    autoExportConfigSnapshot();

    return NextResponse.json({ rate });
  } catch (e) {
    console.error("[TaxRates PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji stawki VAT" }, { status: 500 });
  }
}
