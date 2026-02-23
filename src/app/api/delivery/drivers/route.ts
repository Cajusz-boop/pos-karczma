import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';


const createDriverSchema = z.object({
  userId: z.string().min(1, "ID uĹĽytkownika jest wymagane"),
  vehicleType: z.string().nullable().optional(),
  vehiclePlate: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  isAvailable: z.boolean().default(true),
});

const updateDriverSchema = z.object({
  id: z.string().min(1),
  vehicleType: z.string().nullable().optional(),
  vehiclePlate: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
  currentOrderId: z.string().nullable().optional(),
});

/**
 * GET /api/delivery/drivers - list all drivers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const availableOnly = searchParams.get("available") === "true";
    const withStats = searchParams.get("stats") === "true";

    const where = availableOnly ? { isAvailable: true } : {};

    const drivers = await prisma.deliveryDriver.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true },
        },
        ...(withStats ? {
          settlements: {
            where: {
              shiftDate: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
            orderBy: { shiftDate: "desc" },
            take: 30,
          },
        } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const result = await Promise.all(
      drivers.map(async (d) => {
        let currentOrder = null;
        if (d.currentOrderId) {
          currentOrder = await prisma.order.findUnique({
            where: { id: d.currentOrderId },
            select: {
              id: true,
              orderNumber: true,
              deliveryAddress: true,
              deliveryPhone: true,
              totalGross: true,
            },
          });
        }

        let stats = null;
        if (withStats && 'settlements' in d && Array.isArray(d.settlements)) {
          const settlements = d.settlements as { totalDeliveries: number; totalCommission: unknown }[];
          stats = {
            totalDeliveries: settlements.reduce((sum, s) => sum + s.totalDeliveries, 0),
            totalCommission: settlements.reduce((sum, s) => sum + Number(s.totalCommission), 0),
            recentDays: settlements.length,
          };
        }

        return {
          id: d.id,
          userId: d.userId,
          userName: d.user.name,
          vehicleType: d.vehicleType,
          vehiclePlate: d.vehiclePlate,
          phoneNumber: d.phoneNumber,
          isAvailable: d.isAvailable,
          currentOrder,
          stats,
          createdAt: d.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ drivers: result });
  } catch (e) {
    console.error("[DeliveryDrivers GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania kierowcĂłw" }, { status: 500 });
  }
}

/**
 * POST /api/delivery/drivers - register driver
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createDriverSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { userId, vehicleType, vehiclePlate, phoneNumber, isAvailable } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "UĹĽytkownik nie istnieje" }, { status: 404 });
    }

    const existing = await prisma.deliveryDriver.findUnique({
      where: { userId },
    });

    if (existing) {
      return NextResponse.json({ error: "Ten uĹĽytkownik jest juĹĽ kierowcÄ…" }, { status: 400 });
    }

    const driver = await prisma.deliveryDriver.create({
      data: {
        userId,
        vehicleType: vehicleType ?? null,
        vehiclePlate: vehiclePlate ?? null,
        phoneNumber: phoneNumber ?? null,
        isAvailable,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const reqUserId = request.headers.get("x-user-id");
    await auditLog(reqUserId, "DELIVERY_DRIVER_CREATED", "DeliveryDriver", driver.id, undefined, {
      userId,
      userName: user.name,
    });

    return NextResponse.json({
      driver: {
        id: driver.id,
        userId: driver.userId,
        userName: driver.user.name,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        phoneNumber: driver.phoneNumber,
        isAvailable: driver.isAvailable,
      },
    }, { status: 201 });
  } catch (e) {
    console.error("[DeliveryDrivers POST]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d rejestracji kierowcy" }, { status: 500 });
  }
}

/**
 * PATCH /api/delivery/drivers - update driver
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateDriverSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { id, ...updateData } = parsed.data;

    const driver = await prisma.deliveryDriver.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_DRIVER_UPDATED", "DeliveryDriver", driver.id, undefined, updateData);

    return NextResponse.json({
      driver: {
        id: driver.id,
        userId: driver.userId,
        userName: driver.user.name,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        phoneNumber: driver.phoneNumber,
        isAvailable: driver.isAvailable,
        currentOrderId: driver.currentOrderId,
      },
    });
  } catch (e) {
    console.error("[DeliveryDrivers PATCH]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d aktualizacji kierowcy" }, { status: 500 });
  }
}

/**
 * DELETE /api/delivery/drivers - remove driver
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brak ID kierowcy" }, { status: 400 });
    }

    const driver = await prisma.deliveryDriver.findUnique({
      where: { id },
      include: {
        _count: { select: { settlements: true } },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Kierowca nie istnieje" }, { status: 404 });
    }

    if (driver._count.settlements > 0) {
      await prisma.deliveryDriver.update({
        where: { id },
        data: { isAvailable: false },
      });
      return NextResponse.json({
        message: "Kierowca dezaktywowany (ma rozliczenia w historii)",
        deactivated: true,
      });
    }

    await prisma.deliveryDriver.delete({
      where: { id },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_DRIVER_DELETED", "DeliveryDriver", id);

    return NextResponse.json({ message: "Kierowca usuniÄ™ty", deleted: true });
  } catch (e) {
    console.error("[DeliveryDrivers DELETE]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d usuwania kierowcy" }, { status: 500 });
  }
}
