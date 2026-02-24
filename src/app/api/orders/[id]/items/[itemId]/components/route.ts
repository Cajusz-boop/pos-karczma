export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const addComponentSchema = z.object({
  productId: z.string().min(1, "ID produktu jest wymagane"),
  quantity: z.number().min(0.001).default(1),
});

const removeComponentSchema = z.object({
  productId: z.string().min(1, "ID produktu jest wymagane"),
});

type RemovedComponent = { productId: string; name: string };
type AddedComponent = { productId: string; name: string; price: number };

/**
 * GET /api/orders/[id]/items/[itemId]/components - get item's set components
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_","itemId":"_"} ];
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        product: {
          include: {
            setComponents: {
              include: {
                component: {
                  select: { id: true, name: true, priceGross: true, isAvailable: true },
                },
              },
              orderBy: { sortOrder: "asc" },
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

    const removedComponents = (item.removedComponentsJson as RemovedComponent[] | null) ?? [];
    const addedComponents = (item.addedComponentsJson as AddedComponent[] | null) ?? [];

    const availableComponents = item.product.setComponents.map((sc) => ({
      productId: sc.componentId,
      name: sc.component.name,
      basePrice: Number(sc.component.priceGross),
      priceDelta: Number(sc.priceDelta),
      isRequired: sc.isRequired,
      isDefault: sc.isDefault,
      isAvailable: sc.component.isAvailable,
      isHidden: sc.isHidden,
      isRemoved: removedComponents.some((r) => r.productId === sc.componentId),
    }));

    return NextResponse.json({
      itemId: item.id,
      productName: item.product.name,
      maxComponents: item.product.maxComponents,
      freeComponents: item.product.freeComponents,
      availableComponents,
      removedComponents,
      addedComponents,
    });
  } catch (e) {
    console.error("[ItemComponents GET]", e);
    return NextResponse.json({ error: "Błąd pobierania składników" }, { status: 500 });
  }
}

/**
 * POST /api/orders/[id]/items/[itemId]/components - add extra component to set item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json();
    const parsed = addComponentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { productId, quantity } = parsed.data;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId },
      include: {
        product: {
          include: {
            setComponents: { where: { componentId: productId } },
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

    const componentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, priceGross: true },
    });

    if (!componentProduct) {
      return NextResponse.json({ error: "Produkt składnika nie istnieje" }, { status: 404 });
    }

    const addedComponents = (item.addedComponentsJson as AddedComponent[] | null) ?? [];
    const removedComponents = (item.removedComponentsJson as RemovedComponent[] | null) ?? [];

    const setComponent = item.product.setComponents[0];
    const componentPrice = setComponent
      ? Number(setComponent.priceDelta)
      : Number(componentProduct.priceGross);

    const wasRemoved = removedComponents.findIndex((r) => r.productId === productId);
    if (wasRemoved >= 0) {
      removedComponents.splice(wasRemoved, 1);
    } else {
      addedComponents.push({
        productId,
        name: componentProduct.name,
        price: componentPrice * quantity,
      });
    }

    const totalPriceChange = addedComponents.reduce((sum, c) => sum + c.price, 0);
    const newUnitPrice = Number(item.unitPrice) + totalPriceChange;

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        addedComponentsJson: addedComponents,
        removedComponentsJson: removedComponents,
        unitPrice: newUnitPrice > 0 ? newUnitPrice : Number(item.unitPrice),
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SET_COMPONENT_ADDED_TO_ORDER", "OrderItem", itemId, undefined, {
      componentName: componentProduct.name,
      price: componentPrice,
    });

    return NextResponse.json({
      message: "Składnik dodany",
      addedComponents,
      removedComponents,
    });
  } catch (e) {
    console.error("[ItemComponents POST]", e);
    return NextResponse.json({ error: "Błąd dodawania składnika" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/[id]/items/[itemId]/components - remove component from set item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: orderId, itemId } = await params;
    const body = await request.json();
    const parsed = removeComponentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { productId } = parsed.data;

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId, orderId },
      include: {
        product: {
          include: {
            setComponents: { where: { componentId: productId } },
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

    const setComponent = item.product.setComponents[0];

    if (setComponent?.isRequired) {
      return NextResponse.json({ error: "Ten składnik jest wymagany i nie może być usunięty" }, { status: 400 });
    }

    const removedComponents = (item.removedComponentsJson as RemovedComponent[] | null) ?? [];
    const addedComponents = (item.addedComponentsJson as AddedComponent[] | null) ?? [];

    const wasAdded = addedComponents.findIndex((a) => a.productId === productId);
    if (wasAdded >= 0) {
      addedComponents.splice(wasAdded, 1);
    } else if (setComponent?.isDefault) {
      const componentProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true },
      });

      if (!removedComponents.some((r) => r.productId === productId)) {
        removedComponents.push({
          productId,
          name: componentProduct?.name ?? "Nieznany",
        });
      }
    }

    const totalPriceChange = addedComponents.reduce((sum, c) => sum + c.price, 0);
    const basePrice = Number(item.unitPrice) - (item.addedComponentsJson as AddedComponent[] | null ?? []).reduce((s, c) => s + c.price, 0);
    const newUnitPrice = basePrice + totalPriceChange;

    await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        addedComponentsJson: addedComponents,
        removedComponentsJson: removedComponents,
        unitPrice: newUnitPrice > 0 ? newUnitPrice : Number(item.unitPrice),
        isModifiedAfterSend: item.sentToKitchenAt ? true : undefined,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SET_COMPONENT_REMOVED_FROM_ORDER", "OrderItem", itemId, undefined, {
      productId,
    });

    return NextResponse.json({
      message: "Składnik usunięty",
      addedComponents,
      removedComponents,
    });
  } catch (e) {
    console.error("[ItemComponents DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania składnika" }, { status: 500 });
  }
}
