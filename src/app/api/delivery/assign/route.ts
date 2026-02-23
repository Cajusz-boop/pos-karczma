import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";
import { sendPushToUser } from "@/lib/push/web-push";

export const dynamic = 'force-dynamic';


const assignDriverSchema = z.object({
  orderId: z.string().min(1, "ID zamĂłwienia jest wymagane"),
  driverId: z.string().min(1, "ID kierowcy jest wymagane"),
});

const lookupZoneSchema = z.object({
  address: z.string().min(1, "Adres jest wymagany"),
});

/**
 * POST /api/delivery/assign - assign driver to order
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assignDriverSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { orderId, driverId } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        type: true,
        deliveryStatus: true,
        assignedDriverId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ZamĂłwienie nie istnieje" }, { status: 404 });
    }

    if (order.type !== "DELIVERY") {
      return NextResponse.json({ error: "To zamĂłwienie nie jest dostawÄ…" }, { status: 400 });
    }

    const driver = await prisma.deliveryDriver.findUnique({
      where: { id: driverId },
      include: { user: { select: { name: true } } },
    });

    if (!driver) {
      return NextResponse.json({ error: "Kierowca nie istnieje" }, { status: 404 });
    }

    if (!driver.isAvailable) {
      return NextResponse.json({ error: "Kierowca jest niedostÄ™pny" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          assignedDriverId: driverId,
          deliveryStatus: order.deliveryStatus === "READY_FOR_PICKUP" ? "OUT_FOR_DELIVERY" : order.deliveryStatus,
        },
      }),
      prisma.deliveryDriver.update({
        where: { id: driverId },
        data: { currentOrderId: orderId },
      }),
    ]);

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_DRIVER_ASSIGNED", "Order", orderId, undefined, {
      driverId,
      driverName: driver.user.name,
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, deliveryAddress: true },
    });

    sendPushToUser(driver.userId, {
      title: "Nowe zlecenie dostawy!",
      body: `ZamĂłwienie #${fullOrder?.orderNumber ?? "?"} - ${fullOrder?.deliveryAddress ?? "odbiĂłr osobisty"}`,
      data: { type: "DELIVERY_ASSIGNED", orderId },
    }).catch(console.error);

    return NextResponse.json({
      message: "Kierowca przypisany",
      driver: {
        id: driver.id,
        name: driver.user.name,
      },
    });
  } catch (e) {
    console.error("[DeliveryAssign POST]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d przypisania kierowcy" }, { status: 500 });
  }
}

/**
 * PUT /api/delivery/assign - lookup zone by address (street matching)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = lookupZoneSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { address } = parsed.data;

    const normalizedAddress = address.toLowerCase().trim();
    const streetMatch = normalizedAddress.match(/^(ul\.?\s*)?([a-zÄ…Ä‡Ä™Ĺ‚Ĺ„ĂłĹ›ĹşĹĽ\s]+)/i);
    const streetName = streetMatch?.[2]?.trim() ?? normalizedAddress;
    const houseNumber = parseInt(normalizedAddress.match(/\d+/)?.[0] ?? "0");

    const matchingStreets = await prisma.deliveryStreet.findMany({
      where: {
        streetName: { contains: streetName },
        zone: { isActive: true },
      },
      include: {
        zone: true,
      },
      orderBy: [
        { zone: { sortOrder: "asc" } },
        { zone: { number: "asc" } },
      ],
    });

    let bestMatch = null;

    for (const street of matchingStreets) {
      const nameMatch = street.streetName.toLowerCase().includes(streetName.toLowerCase());
      
      if (!nameMatch) continue;

      const inRange =
        houseNumber === 0 ||
        street.numberFrom === null ||
        street.numberTo === null ||
        (houseNumber >= street.numberFrom && houseNumber <= street.numberTo);

      if (inRange) {
        bestMatch = {
          street: {
            id: street.id,
            streetName: street.streetName,
            numberFrom: street.numberFrom,
            numberTo: street.numberTo,
          },
          zone: {
            id: street.zone.id,
            number: street.zone.number,
            name: street.zone.name,
            deliveryCost: Number(street.zone.deliveryCost),
            driverCommission: Number(street.zone.driverCommission),
            minOrderForFreeDelivery: street.zone.minOrderForFreeDelivery
              ? Number(street.zone.minOrderForFreeDelivery)
              : null,
          },
        };
        break;
      }
    }

    if (!bestMatch) {
      const defaultZone = await prisma.deliveryZone.findFirst({
        where: { isActive: true },
        orderBy: { number: "desc" },
      });

      if (defaultZone) {
        return NextResponse.json({
          match: null,
          defaultZone: {
            id: defaultZone.id,
            number: defaultZone.number,
            name: defaultZone.name,
            deliveryCost: Number(defaultZone.deliveryCost),
            driverCommission: Number(defaultZone.driverCommission),
          },
          message: "Nie znaleziono ulicy, uĹĽyto domyĹ›lnej strefy",
        });
      }

      return NextResponse.json({
        match: null,
        message: "Nie znaleziono pasujÄ…cej strefy",
      });
    }

    return NextResponse.json({
      match: bestMatch,
      message: `Znaleziono: ${bestMatch.street.streetName} â†’ Strefa ${bestMatch.zone.number}`,
    });
  } catch (e) {
    console.error("[DeliveryAssign PUT]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d wyszukiwania strefy" }, { status: 500 });
  }
}

/**
 * DELETE /api/delivery/assign - unassign driver from order (complete delivery)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const driverId = searchParams.get("driverId");
    const status = searchParams.get("status") as "DELIVERED" | "CANCELLED" | null;

    if (!orderId || !driverId) {
      return NextResponse.json({ error: "Brak orderId lub driverId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        deliveryZoneId: true,
        totalGross: true,
        assignedDriverId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ZamĂłwienie nie istnieje" }, { status: 404 });
    }

    const newStatus = status ?? "DELIVERED";
    const deliveredAt = newStatus === "DELIVERED" ? new Date() : null;

    let commission = null;
    if (newStatus === "DELIVERED" && order.deliveryZoneId) {
      const zone = await prisma.deliveryZone.findUnique({
        where: { id: order.deliveryZoneId },
        select: { driverCommission: true },
      });
      commission = zone?.driverCommission ?? null;
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus: newStatus,
          deliveredAt,
          driverCommission: commission,
          assignedDriverId: null,
        },
      }),
      prisma.deliveryDriver.update({
        where: { id: driverId },
        data: { currentOrderId: null },
      }),
    ]);

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_COMPLETED", "Order", orderId, undefined, {
      driverId,
      status: newStatus,
      commission: commission ? Number(commission) : null,
    });

    return NextResponse.json({
      message: newStatus === "DELIVERED" ? "Dostawa zakoĹ„czona" : "Dostawa anulowana",
      status: newStatus,
    });
  } catch (e) {
    console.error("[DeliveryAssign DELETE]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d zakoĹ„czenia dostawy" }, { status: 500 });
  }
}
