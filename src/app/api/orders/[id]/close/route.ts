import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { posnetDriver } from "@/lib/fiscal";
import { consumeStockForOrder } from "@/lib/warehouse/auto-consume";
import type { ReceiptPayload } from "@/lib/fiscal";
import { parseBodyOptional, closeOrderSchema } from "@/lib/validation";
import { generateReceiptHtml, type ReceiptData } from "@/lib/e-receipt/generator";
import { addDays } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { data, error: valError } = await parseBodyOptional(request, closeOrderSchema);
    if (valError) return valError;
    const { receipt, buyerNip } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        payments: true,
        items: {
          where: { status: { not: "CANCELLED" } },
          include: { product: true, taxRate: true },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 404 });
    }
    if (order.status === "CLOSED") {
      return NextResponse.json({ error: "Zamówienie już zamknięte" }, { status: 400 });
    }

    const orderTotal = order.items.reduce(
      (sum, i) =>
        sum + Number(i.quantity) * Number(i.unitPrice) - Number(i.discountAmount ?? 0),
      0
    );
    let orderDiscount = 0;
    if (order.discountJson && typeof order.discountJson === "object") {
      const d = order.discountJson as { type?: string; value?: number };
      if (d.type === "PERCENT" && typeof d.value === "number") {
        orderDiscount = (orderTotal * d.value) / 100;
      } else if (d.type === "AMOUNT" && typeof d.value === "number") {
        orderDiscount = d.value;
      }
    }
    const finalTotal = Math.round((orderTotal - orderDiscount) * 100) / 100;
    const paidTotal = Math.round(
      order.payments.reduce((sum, p) => sum + Number(p.amount), 0) * 100
    ) / 100;

    // Allow closing zero-balance orders without payments
    if (finalTotal > 0 && paidTotal < finalTotal) {
      return NextResponse.json(
        {
          error: `Suma płatności (${paidTotal.toFixed(2)} zł) nie pokrywa kwoty zamówienia (${finalTotal.toFixed(2)} zł)`,
        },
        { status: 400 }
      );
    }

    let fiscalNumber: string | null = null;
    let printerId = "default";

    if (receipt) {
      const fiscalPrinter = await prisma.printer.findFirst({
        where: { type: "FISCAL", isActive: true },
      });
      if (fiscalPrinter) printerId = fiscalPrinter.id;

      const payload: ReceiptPayload = {
        orderNumber: order.orderNumber,
        items: order.items.map((i) => ({
          name: i.product.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          vatSymbol: i.taxRate.fiscalSymbol || "A",
        })),
        payments: order.payments.map((p) => ({
          method: p.method,
          amount: Number(p.amount),
        })),
        buyerNip: typeof buyerNip === "string" && buyerNip.trim() ? buyerNip.trim() : undefined,
      };

      let discountAmount = 0;
      if (order.discountJson && typeof order.discountJson === "object") {
        const d = order.discountJson as { type?: string; value?: number };
        if (d.type === "PERCENT" && typeof d.value === "number") {
          const subtotal = payload.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
          discountAmount = (subtotal * d.value) / 100;
        } else if (d.type === "AMOUNT" && typeof d.value === "number") {
          discountAmount = d.value;
        }
      }
      if (discountAmount > 0) payload.discountAmount = discountAmount;

      const result = await posnetDriver.printReceipt(payload);
      if (result.success && result.fiscalNumber) {
        fiscalNumber = result.fiscalNumber;
      } else {
        fiscalNumber = `DEMO-${Date.now()}`;
        console.warn("[close] Fiskalizacja nieudana, rachunek niefiskalny:", result.error);
      }
    }

    const finalFiscalNumber = fiscalNumber;
    const finalPrinterId = printerId;
    const finalBuyerNip = typeof buyerNip === "string" && buyerNip.trim() ? buyerNip.trim() : null;

    // Build e-receipt HTML
    let receiptHtml: string | null = null;
    if (receipt) {
      const configRows = await prisma.systemConfig.findMany({
        where: { key: { in: ["companyName", "companyNip", "companyAddress"] } },
      });
      const cfg: Record<string, string> = {};
      for (const r of configRows) cfg[r.key] = String(r.value ?? "");

      const vatRates: Record<string, number> = {};
      for (const item of order.items) {
        vatRates[item.taxRate.fiscalSymbol || "A"] = Number(item.taxRate.ratePercent);
      }

      const subtotal = order.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0
      );

      const vatBreakdown: Record<string, { net: number; vat: number; gross: number }> = {};
      for (const item of order.items) {
        const sym = item.taxRate.fiscalSymbol || "A";
        const rate = Number(item.taxRate.ratePercent);
        const lineGross = Number(item.quantity) * Number(item.unitPrice);
        const lineNet = lineGross / (1 + rate / 100);
        const lineVat = lineGross - lineNet;
        if (!vatBreakdown[sym]) vatBreakdown[sym] = { net: 0, vat: 0, gross: 0 };
        vatBreakdown[sym].net += lineNet;
        vatBreakdown[sym].vat += lineVat;
        vatBreakdown[sym].gross += lineGross;
      }

      const primaryMethod = order.payments[0]?.method ?? "CASH";

      const receiptData: ReceiptData = {
        orderNumber: order.orderNumber,
        date: new Date().toISOString(),
        items: order.items.map((i) => ({
          name: i.product.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          vatSymbol: i.taxRate.fiscalSymbol || "A",
        })),
        subtotal,
        discountAmount: orderDiscount,
        total: finalTotal,
        vatBreakdown,
        paymentMethod: primaryMethod,
        companyName: cfg.companyName || "Karczma Łabędź",
        companyNip: cfg.companyNip || "",
        companyAddress: cfg.companyAddress || "",
        buyerNip: finalBuyerNip ?? undefined,
      };

      receiptHtml = generateReceiptHtml(receiptData);
    }

    const now = new Date();
    let receiptToken: string | null = null;

    await prisma.$transaction(async (tx) => {
      if (receipt && finalFiscalNumber) {
        const createdReceipt = await tx.receipt.create({
          data: {
            orderId,
            fiscalNumber: finalFiscalNumber,
            printerId: finalPrinterId,
            buyerNip: finalBuyerNip || undefined,
            htmlContent: receiptHtml,
            expiresAt: addDays(now, 30),
          },
        });
        receiptToken = createdReceipt.token;
      }
      await tx.orderItem.updateMany({
        where: { orderId, status: "READY" },
        data: { status: "SERVED", servedAt: now },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CLOSED", closedAt: now },
      });
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "FREE" },
        });
      }
    });

    await auditLog(null, "ORDER_CLOSED", "Order", orderId, { status: order.status }, { status: "CLOSED" });
    try {
      await consumeStockForOrder(orderId, order.userId);
    } catch (e) {
      console.error("[close] Auto-rozchód magazynowy:", e);
    }
    return NextResponse.json({
      ok: true,
      fiscalNumber: finalFiscalNumber ?? undefined,
      receiptToken: receiptToken ?? undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zamykania rachunku" }, { status: 500 });
  }
}
