import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { sendPushToRole } from "@/lib/push/web-push";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

/**
 * GET /api/products/86 — list all products with availability status
 * Returns products grouped by category, highlighting unavailable ones.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    });

    const unavailable = products.filter((p) => !p.isAvailable);
    const available = products.filter((p) => p.isAvailable);

    return NextResponse.json({
      unavailable: unavailable.map((p) => ({
        id: p.id,
        name: p.name,
        categoryName: p.category.name,
        isAvailable: false,
      })),
      available: available.map((p) => ({
        id: p.id,
        name: p.name,
        categoryName: p.category.name,
        isAvailable: true,
      })),
      totalProducts: products.length,
      unavailableCount: unavailable.length,
    });
  } catch (e) {
    console.error("[86 Board GET]", e);
    return NextResponse.json({ error: "Błąd pobierania tablicy 86" }, { status: 500 });
  }
}

/**
 * POST /api/products/86 — toggle product availability (86 it or un-86 it)
 * Body: { productId, available }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, available } = body as { productId?: string; available?: boolean };

    if (!productId) {
      return NextResponse.json({ error: "Wymagane productId" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { isAvailable: available ?? false },
      select: { id: true, name: true, isAvailable: true },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, product.isAvailable ? "PRODUCT_AVAILABLE" : "PRODUCT_86", "Product", productId, undefined, {
      productName: product.name,
      isAvailable: product.isAvailable,
    });

    // Push notification to all waiters about availability change
    try {
      if (!product.isAvailable) {
        await sendPushToRole("WAITER", {
          title: "Produkt niedostępny (86)",
          body: `${product.name} — brak w kuchni`,
          icon: "/icon-192.png",
          data: { type: "PRODUCT_86", productId: product.id },
        });
      } else {
        await sendPushToRole("WAITER", {
          title: "Produkt znów dostępny",
          body: `${product.name} — przywrócony do menu`,
          icon: "/icon-192.png",
          data: { type: "PRODUCT_AVAILABLE", productId: product.id },
        });
      }
    } catch (pushErr) {
      console.error("[86 Board Push]", pushErr);
    }

    autoExportConfigSnapshot();

    return NextResponse.json({ product });
  } catch (e) {
    console.error("[86 Board POST]", e);
    return NextResponse.json({ error: "Błąd aktualizacji dostępności" }, { status: 500 });
  }
}
