import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const addHelperSetSchema = z.object({
  productId: z.string().min(1, "ID produktu jest wymagane"),
  quantity: z.number().min(0.001).default(1),
  courseNumber: z.number().int().min(1).default(1),
});

/**
 * POST /api/orders/[id]/add-helper-set - add helper set (auto-adds components without main line)
 * 
 * Helper sets are special sets that automatically expand into their components
 * without showing the set itself as a line item.
 * Example: "Zestaw śniadaniowy" adds eggs, bread, butter as separate items
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const parsed = addHelperSetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { productId, quantity, courseNumber } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }

    if (order.status !== "OPEN") {
      return NextResponse.json({ error: "Zamówienie nie jest otwarte" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        setComponents: {
          where: { isDefault: true },
          include: {
            component: {
              include: {
                taxRate: { select: { id: true } },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produkt nie istnieje" }, { status: 404 });
    }

    if (product.productType !== "HELPER_SET" && !product.isSet) {
      return NextResponse.json(
        { error: "Ten produkt nie jest zestawem helper" },
        { status: 400 }
      );
    }

    if (product.setComponents.length === 0) {
      return NextResponse.json(
        { error: "Zestaw nie ma żadnych domyślnych składników" },
        { status: 400 }
      );
    }

    const createdItems = await prisma.$transaction(
      product.setComponents.map((sc) =>
        prisma.orderItem.create({
          data: {
            orderId,
            productId: sc.componentId,
            quantity: Number(sc.quantity) * quantity,
            unitPrice: Number(sc.component.priceGross) + Number(sc.priceDelta),
            taxRateId: sc.component.taxRateId,
            courseNumber,
            status: "ORDERED",
            isSetComponent: true,
            note: sc.isHidden ? null : `[${product.name}]`,
          },
          include: {
            product: { select: { name: true } },
          },
        })
      )
    );

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "HELPER_SET_ADDED", "Order", orderId, undefined, {
      setName: product.name,
      componentCount: createdItems.length,
      components: createdItems.map((i) => i.product.name),
    });

    return NextResponse.json({
      message: `Dodano ${createdItems.length} pozycji z zestawu "${product.name}"`,
      items: createdItems.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      })),
    }, { status: 201 });
  } catch (e) {
    console.error("[AddHelperSet POST]", e);
    return NextResponse.json({ error: "Błąd dodawania zestawu helper" }, { status: 500 });
  }
}
