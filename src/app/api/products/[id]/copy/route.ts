import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/products/[id]/copy - copy product with all flags and set components
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newName, targetCategoryId } = body as {
      newName?: string;
      targetCategoryId?: string;
    };

    const source = await prisma.product.findUnique({
      where: { id },
      include: {
        modifierGroups: true,
        allergens: true,
        setComponents: true,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Produkt źródłowy nie istnieje" }, { status: 404 });
    }

    const { id: _id, name: _name, createdAt: _cAt, updatedAt: _uAt, ...productData } = source;

    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        name: newName ?? `${source.name} (kopia)`,
        categoryId: targetCategoryId ?? source.categoryId,
      },
    });

    for (const pmg of source.modifierGroups) {
      await prisma.productModifierGroup.create({
        data: {
          productId: newProduct.id,
          modifierGroupId: pmg.modifierGroupId,
        },
      });
    }

    for (const allergen of source.allergens) {
      await prisma.productAllergen.create({
        data: {
          productId: newProduct.id,
          allergenId: allergen.allergenId,
        },
      });
    }

    if (source.isSet) {
      for (const comp of source.setComponents) {
        await prisma.setComponent.create({
          data: {
            parentProductId: newProduct.id,
            componentProductId: comp.componentProductId,
            quantity: comp.quantity,
            isDefault: comp.isDefault,
            isRequired: comp.isRequired,
            priceDelta: comp.priceDelta,
            sortOrder: comp.sortOrder,
          },
        });
      }
    }

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRODUCT_COPIED", "Product", newProduct.id, { sourceId: id }, {
      name: newProduct.name,
    });

    return NextResponse.json({
      product: newProduct,
      message: `Produkt skopiowany jako "${newProduct.name}"`,
    }, { status: 201 });
  } catch (e) {
    console.error("[ProductCopy POST]", e);
    return NextResponse.json({ error: "Błąd kopiowania" }, { status: 500 });
  }
}
