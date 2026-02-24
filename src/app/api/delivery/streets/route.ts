export const dynamic = 'force-dynamic';

﻿import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";


const streetSchema = z.object({
  zoneId: z.string().min(1, "ID strefy jest wymagane"),
  streetName: z.string().min(1, "Nazwa ulicy jest wymagana"),
  numberFrom: z.number().int().nullable().optional(),
  numberTo: z.number().int().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
});

const bulkImportSchema = z.object({
  zoneId: z.string().min(1),
  streets: z.array(z.object({
    streetName: z.string().min(1),
    numberFrom: z.number().int().nullable().optional(),
    numberTo: z.number().int().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
  })),
});

/**
 * GET /api/delivery/streets - list streets
 * Query: ?zoneId=xxx or ?search=nazwa
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    
    if (zoneId) {
      where.zoneId = zoneId;
    }
    
    if (search) {
      where.streetName = { contains: search };
    }

    const streets = await prisma.deliveryStreet.findMany({
      where,
      include: {
        zone: {
          select: {
            id: true,
            number: true,
            name: true,
            deliveryCost: true,
            driverCommission: true,
          },
        },
      },
      orderBy: { streetName: "asc" },
      take: 200,
    });

    return NextResponse.json({
      streets: streets.map((s) => ({
        id: s.id,
        zoneId: s.zoneId,
        streetName: s.streetName,
        numberFrom: s.numberFrom,
        numberTo: s.numberTo,
        postalCode: s.postalCode,
        city: s.city,
        zone: {
          id: s.zone.id,
          number: s.zone.number,
          name: s.zone.name,
          deliveryCost: Number(s.zone.deliveryCost),
          driverCommission: Number(s.zone.driverCommission),
        },
      })),
    });
  } catch (e) {
    console.error("[DeliveryStreets GET]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d pobierania ulic" }, { status: 500 });
  }
}

/**
 * POST /api/delivery/streets - add street to zone
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = streetSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const zone = await prisma.deliveryZone.findUnique({
      where: { id: parsed.data.zoneId },
    });

    if (!zone) {
      return NextResponse.json({ error: "Strefa nie istnieje" }, { status: 404 });
    }

    const street = await prisma.deliveryStreet.create({
      data: {
        zoneId: parsed.data.zoneId,
        streetName: parsed.data.streetName,
        numberFrom: parsed.data.numberFrom ?? null,
        numberTo: parsed.data.numberTo ?? null,
        postalCode: parsed.data.postalCode ?? null,
        city: parsed.data.city ?? null,
      },
      include: {
        zone: {
          select: { id: true, number: true, name: true },
        },
      },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_STREET_ADDED", "DeliveryStreet", street.id, undefined, {
      zoneId: parsed.data.zoneId,
      streetName: parsed.data.streetName,
    });

    return NextResponse.json({ street }, { status: 201 });
  } catch (e) {
    console.error("[DeliveryStreets POST]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d dodawania ulicy" }, { status: 500 });
  }
}

/**
 * PUT /api/delivery/streets - bulk import streets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bulkImportSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "NieprawidĹ‚owe dane" },
        { status: 400 }
      );
    }

    const { zoneId, streets } = parsed.data;

    const zone = await prisma.deliveryZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      return NextResponse.json({ error: "Strefa nie istnieje" }, { status: 404 });
    }

    const result = await prisma.deliveryStreet.createMany({
      data: streets.map((s) => ({
        zoneId,
        streetName: s.streetName,
        numberFrom: s.numberFrom ?? null,
        numberTo: s.numberTo ?? null,
        postalCode: s.postalCode ?? null,
        city: s.city ?? null,
      })),
      skipDuplicates: true,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_STREETS_BULK_IMPORT", "DeliveryZone", zoneId, undefined, {
      count: result.count,
    });

    return NextResponse.json({
      imported: result.count,
      message: `Zaimportowano ${result.count} ulic`,
    });
  } catch (e) {
    console.error("[DeliveryStreets PUT]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d importu ulic" }, { status: 500 });
  }
}

/**
 * DELETE /api/delivery/streets - delete street
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brak ID ulicy" }, { status: 400 });
    }

    await prisma.deliveryStreet.delete({
      where: { id },
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "DELIVERY_STREET_DELETED", "DeliveryStreet", id);

    return NextResponse.json({ message: "Ulica usuniÄ™ta" });
  } catch (e) {
    console.error("[DeliveryStreets DELETE]", e);
    return NextResponse.json({ error: "BĹ‚Ä…d usuwania ulicy" }, { status: 500 });
  }
}
