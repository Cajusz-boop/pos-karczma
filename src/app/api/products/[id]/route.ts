import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, updateProductSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

type RouteContext = { params: Promise<{ id: string }> };
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [ {"id":"_"} ];
}



export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        taxRate: { select: { id: true, name: true, fiscalSymbol: true, ratePercent: true } },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: { modifiers: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
        allergens: { include: { allergen: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produkt nie istnieje" }, { status: 404 });
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      nameShort: product.nameShort,
      categoryId: product.categoryId,
      category: product.category,
      priceGross: Number(product.priceGross),
      taxRateId: product.taxRateId,
      taxRate: product.taxRate,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
      color: product.color,
      imageUrl: product.imageUrl,
      sortOrder: product.sortOrder,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania produktu" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produkt nie istnieje" }, { status: 404 });
    }

    const { data, error: valError } = await parseBody(request, updateProductSchema);
    if (valError) return valError;

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name.slice(0, 100);
    if (data.nameShort !== undefined) updateData.nameShort = data.nameShort ? data.nameShort.slice(0, 40) : null;
    if (data.categoryId !== undefined) {
      const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!cat) return NextResponse.json({ error: "Kategoria nie istnieje" }, { status: 404 });
      updateData.categoryId = data.categoryId;
    }
    if (data.taxRateId !== undefined) {
      const tax = await prisma.taxRate.findUnique({ where: { id: data.taxRateId } });
      if (!tax) return NextResponse.json({ error: "Stawka VAT nie istnieje" }, { status: 404 });
      updateData.taxRateId = data.taxRateId;
    }
    if (data.priceGross !== undefined) updateData.priceGross = data.priceGross;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        taxRate: { select: { id: true, name: true, fiscalSymbol: true, ratePercent: true } },
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRODUCT_UPDATE", "Product", id, {
      name: existing.name,
      priceGross: Number(existing.priceGross),
      isActive: existing.isActive,
      isAvailable: existing.isAvailable,
    }, updateData);

    autoExportConfigSnapshot();

    return NextResponse.json({
      id: product.id,
      name: product.name,
      nameShort: product.nameShort,
      categoryId: product.categoryId,
      category: product.category,
      priceGross: Number(product.priceGross),
      taxRateId: product.taxRateId,
      taxRate: product.taxRate,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
      color: product.color,
      sortOrder: product.sortOrder,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd aktualizacji produktu" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produkt nie istnieje" }, { status: 404 });
    }

    // Soft delete — mark as inactive instead of removing
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRODUCT_DELETE", "Product", id, {
      name: existing.name,
      priceGross: Number(existing.priceGross),
    });

    autoExportConfigSnapshot();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd usuwania produktu" }, { status: 500 });
  }
}
