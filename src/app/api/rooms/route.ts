export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { autoExportConfigSnapshot } from "@/lib/config-snapshot";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const allRooms = searchParams.get("all") === "true";

    // NOTE: processNoShows moved to /api/cron/no-shows for performance

    const rooms = await prisma.room.findMany({
      where: allRooms ? undefined : { isActive: true },
      include: {
        tables: {
          orderBy: { number: "asc" },
          include: {
            orders: {
              where: {
                status: {
                  notIn: ["CLOSED", "CANCELLED"],
                },
              },
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                user: { select: { name: true } },
                items: true,
              },
            },
            reservations: dateParam
              ? {
                  where: {
                    date: new Date(dateParam),
                    status: { in: ["PENDING", "CONFIRMED"] },
                    type: "TABLE",
                  },
                  orderBy: { timeFrom: "asc" },
                  take: 1,
                }
              : false,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const roomsWithOrderTotals = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      type: room.type,
      isSeasonal: room.isSeasonal,
      isActive: room.isActive,
      sortOrder: room.sortOrder,
      tables: room.tables.map((t) => {
        const activeOrder = t.orders[0];
        const tableReservation = Array.isArray(t.reservations) ? t.reservations[0] : null;
        let totalGross = 0;
        if (activeOrder?.items?.length) {
          for (const item of activeOrder.items) {
            const qty = Number(item.quantity);
            const price = Number(item.unitPrice);
            const discount = Number(item.discountAmount ?? 0);
            totalGross += qty * price - discount;
          }
        }
        return {
          id: t.id,
          number: t.number,
          seats: t.seats,
          shape: t.shape,
          status: t.status,
          qrId: t.qrId,
          positionX: t.positionX,
          positionY: t.positionY,
          activeOrder: activeOrder
            ? {
                id: activeOrder.id,
                orderNumber: activeOrder.orderNumber,
                createdAt: activeOrder.createdAt,
                totalGross: Math.round(totalGross * 100) / 100,
                userName: activeOrder.user.name,
              }
            : null,
          reservation: tableReservation
            ? {
                id: tableReservation.id,
                timeFrom: tableReservation.timeFrom.toISOString().slice(11, 16),
                guestName: tableReservation.guestName,
                status: tableReservation.status,
              }
            : null,
        };
      }),
    }));

    return NextResponse.json(roomsWithOrderTotals);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd pobierania sal" },
      { status: 500 }
    );
  }
}

const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  capacity: z.number().int().min(1),
  type: z.enum(["RESTAURANT", "BANQUET", "OUTDOOR", "PRIVATE"]),
  isSeasonal: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const createTableSchema = z.object({
  roomId: z.string().min(1),
  number: z.number().int().min(1),
  seats: z.number().int().min(1),
  shape: z.enum(["RECTANGLE", "ROUND", "LONG"]).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
});

/**
 * POST /api/rooms — create a room or table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create table
    if (body.roomId) {
      const parsed = createTableSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
      }
      const table = await prisma.table.create({
        data: {
          roomId: parsed.data.roomId,
          number: parsed.data.number,
          seats: parsed.data.seats,
          shape: parsed.data.shape ?? "RECTANGLE",
          positionX: parsed.data.positionX ?? 0,
          positionY: parsed.data.positionY ?? 0,
        },
      });
      autoExportConfigSnapshot();
      return NextResponse.json({ table }, { status: 201 });
    }

    // Create room
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }
    const room = await prisma.room.create({
      data: {
        name: parsed.data.name,
        capacity: parsed.data.capacity,
        type: parsed.data.type,
        isSeasonal: parsed.data.isSeasonal ?? false,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });
    autoExportConfigSnapshot();
    return NextResponse.json({ room }, { status: 201 });
  } catch (e) {
    console.error("[Rooms POST]", e);
    return NextResponse.json({ error: "Błąd tworzenia" }, { status: 500 });
  }
}

/**
 * PATCH /api/rooms — update a room or table
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Update table
    if (body.tableId) {
      const { tableId, ...data } = body;
      const table = await prisma.table.update({
        where: { id: tableId },
        data: {
          ...(typeof data.number === "number" && { number: data.number }),
          ...(typeof data.seats === "number" && { seats: data.seats }),
          ...(data.shape && { shape: data.shape }),
          ...(typeof data.positionX === "number" && { positionX: data.positionX }),
          ...(typeof data.positionY === "number" && { positionY: data.positionY }),
        },
      });
      autoExportConfigSnapshot();
      return NextResponse.json({ table });
    }

    // Update room
    if (body.roomId) {
      const { roomId, ...data } = body;
      const room = await prisma.room.update({
        where: { id: roomId },
        data: {
          ...(typeof data.name === "string" && { name: data.name }),
          ...(typeof data.capacity === "number" && { capacity: data.capacity }),
          ...(data.type && { type: data.type }),
          ...(typeof data.isSeasonal === "boolean" && { isSeasonal: data.isSeasonal }),
          ...(typeof data.isActive === "boolean" && { isActive: data.isActive }),
          ...(typeof data.sortOrder === "number" && { sortOrder: data.sortOrder }),
        },
      });
      autoExportConfigSnapshot();
      return NextResponse.json({ room });
    }

    return NextResponse.json({ error: "Wymagane roomId lub tableId" }, { status: 400 });
  } catch (e) {
    console.error("[Rooms PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji" }, { status: 500 });
  }
}

/**
 * DELETE /api/rooms — delete a room or table
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const tableId = searchParams.get("tableId");

    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: { _count: { select: { orders: true } } },
      });
      if (table && table._count.orders > 0) {
        return NextResponse.json({ error: "Stolik ma powiązane zamówienia" }, { status: 400 });
      }
      await prisma.table.delete({ where: { id: tableId } });
      autoExportConfigSnapshot();
      return NextResponse.json({ ok: true });
    }

    if (roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { _count: { select: { tables: true } } },
      });
      if (room && room._count.tables > 0) {
        return NextResponse.json({ error: `Sala ma ${room._count.tables} stolików — usuń je najpierw` }, { status: 400 });
      }
      await prisma.room.delete({ where: { id: roomId } });
      autoExportConfigSnapshot();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Wymagane roomId lub tableId" }, { status: 400 });
  } catch (e) {
    console.error("[Rooms DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania" }, { status: 500 });
  }
}
