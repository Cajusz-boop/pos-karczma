import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/export — export sales data for accounting systems
 * Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv|optima|symfonia|wfirma
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const format = searchParams.get("format") ?? "csv";

    const dateFrom = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
    const dateTo = to ? new Date(to + "T23:59:59") : new Date();

    // Get closed orders with items and payments
    const orders = await prisma.order.findMany({
      where: {
        status: "CLOSED",
        closedAt: { gte: dateFrom, lte: dateTo },
      },
      include: {
        user: { select: { name: true } },
        items: {
          where: { status: { not: "CANCELLED" } },
          include: {
            product: { select: { name: true, nameShort: true } },
            taxRate: { select: { fiscalSymbol: true, ratePercent: true } },
          },
        },
        payments: { select: { method: true, amount: true } },
        receipts: { select: { id: true, fiscalNumber: true } },
        invoices: { select: { id: true, invoiceNumber: true, buyerNip: true, buyerName: true } },
      },
      orderBy: { closedAt: "asc" },
    });

    if (format === "optima") {
      return generateOptimaCSV(orders, dateFrom, dateTo);
    }
    if (format === "symfonia") {
      return generateSymfoniaXML(orders, dateFrom, dateTo);
    }
    if (format === "wfirma") {
      return generateWFirmaCSV(orders, dateFrom, dateTo);
    }

    // Default CSV
    return generateGenericCSV(orders, dateFrom, dateTo);
  } catch (e) {
    console.error("[Export]", e);
    return NextResponse.json({ error: "Błąd eksportu" }, { status: 500 });
  }
}

type OrderWithRelations = Awaited<ReturnType<typeof prisma.order.findMany>>[number] & {
  user: { name: string };
  items: {
    product: { name: string; nameShort: string | null };
    taxRate: { symbol: string; rate: number };
    quantity: unknown;
    unitPrice: unknown;
    discountAmount: unknown;
  }[];
  payments: { method: string; amount: unknown }[];
  receipts: { id: string; fiscalNumber: string | null }[];
  invoices: { id: string; invoiceNumber: string | null; buyerNip: string | null; buyerName: string | null }[];
};

