import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auditLog } from "@/lib/audit";

const preferencesSchema = z.object({
  keyboardMode: z.boolean().optional(),
  t9Mode: z.boolean().optional(),
  buttonRows: z.number().int().min(4).max(6).optional(),
  showPrices: z.boolean().optional(),
  showImages: z.boolean().optional(),
  confirmQuantity: z.boolean().optional(),
  autoPrintKitchen: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  quickAmounts: z.array(z.number()).optional(),
  favoriteProducts: z.array(z.string()).optional(),
  customColors: z.object({
    background: z.string().optional(),
    accent: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
});

/**
 * GET /api/users/[id]/pos-preferences - get POS preferences
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    let prefs = await prisma.userPosPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.userPosPreference.create({
        data: { userId },
      });
    }

    return NextResponse.json({
      preferences: {
        keyboardMode: prefs.keyboardMode,
        t9Mode: prefs.t9Mode,
        buttonRows: prefs.buttonRows,
        showPrices: prefs.showPrices,
        showImages: prefs.showImages,
        confirmQuantity: prefs.confirmQuantity,
        autoPrintKitchen: prefs.autoPrintKitchen,
        soundEnabled: prefs.soundEnabled,
        quickAmounts: prefs.quickAmounts ?? [0.25, 0.5, 1, 2, 5],
        favoriteProducts: prefs.favoriteProducts ?? [],
        recentProducts: prefs.recentProducts ?? [],
        customColors: prefs.customColors,
      },
    });
  } catch (e) {
    console.error("[PosPref GET]", e);
    return NextResponse.json({ error: "Błąd pobierania preferencji" }, { status: 500 });
  }
}

/**
 * PUT /api/users/[id]/pos-preferences - update POS preferences
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 }
      );
    }

    const prefs = await prisma.userPosPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...parsed.data,
      },
      update: parsed.data,
    });

    const requestUserId = request.headers.get("x-user-id");
    await auditLog(requestUserId, "POS_PREFERENCES_UPDATED", "UserPosPreference", prefs.id, undefined, parsed.data);

    return NextResponse.json({
      preferences: prefs,
      message: "Preferencje zapisane",
    });
  } catch (e) {
    console.error("[PosPref PUT]", e);
    return NextResponse.json({ error: "Błąd zapisywania preferencji" }, { status: 500 });
  }
}

/**
 * PATCH /api/users/[id]/pos-preferences/recent - add recent product
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "Brak ID produktu" }, { status: 400 });
    }

    const prefs = await prisma.userPosPreference.findUnique({
      where: { userId },
      select: { recentProducts: true },
    });

    const recent = (prefs?.recentProducts as string[] | null) ?? [];
    const filtered = recent.filter((id) => id !== productId);
    filtered.unshift(productId);
    const updated = filtered.slice(0, 20);

    await prisma.userPosPreference.upsert({
      where: { userId },
      create: { userId, recentProducts: updated },
      update: { recentProducts: updated },
    });

    return NextResponse.json({ recentProducts: updated });
  } catch (e) {
    console.error("[PosPref PATCH]", e);
    return NextResponse.json({ error: "Błąd aktualizacji historii" }, { status: 500 });
  }
}
