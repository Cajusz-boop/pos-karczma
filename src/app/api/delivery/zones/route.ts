import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const createZoneSchema = z.object({
  number: z.number().int().min(1),
  name: z.string().min(1, "Nazwa strefy jest wymagana"),
  driverCommission: z.number().min(0).default(0),
  deliveryCost: z.number().min(0).default(0),
  minOrderForFreeDelivery: z.number().min(0).nullable().optional(),
  estimatedMinutes: z.number().int().min(5).max(180).default(30),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const updateZoneSchema = createZoneSchema.partial().extend({
  id: z.string().min(1),
});

/**
 * GET /api/delivery/zones - list all delivery zones
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStreets = searchParams.get("includeStreets") === "true";
    const activeOnly = searchParams.get("activeOnly") === "true";

    const zones = await prisma.deliveryZone.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: includeStreets ? {
        streets: {
          orderBy: { streetName: "asc" },
        },
        _count: {
          select: { streets: true, orders: true },
        },
      } : {
        _count: {
          select: { streets: true, orders: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { number: "asc" }],
    });

    return NextResponse.json({
      zones: zones.map((z) => ({
        id: z.id,
        number: z.number,
        name: z.name,
        driverCommission: Number(z.driverCommission),
        deliveryCost: Number(z.deliveryCost),
        minOrderForFreeDelivery: z.minOrderForFreeDelivery ? Number(z.minOrderForFreeDelivery) : null,
        estimatedMinutes: z.estimatedMinutes,
        isActive: z.isActive,
        sortOrder: z.sortOrder,
        streetCount: z._count.streets,
        orderCount: z._count.orders,
        streets: includeStreets && 'streets' in z ? z.streets : undefined,
      })),
    });
  } catch (e) {
    console.error("[DeliveryZones GET]", e);
    return NextResponse.json({ error: "Błąd pobierania stref" }, { status: 500 });
  }
}

/**
 * POST /api/delivery/zones - create new delivery zone
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createZoneSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { number, name, driverCommission, deliveryCost, minOrderForFreeDelivery, estimatedMinutes, isActive, sortOrder } = parsed.data;

    const existing = await prisma.deliveryZone.findUnique({
      where: { number },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Strefa o numerze ${number} już istnieje` },
        { status: 400 }
      );
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        number,
        name,
        driverCommission,
        deliveryCost,
        minOrderForFreeDelivery,
        estimatedMinutes,
        isActive,
        sortOrder,
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_ZONE_CREATED", "DeliveryZone", zone.id, undefined, {
      number,
      name,
      driverCommission,
      deliveryCost,
    });

    return NextResponse.json({
      zone: {
        id: zone.id,
        number: zone.number,
        name: zone.name,
        driverCommission: Number(zone.driverCommission),
        deliveryCost: Number(zone.deliveryCost),
        minOrderForFreeDelivery: zone.minOrderForFreeDelivery ? Number(zone.minOrderForFreeDelivery) : null,
        estimatedMinutes: zone.estimatedMinutes,
        isActive: zone.isActive,
        sortOrder: zone.sortOrder,
      },
    }, { status: 201 });
  } catch (e) {
    console.error("[DeliveryZones POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia strefy" }, { status: 500 });
  }
}

/**
 * PATCH /api/delivery/zones - update delivery zone
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateZoneSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    if (updateData.number !== undefined) {
      const existing = await prisma.deliveryZone.findFirst({
        where: {
          number: updateData.number,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Strefa o numerze ${updateData.number} już istnieje` },
          { status: 400 }
        );
      }
    }

    const zone = await prisma.deliveryZone.update({
      where: { id },
      data: updateData,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_ZONE_UPDATED", "DeliveryZone", zone.id, undefined, updateData);

    return NextResponse.json({
      zone: {
        id: zone.id,
        number: zone.number,
        name: zone.name,
        driverCommission: Number(zone.driverCommission),
        deliveryCost: Number(zone.deliveryCost),
        minOrderForFreeDelivery: zone.minOrderForFreeDelivery ? Number(zone.minOrderForFreeDelivery) : null,
        estimatedMinutes: zone.estimatedMinutes,
        isActive: zone.isActive,
        sortOrder: zone.sortOrder,
      },
    });
  } catch (e) {
    console.error("[DeliveryZones PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji strefy" }, { status: 500 });
  }
}

/**
 * DELETE /api/delivery/zones - delete delivery zone
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brak ID strefy" }, { status: 400 });
    }

    const zone = await prisma.deliveryZone.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true } },
      },
    });

    if (!zone) {
      return NextResponse.json({ error: "Strefa nie istnieje" }, { status: 404 });
    }

    if (zone._count.orders > 0) {
      await prisma.deliveryZone.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Strefa dezaktywowana (ma przypisane zamówienia)",
        deactivated: true,
      });
    }

    await prisma.deliveryZone.delete({
      where: { id },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_ZONE_DELETED", "DeliveryZone", id);

    return NextResponse.json({ message: "Strefa usunięta", deleted: true });
  } catch (e) {
    console.error("[DeliveryZones DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania strefy" }, { status: 500 });
  }
}
