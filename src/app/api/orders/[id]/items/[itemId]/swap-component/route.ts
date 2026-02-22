import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const swapSchema = z.object({
  removeProductId: z.string().min(1, "ID produktu do usunięcia jest wymagane"),
  addProductId: z.string().min(1, "ID produktu do dodania jest wymagane"),
});

type RemovedComponent = { productId: string; name: string };
type AddedComponent = { productId: string; name: string; price: number };

/**
 * POST /api/orders/[id]/items/[itemId]/swap-component - swap one component for another
 * 
 * Example: swap "ziemniaki" for "ryż" in a set meal
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json();
    const parsed = swapSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { removeProductId, addProductId } = parsed.data;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId },
      include: {
        product: {
          include: {
            setComponents: {
              include: {
                component: { select: { id: true, name: true, priceGross: true } },
              },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Pozycja nie istnieje" }, { status: 404 });
    }

    if (!item.product.isSet) {
      return NextResponse.json({ error: "Ta pozycja nie jest zestawem" }, { status: 400 });
    }

    const removeComponent = item.product.setComponents.find(
      (sc) => sc.componentId === removeProductId
    );

    if (!removeComponent) {
      return NextResponse.json(
        { error: "Produkt do usunięcia nie jest składnikiem tego zestawu" },
        { status: 400 }
      );
    }

    if (removeComponent.isRequired) {
      return NextResponse.json(
        { error: "Ten składnik jest wymagany i nie może być wymieniony" },
        { status: 400 }
      );
    }

    const addProduct = await prisma.product.findUnique({
      where: { id: addProductId },
      select: { id: true, name: true, priceGross: true },
    });

    if (!addProduct) {
      return NextResponse.json({ error: "Produkt do dodania nie istnieje" }, { status: 404 });
    }

    const removedComponents = (item.removedComponentsJson as RemovedComponent[] | null) ?? [];
    const addedComponents = (item.addedComponentsJson as AddedComponent[] | null) ?? [];

    if (!removedComponents.some((r) => r.productId === removeProductId)) {
      removedComponents.push({
        productId: removeProductId,
        name: removeComponent.component.name,
      });
    }

    const existingAddIndex = addedComponents.findIndex((a) => a.productId === addProductId);
    if (existingAddIndex >= 0) {
      addedComponents.splice(existingAddIndex, 1);
    }

    const addSetComponent = item.product.setComponents.find(
      (sc) => sc.componentId === addProductId
    );
    const addPrice = addSetComponent
      ? Number(addSetComponent.priceDelta)
      : Number(addProduct.priceGross) - Number(removeComponent.priceDelta);

    if (addPrice !== 0) {
      addedComponents.push({
        productId: addProductId,
        name: addProduct.name,
        price: addPrice,
      });
    }

    const priceChange = addedComponents.reduce((sum, c) => sum + c.price, 0);
    const basePrice = Number(item.product.priceGross);
    const newUnitPrice = Math.max(0, basePrice + priceChange);

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        removedComponentsJson: removedComponents,
        addedComponentsJson: addedComponents,
        unitPrice: newUnitPrice,
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SET_COMPONENT_SWAPPED", "OrderItem", itemId, undefined, {
      removed: removeComponent.component.name,
      added: addProduct.name,
      priceDelta: addPrice,
    });

    return NextResponse.json({
      message: `Wymieniono "${removeComponent.component.name}" na "${addProduct.name}"`,
      removedComponents,
      addedComponents,
      newUnitPrice,
    });
  } catch (e) {
    console.error("[SwapComponent POST]", e);
    return NextResponse.json({ error: "Błąd wymiany składnika" }, { status: 500 });
  }
}