function generateGenericCSV(orders: OrderWithRelations[], dateFrom: Date, dateTo: Date) {
  const BOM = "\uFEFF";
  const header = "Data;Nr zamówienia;Kelner;Typ;Produkt;Ilość;Cena jedn.;Stawka VAT;Netto;VAT;Brutto;Forma płatności;Nr paragonu;Nr faktury;NIP\n";

  let csv = BOM + header;

  for (const order of orders) {
    const date = order.closedAt ? new Date(order.closedAt).toLocaleDateString("pl-PL") : "";
    const paymentMethod = order.payments.map((p) => p.method).join("+");
    const receiptNum = order.receipts[0]?.fiscalNumber ?? "";
    const invoiceNum = order.invoices[0]?.invoiceNumber ?? "";
    const nip = order.invoices[0]?.buyerNip ?? "";

    for (const item of order.items) {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const discount = Number(item.discountAmount ?? 0);
      const gross = qty * price - discount;
      const rate = Number(item.taxRate.ratePercentPercent);
      const net = gross / (1 + rate / 100);
      const vat = gross - net;

      csv += [
        date,
        order.orderNumber,
        order.user.name,
        order.type,
        `"${item.product.name}"`,
        qty.toFixed(3),
        price.toFixed(2),
        `${item.taxRate.fiscalSymbol} (${rate}%)`,
        net.toFixed(2),
        vat.toFixed(2),
        gross.toFixed(2),
        paymentMethod,
        receiptNum,
        invoiceNum,
        nip,
      ].join(";") + "\n";
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sprzedaz_${dateFrom.toISOString().slice(0, 10)}_${dateTo.toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function generateOptimaCSV(orders: OrderWithRelations[], dateFrom: Date, dateTo: Date) {
  const BOM = "\uFEFF";
  const header = "Lp;Data sprzedaży;Numer dokumentu;Kontrahent;NIP;Nazwa towaru;Ilość;Jm;Cena netto;Wartość netto;Stawka VAT;Kwota VAT;Wartość brutto;Forma płatności\n";

  let csv = BOM + header;
  let lp = 1;

  for (const order of orders) {
    const date = order.closedAt ? new Date(order.closedAt).toLocaleDateString("pl-PL") : "";
    const docNum = order.invoices[0]?.invoiceNumber ?? order.receipts[0]?.fiscalNumber ?? `PAR/${order.orderNumber}`;
    const buyer = order.invoices[0]?.buyerName ?? "Sprzedaż detaliczna";
    const nip = order.invoices[0]?.buyerNip ?? "";
    const paymentMethod = order.payments[0]?.method === "CASH" ? "gotówka" :
      order.payments[0]?.method === "CARD" ? "karta" :
        order.payments[0]?.method === "BLIK" ? "przelew" : "gotówka";

    for (const item of order.items) {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const discount = Number(item.discountAmount ?? 0);
      const gross = qty * price - discount;
      const rate = Number(item.taxRate.ratePercent);
      const net = gross / (1 + rate / 100);
      const vat = gross - net;

      csv += [
        lp++,
        date,
        `"${docNum}"`,
        `"${buyer}"`,
        nip,
        `"${item.product.nameShort ?? item.product.name}"`,
        qty.toFixed(3),
        "szt",
        (net / qty).toFixed(2),
        net.toFixed(2),
        `${rate}%`,
        vat.toFixed(2),
        gross.toFixed(2),
        paymentMethod,
      ].join(";") + "\n";
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="optima_${dateFrom.toISOString().slice(0, 10)}_${dateTo.toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function generateSymfoniaXML(orders: OrderWithRelations[], dateFrom: Date, dateTo: Date) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<DokumentySprzedazy okres_od="${dateFrom.toISOString().slice(0, 10)}" okres_do="${dateTo.toISOString().slice(0, 10)}">\n`;

  for (const order of orders) {
    const date = order.closedAt ? new Date(order.closedAt).toISOString().slice(0, 10) : "";
    const docNum = order.invoices[0]?.invoiceNumber ?? `PAR/${order.orderNumber}`;
    const nip = order.invoices[0]?.buyerNip ?? "";
    const buyer = order.invoices[0]?.buyerName ?? "Sprzedaż detaliczna";

    xml += `  <Dokument>\n`;
    xml += `    <DataSprzedazy>${date}</DataSprzedazy>\n`;
    xml += `    <NumerDokumentu>${escapeXml(docNum)}</NumerDokumentu>\n`;
    xml += `    <NIPNabywcy>${nip}</NIPNabywcy>\n`;
    xml += `    <NazwaNabywcy>${escapeXml(buyer)}</NazwaNabywcy>\n`;
    xml += `    <Pozycje>\n`;

    for (const item of order.items) {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const discount = Number(item.discountAmount ?? 0);
      const gross = qty * price - discount;
      const rate = Number(item.taxRate.ratePercent);
      const net = gross / (1 + rate / 100);
      const vat = gross - net;

      xml += `      <Pozycja>\n`;
      xml += `        <Nazwa>${escapeXml(item.product.name)}</Nazwa>\n`;
      xml += `        <Ilosc>${qty.toFixed(3)}</Ilosc>\n`;
      xml += `        <CenaNetto>${(net / qty).toFixed(2)}</CenaNetto>\n`;
      xml += `        <WartoscNetto>${net.toFixed(2)}</WartoscNetto>\n`;
      xml += `        <StawkaVAT>${rate}</StawkaVAT>\n`;
      xml += `        <KwotaVAT>${vat.toFixed(2)}</KwotaVAT>\n`;
      xml += `        <WartoscBrutto>${gross.toFixed(2)}</WartoscBrutto>\n`;
      xml += `      </Pozycja>\n`;
    }

    xml += `    </Pozycje>\n`;
    xml += `  </Dokument>\n`;
  }

  xml += `</DokumentySprzedazy>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="symfonia_${dateFrom.toISOString().slice(0, 10)}_${dateTo.toISOString().slice(0, 10)}.xml"`,
    },
  });
}

function generateWFirmaCSV(orders: OrderWithRelations[], dateFrom: Date, dateTo: Date) {
  const BOM = "\uFEFF";
  const header = "data_sprzedazy;numer_dokumentu;nip_nabywcy;nazwa_nabywcy;nazwa_produktu;ilosc;jednostka;cena_netto;wartosc_netto;stawka_vat;kwota_vat;wartosc_brutto\n";

  let csv = BOM + header;

  for (const order of orders) {
    const date = order.closedAt ? new Date(order.closedAt).toISOString().slice(0, 10) : "";
    const docNum = order.invoices[0]?.invoiceNumber ?? `PAR/${order.orderNumber}`;
    const nip = order.invoices[0]?.buyerNip ?? "";
    const buyer = order.invoices[0]?.buyerName ?? "";

    for (const item of order.items) {
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const discount = Number(item.discountAmount ?? 0);
      const gross = qty * price - discount;
      const rate = Number(item.taxRate.ratePercent);
      const net = gross / (1 + rate / 100);
      const vat = gross - net;

      csv += [
        date,
        `"${docNum}"`,
        nip,
        `"${buyer}"`,
        `"${item.product.name}"`,
        qty.toFixed(3),
        "szt",
        (net / qty).toFixed(2),
        net.toFixed(2),
        `${rate}`,
        vat.toFixed(2),
        gross.toFixed(2),
      ].join(";") + "\n";
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wfirma_${dateFrom.toISOString().slice(0, 10)}_${dateTo.toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
