import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatKitchenTicket } from "@/lib/print/kitchen";
import { parseBody, printKitchenSchema } from "@/lib/validation";

/**
 * POST /api/print/kitchen — buduje bilety kuchenne dla zamówienia (routing wg kategorii).
 * Body: { orderId: string, reprint?: boolean }
 * Zwraca { ok, tickets: [{ printerId, printerName, text }] }. W trybie DEMO nie wysyła do sprzętu.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, printKitchenSchema);
    if (valError) return valError;
    const { orderId } = data;
    const reprint = (data as Record<string, unknown>).reprint as boolean | undefined;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: { select: { number: true } },
        user: { select: { name: true } },
        items: {
          where: reprint ? undefined : { status: { in: ["SENT", "IN_PROGRESS", "READY", "SERVED"] } },
          include: {
            product: { select: { name: true, categoryId: true } },
            taxRate: true,
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });

    const kitchenItems = order.items.map((i) => ({
      productName: i.product.name,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      modifiersJson: i.modifiersJson,
      note: i.note,
      courseNumber: i.courseNumber ?? 1,
    }));

    const orderInfo = {
      orderNumber: order.orderNumber,
      tableNumber: order.table?.number ?? null,
      waiterName: order.user.name,
      createdAt: order.createdAt,
      isBanquet: order.type === "BANQUET",
      banquetName: order.banquetEventId ? "Bankiet" : undefined,
    };

    const fullText = formatKitchenTicket(orderInfo, kitchenItems, { reprint: reprint ?? false });

    const printers = await prisma.printer.findMany({
      where: { type: { in: ["KITCHEN", "BAR"] }, isActive: true },
      include: {
        categoryAssignments: { select: { categoryId: true } },
      },
    });

    const tickets: { printerId: string; printerName: string; text: string }[] = [];

    if (printers.length === 0) {
      tickets.push({ printerId: "", printerName: "KDS (brak drukarek)", text: fullText });
    } else {
      const byCategory = new Map<string, string[]>();
      for (const p of printers) {
        for (const a of p.categoryAssignments) {
          if (!byCategory.has(a.categoryId)) byCategory.set(a.categoryId, []);
          byCategory.get(a.categoryId)!.push(p.id);
        }
      }
      const itemsByPrinterId = new Map<string, typeof kitchenItems>();
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const catId = item.product.categoryId;
        const printerIds = byCategory.get(catId) ?? [];
        if (printerIds.length === 0) {
          const fallback = printers[0];
          if (fallback) {
            const key = fallback.id;
            if (!itemsByPrinterId.has(key)) itemsByPrinterId.set(key, []);
            itemsByPrinterId.get(key)!.push(kitchenItems[i]);
          }
        } else {
          for (const pid of printerIds) {
            if (!itemsByPrinterId.has(pid)) itemsByPrinterId.set(pid, []);
            itemsByPrinterId.get(pid)!.push(kitchenItems[i]);
          }
        }
      }
      for (const [printerId, items] of Array.from(itemsByPrinterId)) {
        const p = printers.find((x) => x.id === printerId);
        const text = formatKitchenTicket(orderInfo, items, { reprint: reprint ?? false });
        tickets.push({ printerId, printerName: p?.name ?? "Drukarka", text });
      }
      if (tickets.length === 0 && fullText) {
        tickets.push({ printerId: printers[0].id, printerName: printers[0].name, text: fullText });
      }
    }

    return NextResponse.json({ ok: true, tickets });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd generowania wydruku kuchennego" }, { status: 500 });
  }
}
