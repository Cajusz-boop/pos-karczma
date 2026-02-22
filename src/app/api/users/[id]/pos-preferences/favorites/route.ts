import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/users/[id]/pos-preferences/favorites - toggle favorite product
 */
export async function POST(
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
      select: { favoriteProducts: true },
    });

    const favorites = (prefs?.favoriteProducts as string[] | null) ?? [];
    let newFavorites: string[];
    let isFavorite: boolean;

    if (favorites.includes(productId)) {
      newFavorites = favorites.filter((id) => id !== productId);
      isFavorite = false;
    } else {
      newFavorites = [...favorites, productId];
      isFavorite = true;
    }

    await prisma.userPosPreference.upsert({
      where: { userId },
      create: { userId, favoriteProducts: newFavorites },
      update: { favoriteProducts: newFavorites },
    });

    return NextResponse.json({ 
      favoriteProducts: newFavorites, 
      isFavorite,
      productId 
    });
  } catch (e) {
    console.error("[Favorites POST]", e);
    return NextResponse.json({ error: "Błąd aktualizacji ulubionych" }, { status: 500 });
  }
}
