export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

const RECEIPT_BASE_URL =
  process.env.RECEIPT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/**
 * GET /api/tables/[id]/qr — pobierz QR PNG
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const table = await prisma.table.findUnique({
      where: { id },
      select: { qrId: true, number: true },
    });

    if (!table) {
      return NextResponse.json({ error: "Stolik nie istnieje" }, { status: 404 });
    }

    if (!table.qrId) {
      return NextResponse.json(
        { error: "Stolik nie ma aktywnego kodu QR. Użyj POST aby aktywować." },
        { status: 400 }
      );
    }

    const url = `${RECEIPT_BASE_URL.replace(/\/$/, "")}/receipt/${table.qrId}`;
    const buffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "Q",
      color: { dark: "#000000", light: "#FFFFFF" },
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="stolik-${table.number}-qr.png"`,
      },
    });
  } catch (e) {
    console.error("[tables/qr] GET error:", e);
    return NextResponse.json(
      { error: "Błąd generowania QR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tables/[id]/qr — aktywuj lub regeneruj QR
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const table = await prisma.table.findUnique({ where: { id } });

    if (!table) {
      return NextResponse.json({ error: "Stolik nie istnieje" }, { status: 404 });
    }

    const newQrId = crypto.randomUUID();
    await prisma.table.update({
      where: { id },
      data: { qrId: newQrId },
    });

    const url = `${RECEIPT_BASE_URL.replace(/\/$/, "")}/receipt/${newQrId}`;

    return NextResponse.json({
      qrId: newQrId,
      url,
      message: table.qrId ? "Kod QR został zregenerowany" : "Kod QR został aktywowany",
    });
  } catch (e) {
    console.error("[tables/qr] POST error:", e);
    return NextResponse.json(
      { error: "Błąd aktywacji QR" },
      { status: 500 }
    );
  }
}
