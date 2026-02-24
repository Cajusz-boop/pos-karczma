import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PermissionsJson = {
  operations?: {
    discount?: boolean;
    discountMax?: number;
    freeItem?: boolean;
  };
};

/**
 * POST /api/orders/[id]/discount/validate - validate if user can apply discount
 * 
 * Checks user permissions for:
 * - Whether they can apply discounts at all
 * - Maximum discount percentage allowed
 * - Whether they can give free items
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { userId, discountPercent, discountAmount, isFreeItem } = body;

    if (!userId) {
      return NextResponse.json({ error: "Brak ID użytkownika" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { permissions: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }

    const rolePerms = (user.role.permissions as PermissionsJson) ?? {};
    const userPerms = (user.permissionsJson as PermissionsJson) ?? {};

    const canDiscount = userPerms.operations?.discount ?? rolePerms.operations?.discount ?? true;
    const maxDiscount = userPerms.operations?.discountMax ?? rolePerms.operations?.discountMax ?? 100;
    const canFreeItem = userPerms.operations?.freeItem ?? rolePerms.operations?.freeItem ?? true;

    if (isFreeItem) {
      if (!canFreeItem) {
        return NextResponse.json({
          allowed: false,
          reason: "Nie masz uprawnień do dawania darmowych pozycji",
          requiresAuthorization: true,
        });
      }
      return NextResponse.json({ allowed: true });
    }

    if (!canDiscount) {
      return NextResponse.json({
        allowed: false,
        reason: "Nie masz uprawnień do udzielania rabatów",
        requiresAuthorization: true,
      });
    }

    const requestedPercent = discountPercent ?? 0;

    if (requestedPercent > maxDiscount) {
      return NextResponse.json({
        allowed: false,
        reason: `Twój limit rabatu to ${maxDiscount}%. Żądany rabat: ${requestedPercent}%`,
        maxAllowed: maxDiscount,
        requiresAuthorization: true,
      });
    }

    if (discountAmount !== undefined) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            where: { status: { not: "CANCELLED" } },
            select: { quantity: true, unitPrice: true },
          },
        },
      });

      if (order) {
        const orderTotal = order.items.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
          0
        );
        const effectivePercent = orderTotal > 0 ? (discountAmount / orderTotal) * 100 : 0;

        if (effectivePercent > maxDiscount) {
          return NextResponse.json({
            allowed: false,
            reason: `Rabat kwotowy ${discountAmount.toFixed(2)} zł to ${effectivePercent.toFixed(1)}% zamówienia. Twój limit to ${maxDiscount}%`,
            maxAllowed: maxDiscount,
            maxAmount: (orderTotal * maxDiscount) / 100,
            requiresAuthorization: true,
          });
        }
      }
    }

    return NextResponse.json({
      allowed: true,
      maxDiscount,
      canFreeItem,
    });
  } catch (e) {
    console.error("[DiscountValidate POST]", e);
    return NextResponse.json({ error: "Błąd walidacji rabatu" }, { status: 500 });
  }
}
