import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const permissionsSchema = z.object({
  allowedCategoryIds: z.array(z.string()).nullable().optional(),
  allowedTableIds: z.array(z.string()).nullable().optional(),
  allowedPriceLevelIds: z.array(z.string()).nullable().optional(),
  autoLogoutSec: z.number().int().min(0).max(600).nullable().optional(),
  uiButtonGroups: z.any().nullable().optional(),
  permissions: z.object({
    access: z.object({
      pos: z.boolean().optional(),
      kds: z.boolean().optional(),
      reports: z.boolean().optional(),
      settings: z.boolean().optional(),
      delivery: z.boolean().optional(),
    }).optional(),
    hall: z.object({
      viewOtherOrders: z.boolean().optional(),
      moveOrders: z.boolean().optional(),
      joinTables: z.boolean().optional(),
      splitOrders: z.boolean().optional(),
    }).optional(),
    operations: z.object({
      discount: z.boolean().optional(),
      discountMax: z.number().min(0).max(100).optional(),
      freeItem: z.boolean().optional(),
      cancelItem: z.boolean().optional(),
      cancelOrder: z.boolean().optional(),
      editSentItem: z.boolean().optional(),
      reprintKitchen: z.boolean().optional(),
    }).optional(),
    prohibitions: z.object({
      noQuantityChange: z.boolean().optional(),
      noPriceChange: z.boolean().optional(),
      noNoteAdd: z.boolean().optional(),
      noModifierChange: z.boolean().optional(),
    }).optional(),
    reports: z.object({
      dailySales: z.boolean().optional(),
      cashReport: z.boolean().optional(),
      itemReport: z.boolean().optional(),
      staffReport: z.boolean().optional(),
      deliveryReport: z.boolean().optional(),
    }).optional(),
    receipt: z.object({
      openCashDrawer: z.boolean().optional(),
      payout: z.boolean().optional(),
      refund: z.boolean().optional(),
      printReceipt: z.boolean().optional(),
      emailReceipt: z.boolean().optional(),
    }).optional(),
    order: z.object({
      createOrder: z.boolean().optional(),
      addItems: z.boolean().optional(),
      removeItems: z.boolean().optional(),
      changeQuantity: z.boolean().optional(),
      applyCoupon: z.boolean().optional(),
    }).optional(),
    delivery: z.object({
      createDelivery: z.boolean().optional(),
      assignDriver: z.boolean().optional(),
      changeStatus: z.boolean().optional(),
      editAddress: z.boolean().optional(),
    }).optional(),
    config: z.object({
      editProducts: z.boolean().optional(),
      editCategories: z.boolean().optional(),
      editTables: z.boolean().optional(),
      editUsers: z.boolean().optional(),
      editPrinters: z.boolean().optional(),
    }).optional(),
  }).nullable().optional(),
});

/**
 * GET /api/users/[id]/permissions - get user permissions
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        autoLogoutSec: true,
        allowedCategoryIds: true,
        allowedTableIds: true,
        allowedPriceLevelIds: true,
        uiButtonGroups: true,
        permissionsJson: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }

    const rolePermissions = (user.role.permissions as Record<string, unknown>) ?? {};
    const userPermissions = (user.permissionsJson as Record<string, unknown>) ?? {};
    const mergedPermissions = { ...rolePermissions, ...userPermissions };

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        autoLogoutSec: user.autoLogoutSec,
        allowedCategoryIds: user.allowedCategoryIds ?? [],
        allowedTableIds: user.allowedTableIds ?? [],
        allowedPriceLevelIds: user.allowedPriceLevelIds ?? [],
        uiButtonGroups: user.uiButtonGroups,
        permissions: user.permissionsJson,
      },
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      effectivePermissions: mergedPermissions,
    });
  } catch (e) {
    console.error("[UserPermissions GET]", e);
    return NextResponse.json({ error: "Błąd pobierania uprawnień" }, { status: 500 });
  }
}

/**
 * PUT /api/users/[id]/permissions - update user permissions
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = permissionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, permissionsJson: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.allowedCategoryIds !== undefined) {
      updateData.allowedCategoryIds = parsed.data.allowedCategoryIds;
    }
    if (parsed.data.allowedTableIds !== undefined) {
      updateData.allowedTableIds = parsed.data.allowedTableIds;
    }
    if (parsed.data.allowedPriceLevelIds !== undefined) {
      updateData.allowedPriceLevelIds = parsed.data.allowedPriceLevelIds;
    }
    if (parsed.data.autoLogoutSec !== undefined) {
      updateData.autoLogoutSec = parsed.data.autoLogoutSec;
    }
    if (parsed.data.uiButtonGroups !== undefined) {
      updateData.uiButtonGroups = parsed.data.uiButtonGroups;
    }
    if (parsed.data.permissions !== undefined) {
      updateData.permissionsJson = parsed.data.permissions;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        autoLogoutSec: true,
        allowedCategoryIds: true,
        allowedTableIds: true,
        allowedPriceLevelIds: true,
        uiButtonGroups: true,
        permissionsJson: true,
      },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_PERMISSIONS_UPDATED", "User", id, user.permissionsJson as Record<string, unknown>, updateData);

    return NextResponse.json({
      user: updated,
      message: "Uprawnienia zaktualizowane",
    });
  } catch (e) {
    console.error("[UserPermissions PUT]", e);
    return NextResponse.json({ error: "Błąd aktualizacji uprawnień" }, { status: 500 });
  }
}

/**
 * POST /api/users/[id]/permissions/copy - copy permissions from another user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params;
    const body = await request.json();
    const { sourceUserId } = body;

    if (!sourceUserId) {
      return NextResponse.json({ error: "Brak ID użytkownika źródłowego" }, { status: 400 });
    }

    const sourceUser = await prisma.user.findUnique({
      where: { id: sourceUserId },
      select: {
        autoLogoutSec: true,
        allowedCategoryIds: true,
        allowedTableIds: true,
        allowedPriceLevelIds: true,
        uiButtonGroups: true,
        permissionsJson: true,
      },
    });

    if (!sourceUser) {
      return NextResponse.json({ error: "Użytkownik źródłowy nie istnieje" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        autoLogoutSec: sourceUser.autoLogoutSec,
        allowedCategoryIds: sourceUser.allowedCategoryIds ?? undefined,
        allowedTableIds: sourceUser.allowedTableIds ?? undefined,
        allowedPriceLevelIds: sourceUser.allowedPriceLevelIds ?? undefined,
        uiButtonGroups: sourceUser.uiButtonGroups ?? undefined,
        permissionsJson: sourceUser.permissionsJson ?? undefined,
      },
      select: { id: true, name: true },
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "USER_PERMISSIONS_COPIED", "User", targetId, undefined, {
      sourceUserId,
    });

    return NextResponse.json({
      message: `Uprawnienia skopiowane do ${updated.name}`,
    });
  } catch (e) {
    console.error("[UserPermissions POST copy]", e);
    return NextResponse.json({ error: "Błąd kopiowania uprawnień" }, { status: 500 });
  }
}
