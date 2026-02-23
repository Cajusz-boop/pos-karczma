import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';


/**
 * GET /api/gdpr?customerId= â€” export all personal data for a customer (Art. 15 RODO)
 * Returns JSON with all data related to the customer.
 */
export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId");
    const phone = request.nextUrl.searchParams.get("phone");

    if (!customerId && !phone) {
      return NextResponse.json(
        { error: "Wymagany parametr customerId lub phone" },
        { status: 400 }
      );
    }

    const customer = customerId
      ? await prisma.customer.findUnique({ where: { id: customerId } })
      : phone
      ? await prisma.customer.findUnique({ where: { phone } })
      : null;

    if (!customer) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
    }

    // Collect all personal data
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        guestCount: true,
        createdAt: true,
        closedAt: true,
        items: {
          select: {
            product: { select: { name: true } },
            quantity: true,
            unitPrice: true,
          },
        },
        payments: {
          select: {
            method: true,
            amount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const receipts = await prisma.receipt.findMany({
      where: {
        OR: [
          { customerPhone: customer.phone },
          { customerEmail: customer.email ?? undefined },
        ],
      },
      select: {
        id: true,
        fiscalNumber: true,
        deliveryMethod: true,
        printedAt: true,
      },
    });

    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { guestPhone: customer.phone },
          { guestEmail: customer.email ?? undefined },
        ],
      },
      select: {
        id: true,
        date: true,
        guestName: true,
        guestPhone: true,
        guestEmail: true,
        guestCount: true,
        status: true,
        notes: true,
        createdAt: true,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "GDPR_DATA_EXPORT", "Customer", customer.id, undefined, {
      phone: customer.phone,
    });

    return NextResponse.json({
      exportDate: new Date().toISOString(),
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        email: customer.email,
        notes: customer.notes,
        visitCount: customer.visitCount,
        lastVisit: customer.lastVisit?.toISOString() ?? null,
        createdAt: customer.createdAt.toISOString(),
      },
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        type: o.type,
        guestCount: o.guestCount,
        createdAt: o.createdAt.toISOString(),
        closedAt: o.closedAt?.toISOString() ?? null,
        items: o.items.map((i) => ({
          productName: i.product.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
        payments: o.payments.map((p) => ({
          method: p.method,
          amount: Number(p.amount),
          createdAt: p.createdAt.toISOString(),
        })),
      })),
      receipts: receipts.map((r) => ({
        id: r.id,
        fiscalNumber: r.fiscalNumber,
        deliveryMethod: r.deliveryMethod,
        printedAt: r.printedAt.toISOString(),
      })),
      reservations: reservations.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        guestName: r.guestName,
        guestPhone: r.guestPhone,
        guestEmail: r.guestEmail,
        guestCount: r.guestCount,
        status: r.status,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d eksportu danych RODO" }, { status: 500 });
  }
}

/**
 * DELETE /api/gdpr?customerId= â€” right to erasure (Art. 17 RODO)
 * Anonymizes personal data while preserving financial records (required by tax law).
 */
export async function DELETE(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json(
        { error: "Wymagany parametr customerId" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
    }

    // Anonymize customer data (preserve ID for order references)
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        phone: `ANON-${customerId.slice(0, 8)}`,
        name: "Dane usuniÄ™te (RODO)",
        email: null,
        notes: null,
      },
    });

    // Anonymize receipts
    await prisma.receipt.updateMany({
      where: { customerPhone: customer.phone },
      data: {
        customerPhone: null,
        customerEmail: null,
      },
    });

    if (customer.email) {
      await prisma.receipt.updateMany({
        where: { customerEmail: customer.email },
        data: {
          customerEmail: null,
        },
      });
    }

    // Anonymize reservations (keep for historical records but remove personal data)
    await prisma.reservation.updateMany({
      where: { guestPhone: customer.phone },
      data: {
        guestName: "Dane usuniÄ™te (RODO)",
        guestPhone: null,
        guestEmail: null,
        notes: null,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "GDPR_DATA_ERASURE", "Customer", customerId, {
      phone: customer.phone,
      name: customer.name,
    }, {
      anonymized: true,
    });

    return NextResponse.json({
      ok: true,
      customerId,
      message: "Dane osobowe zostaĹ‚y zanonimizowane zgodnie z Art. 17 RODO. Dane finansowe zachowane zgodnie z wymogami prawa podatkowego.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d usuwania danych RODO" }, { status: 500 });
  }
}

/**
 * POST /api/gdpr â€” record consent
 * Body: { customerId, consentType, granted }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, consentType, granted } = body as {
      customerId?: string;
      consentType?: string;
      granted?: boolean;
    };

    if (!customerId || !consentType) {
      return NextResponse.json(
        { error: "Wymagane: customerId, consentType" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Klient nie znaleziony" }, { status: 404 });
    }

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "GDPR_CONSENT", "Customer", customerId, undefined, {
      consentType,
      granted: granted ?? true,
      timestamp: new Date().toISOString(),
      phone: customer.phone,
    });

    return NextResponse.json({
      ok: true,
      customerId,
      consentType,
      granted: granted ?? true,
      recordedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "BĹ‚Ä…d zapisu zgody RODO" }, { status: 500 });
  }
}
