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
    const { newName, newCode, targetCategoryId } = body as {
      newName?: string;
      newCode?: string;
      targetCategoryId?: string;
    };

    const source = await prisma.product.findUnique({
      where: { id },
      include: {
        modifierGroups: {
          include: { modifierGroup: { include: { modifiers: true } } },
        },
        allergens: true,
        setComponents: true,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Produkt źródłowy nie istnieje" }, { status: 404 });
    }

    const existingCode = newCode
      ? await prisma.product.findFirst({ where: { code: newCode } })
      : null;

    if (existingCode) {
      return NextResponse.json({ error: "Kod produktu już istnieje" }, { status: 400 });
    }

    let generatedCode = newCode;
    if (!generatedCode) {
      const lastProduct = await prisma.product.findFirst({
        where: { code: { not: null } },
        orderBy: { code: "desc" },
      });
      const lastNum = lastProduct?.code ? parseInt(lastProduct.code) || 0 : 0;
      generatedCode = String(lastNum + 1).padStart(4, "0");
    }

    const { id: _id, code: _code, name: _name, createdAt: _cAt, updatedAt: _uAt, ...productData } = source;

    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        name: newName ?? `${source.name} (kopia)`,
        code: generatedCode,
        categoryId: targetCategoryId ?? source.categoryId,
      },
    });

    for (const group of source.modifierGroups) {
      const newGroup = await prisma.productModifierGroup.create({
        data: {
          productId: newProduct.id,
          name: group.name,
          minSelect: group.minSelect,
          maxSelect: group.maxSelect,
          sortOrder: group.sortOrder,
        },
      });

      for (const mod of group.modifiers) {
        await prisma.modifier.create({
          data: {
            groupId: newGroup.id,
            name: mod.name,
            price: mod.price,
            isDefault: mod.isDefault,
            sortOrder: mod.sortOrder,
          },
        });
      }
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
      code: newProduct.code,
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
