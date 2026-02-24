import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const bulkScanSchema = z.object({
  barcodes: z.array(z.string().min(1)).min(1).max(50),
});

/**
 * POST /api/orders/weight-scan - bulk scan weight barcodes
 * Matches barcodes to pending weight confirmations and updates them
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bulkScanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { barcodes } = parsed.data;
    const userId = request.headers.get("x-user-id");

    const pendingItems = await prisma.orderItem.findMany({
      where: {
        requiresWeightConfirm: true,
        weightConfirmed: false,
        status: { in: ["ORDERED", "SENT", "IN_PROGRESS", "READY"] },
      },
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
        product: { select: { id: true, name: true, priceGross: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const results: {
      barcode: string;
      success: boolean;
      itemId?: string;
      orderNumber?: number;
      productName?: string;
      weight?: number;
      error?: string;
    }[] = [];

    for (const barcode of barcodes) {
      let weight: number | null = null;
      let plu: string | null = null;

      if (barcode.length === 13 && barcode.startsWith("2")) {
        plu = barcode.substring(1, 7);
        const weightStr = barcode.substring(7, 12);
        weight = parseInt(weightStr) / 1000;
      } else if (barcode.length === 8) {
        plu = barcode.substring(0, 2);
        const weightStr = barcode.substring(2, 7);
        weight = parseInt(weightStr) / 1000;
      }

      if (weight === null || isNaN(weight) || weight <= 0) {
        results.push({
          barcode,
          success: false,
          error: "Nieprawidłowy format kodu",
        });
        continue;
      }

      const matchingItem = pendingItems.find(
        (item) => !item.weightConfirmed && item.order.status !== "CLOSED"
      );

      if (!matchingItem) {
        results.push({
          barcode,
          success: false,
          weight,
          error: "Brak pozycji oczekującej na wagę",
        });
        continue;
      }

      await prisma.orderItem.update({
        where: { id: matchingItem.id },
        data: {
          weightConfirmed: true,
          confirmedWeight: weight,
          weightConfirmedAt: new Date(),
          weightConfirmedBy: userId,
          weightBarcodeScanned: barcode,
          quantity: weight,
          unitPrice: Number(matchingItem.product.priceGross),
        },
      });

      matchingItem.weightConfirmed = true;

      await auditLog(
        userId,
        "ORDER_ITEM_WEIGHT_BULK_SCAN",
        "OrderItem",
        matchingItem.id,
        undefined,
        {
          orderId: matchingItem.order.id,
          barcode,
          weight,
          plu,
        }
      );

      results.push({
        barcode,
        success: true,
        itemId: matchingItem.id,
        orderNumber: matchingItem.order.orderNumber,
        productName: matchingItem.product.name,
        weight,
      });
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Zeskanowano ${successCount} pozycji, ${failedCount} błędów`,
      successCount,
      failedCount,
      results,
    });
  } catch (e) {
    console.error("[WeightScan POST]", e);
    return NextResponse.json({ error: "Błąd skanowania wag" }, { status: 500 });
  }
}

/**
 * GET /api/orders/weight-scan - get items awaiting weight confirmation
 */
export async function GET() {
  try {
    const pendingItems = await prisma.orderItem.findMany({
      where: {
        requiresWeightConfirm: true,
        weightConfirmed: false,
        order: { status: { not: "CLOSED" } },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            tableId: true,
            table: { select: { number: true } },
          },
        },
        product: { select: { name: true, unit: true, priceGross: true } },
      },
      orderBy: [{ order: { createdAt: "asc" } }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      pendingCount: pendingItems.length,
      items: pendingItems.map((item) => ({
        id: item.id,
        orderId: item.order.id,
        orderNumber: item.order.orderNumber,
        tableNumber: item.order.table?.number ?? null,
        productName: item.product.name,
        unit: item.product.unit,
        pricePerUnit: Number(item.product.priceGross),
        estimatedQuantity: Number(item.quantity),
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[WeightScan GET]", e);
    return NextResponse.json({ error: "Błąd pobierania pozycji" }, { status: 500 });
  }
}
