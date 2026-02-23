import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/e-receipt/[token]
 * Public endpoint (no auth). Returns e-receipt HTML by token.
 * Marks viewedAt on first view.
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"token":"_"} ];
}


export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return new NextResponse("Brak tokenu", { status: 400 });
    }

    const receipt = await prisma.receipt.findUnique({
      where: { token },
    });

    if (!receipt) {
      return new NextResponse("Paragon nie znaleziony", { status: 404 });
    }

    if (receipt.expiresAt && receipt.expiresAt < new Date()) {
      return new NextResponse("Link do paragonu wygasł", { status: 404 });
    }

    if (!receipt.htmlContent) {
      return new NextResponse("Brak zawartości paragonu", { status: 404 });
    }

    if (!receipt.viewedAt) {
      await prisma.receipt.update({
        where: { token },
        data: { viewedAt: new Date() },
      });
    }

    return new NextResponse(receipt.htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[e-receipt] GET error:", e);
    return new NextResponse("Błąd serwera", { status: 500 });
  }
}
