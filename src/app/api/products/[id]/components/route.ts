import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const addComponentSchema = z.object({
  componentId: z.string().min(1, "ID składnika jest wymagane"),
  quantity: z.number().min(0.001).default(1),
  isRequired: z.boolean().default(false),
  isDefault: z.boolean().default(true),
  priceDelta: z.number().default(0),
  sortOrder: z.number().int().default(0),
  isHidden: z.boolean().default(false),
  noPrintKitchen: z.boolean().default(false),
  printWithMinus: z.boolean().default(false),
});

const updateComponentSchema = z.object({
  componentId: z.string().min(1),
  quantity: z.number().min(0.001).optional(),
  isRequired: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  priceDelta: z.number().optional(),
  sortOrder: z.number().int().optional(),
  isHidden: z.boolean().optional(),
  noPrintKitchen: z.boolean().optional(),
  printWithMinus: z.boolean().optional(),
});

/**
 * GET /api/products/[id]/components - get set components
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: setId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: setId },
      select: {
        id: true,
        name: true,
        isSet: true,
        productType: true,
        setPriceMode: true,
        maxComponents: true,
        freeComponents: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produkt nie istnieje" }, { status: 404 });
    }

    const components = await prisma.setComponent.findMany({
      where: { setId },
      include: {
        component: {
          select: {
            id: true,
            name: true,
            priceGross: true,
            isActive: true,
            isAvailable: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { component: { name: "asc" } }],
    });

    return NextResponse.json({
      set: product,
      components: components.map((c) => ({
        id: c.id,
        componentId: c.componentId,
        componentName: c.component.name,
        componentPrice: Number(c.component.priceGross),
        componentActive: c.component.isActive,
        componentAvailable: c.component.isAvailable,
        categoryName: c.component.category.name,
        quantity: Number(c.quantity),
        isRequired: c.isRequired,
        isDefault: c.isDefault,
        priceDelta: Number(c.priceDelta),
        sortOrder: c.sortOrder,
        isHidden: c.isHidden,
        noPrintKitchen: c.noPrintKitchen,
        printWithMinus: c.printWithMinus,
      })),
    });
  } catch (e) {
    console.error("[SetComponents GET]", e);
    return NextResponse.json({ error: "Błąd pobierania składników" }, { status: 500 });
  }
}

/**
 * POST /api/products/[id]/components - add component to set
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: setId } = await params;
    const body = await request.json();
    const parsed = addComponentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: setId },
      select: { id: true, name: true, isSet: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produkt nie istnieje" }, { status: 404 });
    }

    if (!product.isSet) {
      return NextResponse.json({ error: "Ten produkt nie jest zestawem" }, { status: 400 });
    }

    const componentProduct = await prisma.product.findUnique({
      where: { id: parsed.data.componentId },
    });

    if (!componentProduct) {
      return NextResponse.json({ error: "Składnik nie istnieje" }, { status: 404 });
    }

    const existing = await prisma.setComponent.findUnique({
      where: {
        setId_componentId: { setId, componentId: parsed.data.componentId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Ten składnik jest już w zestawie" }, { status: 400 });
    }

    const component = await prisma.setComponent.create({
      data: {
        setId,
        componentId: parsed.data.componentId,
        quantity: parsed.data.quantity,
        isRequired: parsed.data.isRequired,
        isDefault: parsed.data.isDefault,
        priceDelta: parsed.data.priceDelta,
        sortOrder: parsed.data.sortOrder,
        isHidden: parsed.data.isHidden,
        noPrintKitchen: parsed.data.noPrintKitchen,
        printWithMinus: parsed.data.printWithMinus,
      },
      include: {
        component: { select: { name: true } },
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SET_COMPONENT_ADDED", "SetComponent", component.id, undefined, {
      setId,
      setName: product.name,
      componentName: component.component.name,
    });

    return NextResponse.json({ component }, { status: 201 });
  } catch (e) {
    console.error("[SetComponents POST]", e);
    return NextResponse.json({ error: "Błąd dodawania składnika" }, { status: 500 });
  }
}

/**
 * PATCH /api/products/[id]/components - update component in set
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: setId } = await params;
    const body = await request.json();
    const parsed = updateComponentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { componentId, ...updateData } = parsed.data;

    const component = await prisma.setComponent.update({
      where: {
        setId_componentId: { setId, componentId },
      },
      data: updateData,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SET_COMPONENT_UPDATED", "SetComponent", component.id, undefined, updateData);

    return NextResponse.json({ component });
  } catch (e) {
    console.error("[SetComponents PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji składnika" }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id]/components - remove component from set
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: setId } = await params;
    const { searchParams } = new URL(request.url);
    const componentId = searchParams.get("componentId");

    if (!componentId) {
      return NextResponse.json({ error: "Brak ID składnika" }, { status: 400 });
    }

    await prisma.setComponent.delete({
      where: {
        setId_componentId: { setId, componentId },
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "SET_COMPONENT_REMOVED", "SetComponent", `${setId}:${componentId}`);

    return NextResponse.json({ message: "Składnik usunięty z zestawu" });
  } catch (e) {
    console.error("[SetComponents DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania składnika" }, { status: 500 });
  }
}
