import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";
import crypto from "crypto";

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `GV-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

const createVoucherSchema = z.object({
  initialValue: z.number().positive("Wartość musi być > 0").max(10000, "Max 10 000 zł"),
  expiresAt: z.string().datetime().optional(),
  customerName: z.string().max(100).optional(),
  note: z.string().max(200).optional(),
});

/**
 * GET /api/vouchers — list all vouchers (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const activeOnly = searchParams.get("active") === "true";

    if (code) {
      const voucher = await prisma.giftVoucher.findUnique({
        where: { code: code.toUpperCase().trim() },
        include: {
          soldByUser: { select: { id: true, name: true } },
          payments: {
            select: { id: true, amount: true, orderId: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!voucher) {
        return NextResponse.json({ error: "Voucher nie znaleziony" }, { status: 404 });
      }
      return NextResponse.json({ voucher });
    }

    const vouchers = await prisma.giftVoucher.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        soldByUser: { select: { id: true, name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ vouchers });
  } catch (e) {
    console.error("[Vouchers GET]", e);
    return NextResponse.json({ error: "Błąd pobierania voucherów" }, { status: 500 });
  }
}

/**
 * POST /api/vouchers — create (sell) a new voucher
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createVoucherSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { initialValue, expiresAt, customerName, note } = parsed.data;

    let code = generateVoucherCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.giftVoucher.findUnique({ where: { code } });
      if (!exists) break;
      code = generateVoucherCode();
      attempts++;
    }

    const userId = request.headers.get("x-user-id");

    const voucher = await prisma.giftVoucher.create({
      data: {
        code,
        initialValue,
        balance: initialValue,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        soldByUserId: userId,
        customerName: customerName ?? null,
        note: note ?? null,
      },
    });

    await auditLog(userId, "VOUCHER_CREATED", "GiftVoucher", voucher.id, undefined, {
      code,
      initialValue,
      customerName,
    });

    return NextResponse.json({ voucher }, { status: 201 });
  } catch (e) {
    console.error("[Vouchers POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia vouchera" }, { status: 500 });
  }
}

/**
 * PATCH /api/vouchers — deactivate a voucher
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isActive } = body as { id?: string; isActive?: boolean };

    if (!id) {
      return NextResponse.json({ error: "Wymagane id vouchera" }, { status: 400 });
    }

    const voucher = await prisma.giftVoucher.update({
      where: { id },
      data: { isActive: isActive ?? false },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "VOUCHER_UPDATED", "GiftVoucher", id, undefined, {
      isActive: voucher.isActive,
    });

    return NextResponse.json({ voucher });
  } catch (e) {
    console.error("[Vouchers PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji vouchera" }, { status: 500 });
  }
}
