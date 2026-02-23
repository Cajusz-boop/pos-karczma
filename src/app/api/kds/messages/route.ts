import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, kdsMessageSchema } from "@/lib/validation";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("read") === "false";
    const messages = await prisma.kitchenMessage.findMany({
      where: unreadOnly ? { readAt: null } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(
      messages.map((m) => ({
        id: m.id,
        orderId: m.orderId,
        tableId: m.tableId,
        message: m.message,
        readAt: m.readAt,
        createdAt: m.createdAt,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd pobierania wiadomości" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, kdsMessageSchema);
    if (valError) return valError;
    const { orderId, tableId, message } = data;
    const created = await prisma.kitchenMessage.create({
      data: {
        orderId: orderId ?? null,
        tableId: tableId ?? null,
        message: message.trim().slice(0, 500),
      },
    });
    return NextResponse.json({
      id: created.id,
      message: created.message,
      createdAt: created.createdAt,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd wysyłania wiadomości" }, { status: 500 });
  }
}
