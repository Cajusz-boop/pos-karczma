import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const DEFAULT_PRODUCT_SETTINGS = {
  isActive: true,
  isAvailable: true,
  isWeightBased: false,
  requiresWeightConfirm: false,
  isSet: false,
  isAddonOnly: false,
  isHidden: false,
  noPrintKitchen: false,
  printWithMinus: false,
  canRepeat: true,
  alwaysOnePortion: false,
  noQuantityChange: false,
  askForComponents: false,
  noGeneralDesc: false,
};

const defaultsSchema = z.object({
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  isWeightBased: z.boolean().optional(),
  requiresWeightConfirm: z.boolean().optional(),
  isSet: z.boolean().optional(),
  isAddonOnly: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  noPrintKitchen: z.boolean().optional(),
  printWithMinus: z.boolean().optional(),
  canRepeat: z.boolean().optional(),
  alwaysOnePortion: z.boolean().optional(),
  noQuantityChange: z.boolean().optional(),
  askForComponents: z.boolean().optional(),
  noGeneralDesc: z.boolean().optional(),
});

/**
 * GET /api/products/defaults - get default product settings
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "productDefaults" },
    });

    const defaults = config?.value
      ? { ...DEFAULT_PRODUCT_SETTINGS, ...(config.value as object) }
      : DEFAULT_PRODUCT_SETTINGS;

    const template = await prisma.product.findFirst({
      where: { isDefaultTemplate: true },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      defaults,
      template,
      systemDefaults: DEFAULT_PRODUCT_SETTINGS,
    });
  } catch (e) {
    console.error("[ProductDefaults GET]", e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

/**
 * PUT /api/products/defaults - update default product settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = defaultsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const existing = await prisma.systemConfig.findUnique({
      where: { key: "productDefaults" },
    });

    const newDefaults = {
      ...(existing?.value as object ?? {}),
      ...parsed.data,
    };

    await prisma.systemConfig.upsert({
      where: { key: "productDefaults" },
      update: { value: newDefaults },
      create: { key: "productDefaults", value: newDefaults },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRODUCT_DEFAULTS_UPDATED", "SystemConfig", "productDefaults", undefined, parsed.data);

    return NextResponse.json({
      defaults: { ...DEFAULT_PRODUCT_SETTINGS, ...newDefaults },
      message: "Domyślne ustawienia zapisane",
    });
  } catch (e) {
    console.error("[ProductDefaults PUT]", e);
    return NextResponse.json({ error: "Błąd zapisywania" }, { status: 500 });
  }
}

/**
 * POST /api/products/defaults - apply defaults to product or category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, categoryId, useTemplate } = body as {
      productId?: string;
      categoryId?: string;
      useTemplate?: boolean;
    };

    if (!productId && !categoryId) {
      return NextResponse.json(
        { error: "Podaj productId lub categoryId" },
        { status: 400 }
      );
    }

    let defaults: Record<string, unknown>;

    if (useTemplate) {
      const template = await prisma.product.findFirst({
        where: { isDefaultTemplate: true },
      });
      if (!template) {
        return NextResponse.json({ error: "Brak szablonu domyślnego" }, { status: 404 });
      }
      defaults = {
        isActive: template.isActive,
        isAvailable: template.isAvailable,
        isWeightBased: template.isWeightBased,
        requiresWeightConfirm: template.requiresWeightConfirm,
        isSet: template.isSet,
        isAddonOnly: template.isAddonOnly,
        isHidden: template.isHidden,
        noPrintKitchen: template.noPrintKitchen,
        printWithMinus: template.printWithMinus,
        canRepeat: template.canRepeat,
        alwaysOnePortion: template.alwaysOnePortion,
        noQuantityChange: template.noQuantityChange,
        askForComponents: template.askForComponents,
        noGeneralDesc: template.noGeneralDesc,
      };
    } else {
      const config = await prisma.systemConfig.findUnique({
        where: { key: "productDefaults" },
      });
      defaults = (config?.value as Record<string, unknown>) ?? DEFAULT_PRODUCT_SETTINGS;
    }

    let updatedCount = 0;

    if (productId) {
      await prisma.product.update({
        where: { id: productId },
        data: defaults,
      });
      updatedCount = 1;
    } else if (categoryId) {
      const result = await prisma.product.updateMany({
        where: { categoryId },
        data: defaults,
      });
      updatedCount = result.count;
    }

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRODUCT_DEFAULTS_APPLIED", "Product", productId ?? categoryId, undefined, {
      count: updatedCount,
      useTemplate,
    });

    return NextResponse.json({
      message: `Zastosowano domyślne ustawienia do ${updatedCount} produktów`,
      updatedCount,
    });
  } catch (e) {
    console.error("[ProductDefaults POST]", e);
    return NextResponse.json({ error: "Błąd stosowania domyślnych" }, { status: 500 });
  }
}

/**
 * DELETE /api/products/defaults - reset to system defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    await prisma.systemConfig.deleteMany({
      where: { key: "productDefaults" },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRODUCT_DEFAULTS_RESET", "SystemConfig", "productDefaults");

    return NextResponse.json({
      defaults: DEFAULT_PRODUCT_SETTINGS,
      message: "Przywrócono domyślne ustawienia systemowe",
    });
  } catch (e) {
    console.error("[ProductDefaults DELETE]", e);
    return NextResponse.json({ error: "Błąd resetowania" }, { status: 500 });
  }
}
