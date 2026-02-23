import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/products/[id]/copy - copy product with all flags and set components
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


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

    const newProduct = await prisma.product.create({
      data: {
        name: newName ?? `${source.name} (kopia)`,
        categoryId: targetCategoryId ?? source.categoryId,
        priceGross: source.priceGross,
        costPrice: source.costPrice,
        taxRateId: source.taxRateId,
        isActive: source.isActive,
        isAvailable: source.isAvailable,
        estimatedPrepMinutes: source.estimatedPrepMinutes,
        sortOrder: source.sortOrder,
        color: source.color,
        imageUrl: source.imageUrl,
        isWeightBased: source.isWeightBased,
        requiresWeightConfirm: source.requiresWeightConfirm,
        unit: source.unit,
        tareWeight: source.tareWeight,
        productType: source.productType,
        isSet: source.isSet,
        setPriceMode: source.setPriceMode,
        maxComponents: source.maxComponents,
        nameShort: source.nameShort,
        freeComponents: source.freeComponents,
        superGroupId: source.superGroupId,
        isAddonOnly: source.isAddonOnly,
        isHidden: source.isHidden,
        noPrintKitchen: source.noPrintKitchen,
        printWithMinus: source.printWithMinus,
        canRepeat: source.canRepeat,
        alwaysOnePortion: source.alwaysOnePortion,
        noQuantityChange: source.noQuantityChange,
        askForComponents: source.askForComponents,
        afterSelectGoTo: source.afterSelectGoTo,
        afterSelectAction: source.afterSelectAction,
        maxPerOrder: source.maxPerOrder,
        noGeneralDesc: source.noGeneralDesc,
        isDefaultTemplate: source.isDefaultTemplate,
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
            setId: newProduct.id,
            componentId: comp.componentId,
            quantity: comp.quantity,
            isDefault: comp.isDefault,
            isRequired: comp.isRequired,
            priceDelta: comp.priceDelta,
            sortOrder: comp.sortOrder,
            isHidden: comp.isHidden,
            noPrintKitchen: comp.noPrintKitchen,
            printWithMinus: comp.printWithMinus,
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
