import { nextInvoiceNumber, getPrefixForType } from "@/lib/invoice-number";
import { sendInvoiceToKsef } from "@/lib/ksef/client";
import { addDays } from "date-fns";

const FISCAL_TO_VAT: Record<string, number> = {
  A: 23,
  B: 8,
  C: 5,
  D: 0,
  E: 0,
  F: 0,
  G: 0,
};

function computeNetFromGross(gross: number, vatRate: number): number {
  if (vatRate <= 0) return gross;
  return Math.round((gross / (1 + vatRate / 100)) * 100) / 100;
}

type PaymentItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  fiscalSymbol: string;
};

export async function createKsefInvoiceFromPayment(
  tx: { invoice: { create: (args: { data: object }) => Promise<{ id: string }> } },
  orderId: string,
  buyerNip: string,
  items: PaymentItem[],
  amount: number
): Promise<string> {
  const itemsJson = items.map((i) => {
    const vatRate = FISCAL_TO_VAT[i.fiscalSymbol] ?? 23;
    const lineGross = i.lineTotal ?? i.quantity * i.unitPrice;
    const netPrice = computeNetFromGross(i.unitPrice, vatRate);
    const netAmount = i.quantity * netPrice;
    const vatAmount = lineGross - netAmount;
    return {
      name: i.name,
      qty: i.quantity,
      unitPrice: i.unitPrice,
      netPrice,
      vatRate,
      vatAmount,
      grossPrice: lineGross,
    };
  });

  const netTotal = itemsJson.reduce((s, i) => s + i.netPrice * i.qty, 0);
  const vatTotal = itemsJson.reduce((s, i) => s + i.vatAmount, 0);
  const grossTotal = amount;

  const now = new Date();
  const invoiceNumber = await nextInvoiceNumber(getPrefixForType("STANDARD"));

  const invoice = await tx.invoice.create({
    data: {
      invoiceNumber,
      type: "STANDARD",
      orderId,
      buyerNip,
      buyerName: `Firma z NIP ${buyerNip}`,
      buyerAddress: null,
      itemsJson: itemsJson as object,
      netTotal,
      vatTotal,
      grossTotal,
      paymentMethod: "ELECTRONIC",
      saleDate: now,
      issueDate: now,
      dueDate: addDays(now, 14),
      ksefStatus: "PENDING",
    },
  });

  setImmediate(() => {
    sendInvoiceToKsef(invoice.id).catch((e) =>
      console.error("[KSeF] Async send failed:", e)
    );
  });

  return invoice.id;
}
