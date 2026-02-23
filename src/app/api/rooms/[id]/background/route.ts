import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const backgroundSchema = z.object({
  backgroundImage: z.string().url().nullable().optional(),
  backgroundOpacity: z.number().min(0).max(1).optional(),
});

const decorSchema = z.object({
  decorElements: z.array(z.object({
    id: z.string(),
    type: z.enum(["wall", "pillar", "plant", "window", "door", "bar", "custom"]),
    x: z.number(),
    y: z.number(),
    width: z.number().min(10).max(500),
    height: z.number().min(10).max(500),
    rotation: z.number().default(0),
    image: z.string().url().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    zIndex: z.number().default(0),
  })),
});

/**
 * GET /api/rooms/[id]/background - get room background and decor
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

    const room = await prisma.room.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        backgroundImage: true,
        backgroundOpacity: true,
        decorElements: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Sala nie istnieje" }, { status: 404 });
    }

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        backgroundImage: room.backgroundImage,
        backgroundOpacity: room.backgroundOpacity,
        decorElements: room.decorElements as unknown[],
      },
    });
  } catch (e) {
    console.error("[RoomBackground GET]", e);
    return NextResponse.json({ error: "Błąd pobierania" }, { status: 500 });
  }
}

/**
 * PUT /api/rooms/[id]/background - update room background
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = backgroundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const room = await prisma.room.update({
      where: { id },
      data: parsed.data,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ROOM_BACKGROUND_UPDATED", "Room", id, undefined, parsed.data);

    return NextResponse.json({
      room,
      message: "Tło zapisane",
    });
  } catch (e) {
    console.error("[RoomBackground PUT]", e);
    return NextResponse.json({ error: "Błąd zapisywania tła" }, { status: 500 });
  }
}

/**
 * PATCH /api/rooms/[id]/background - update room decor elements
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = decorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const room = await prisma.room.update({
      where: { id },
      data: { decorElements: parsed.data.decorElements },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ROOM_DECOR_UPDATED", "Room", id, undefined, {
      elementCount: parsed.data.decorElements.length,
    });

    return NextResponse.json({
      room,
      message: "Elementy wystroju zapisane",
    });
  } catch (e) {
    console.error("[RoomBackground PATCH]", e);
    return NextResponse.json({ error: "Błąd zapisywania wystroju" }, { status: 500 });
  }
}

/**
 * DELETE /api/rooms/[id]/background - clear room background
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const room = await prisma.room.update({
      where: { id },
      data: {
        backgroundImage: null,
        backgroundOpacity: 1.0,
        decorElements: [],
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "ROOM_BACKGROUND_CLEARED", "Room", id);

    return NextResponse.json({
      room,
      message: "Tło wyczyszczone",
    });
  } catch (e) {
    console.error("[RoomBackground DELETE]", e);
    return NextResponse.json({ error: "Błąd usuwania tła" }, { status: 500 });
  }
}
