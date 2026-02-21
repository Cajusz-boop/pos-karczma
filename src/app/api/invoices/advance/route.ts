import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { nextInvoiceNumber, getPrefixForType } from "@/lib/invoice-number";
import { sendInvoiceToKsef } from "@/lib/ksef";
import { parseBody, advanceInvoiceSchema } from "@/lib/validation";

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: "wesele",
  EIGHTEENTH: "18-tkę",
  CORPORATE: "imprezę firmową",
  COMMUNION: "komunię",
  CHRISTENING: "chrzciny",
  FUNERAL: "stypę",
  OTHER: "imprezę",
};

/**
 * POST /api/invoices/advance — faktura zaliczkowa (z poziomu BanquetEvent).
 * Body: banquetEventId, amount, paymentMethod?, buyerNip?, buyerName?, buyerAddress?
 */
export async function POST(request: NextRequest) {
  try {
    const { data, error: valError } = await parseBody(request, advanceInvoiceSchema);
    if (valError) return valError;
    const { banquetEventId, amount, paymentMethod, buyerNip, buyerName, buyerAddress } = data;

    const event = await prisma.banquetEvent.findUnique({
      where: { id: banquetEventId },
      include: { reservation: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Impreza nie istnieje" }, { status: 404 });
    }

    const eventDate = event.reservation?.date
      ? new Date(event.reservation.date).toLocaleDateString("pl-PL")
      : "—";
    const eventTypeLabel = EVENT_TYPE_LABELS[event.eventType] ?? "imprezę";
    const pricePerPerson = Number(event.pricePerPerson);
    const guestCount = event.guestCount;
    const description = `Zaliczka na imprezę (${eventTypeLabel}) dnia ${eventDate}, ${guestCount} osób × ${pricePerPerson.toFixed(2)} zł`;

    // Zaliczka: jedna pozycja, VAT 8% (usługa gastronomiczna)
    const vatRate = 8;
    const grossTotal = amount;
    const netTotal = grossTotal / (1 + vatRate / 100);
    const vatAmount = grossTotal - netTotal;

    const itemsJson = [
      {
        name: description,
        qty: 1,
        unitPrice: grossTotal,
        netPrice: netTotal,
        vatRate,
        vatAmount,
        grossPrice: grossTotal,
      },
    ];

    const now = new Date();
    const invoiceNumber = await nextInvoiceNumber(getPrefixForType("ADVANCE"));

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: "ADVANCE",
        banquetEventId,
        buyerNip: buyerNip?.trim() || null,
        buyerName: buyerName?.trim() || null,
        buyerAddress: buyerAddress?.trim() || null,
        itemsJson: itemsJson as object,
        netTotal,
        vatTotal: vatAmount,
        grossTotal,
        paymentMethod: paymentMethod ?? null,
        saleDate: now,
        issueDate: now,
        dueDate: addDays(now, 14),
        ksefStatus: "PENDING",
      },
    });

    await prisma.banquetEvent.update({
      where: { id: banquetEventId },
      data: { depositPaid: { increment: amount }, depositMethod: paymentMethod ?? null },
    });

    // Wysyłka do KSeF (jeśli włączona w konfiguracji)
    const ksefResult = await sendInvoiceToKsef(invoice.id);
    if (ksefResult.sent) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          ksefStatus: ksefResult.status,
          ksefRefNumber: ksefResult.refNumber ?? undefined,
          ksefErrorMessage: ksefResult.errorMessage ?? undefined,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      ksefStatus: ksefResult.sent ? ksefResult.status : "PENDING",
      ksefRefNumber: ksefResult.refNumber ?? undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Błąd wystawiania faktury zaliczkowej" },
      { status: 500 }
    );
  }
}
