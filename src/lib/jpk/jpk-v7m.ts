/**
 * Generator JPK_V7M — Jednolity Plik Kontrolny (VAT)
 * Zgodny ze schematem MF: JPK_V7M(2)
 *
 * Generuje XML z sekcjami:
 * - Naglowek (Header)
 * - Podmiot1 (Subject)
 * - SprzedazWiersz (Sales rows)
 * - SprzedazCtrl (Sales control)
 */

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface JpkConfig {
  nip: string;
  companyName: string;
  companyAddress?: string;
  email?: string;
  phone?: string;
}

interface SalesRow {
  invoiceNumber: string;
  saleDate: string;
  issueDate: string;
  buyerNip: string | null;
  buyerName: string | null;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: string;
  invoiceType: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDecimal(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * Generuje JPK_V7M XML dla danego miesiąca.
 */
export async function generateJpkV7M(
  year: number,
  month: number,
  config: JpkConfig
): Promise<string> {
  const periodStart = startOfMonth(new Date(year, month - 1));
  const periodEnd = endOfMonth(new Date(year, month - 1));

  // Fetch invoices for the period
  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { issueDate: "asc" },
  });

  // Fetch receipts (paragony) for the period — aggregated as RO (Raport Okresowy)
  const receipts = await prisma.receipt.findMany({
    where: {
      printedAt: { gte: periodStart, lte: periodEnd },
    },
    include: {
      order: {
        include: {
          items: {
            where: { status: { not: "CANCELLED" } },
            include: { taxRate: true },
          },
        },
      },
    },
  });

  // Build sales rows from invoices
  const salesRows: SalesRow[] = [];

  for (const inv of invoices) {
    const items = inv.itemsJson as Array<{
      name: string;
      qty: number;
      unitPrice: number;
      netPrice: number;
      vatRate: number;
      vatAmount: number;
      grossPrice: number;
    }>;

    // Group by VAT rate
    const byRate: Record<string, { net: number; vat: number; gross: number }> = {};
    for (const item of items ?? []) {
      const rateKey = String(item.vatRate ?? 0);
      if (!byRate[rateKey]) byRate[rateKey] = { net: 0, vat: 0, gross: 0 };
      byRate[rateKey].net += item.netPrice ?? 0;
      byRate[rateKey].vat += item.vatAmount ?? 0;
      byRate[rateKey].gross += item.grossPrice ?? 0;
    }

    for (const [rate, amounts] of Object.entries(byRate)) {
      salesRows.push({
        invoiceNumber: inv.invoiceNumber,
        saleDate: format(inv.saleDate, "yyyy-MM-dd"),
        issueDate: format(inv.issueDate, "yyyy-MM-dd"),
        buyerNip: inv.buyerNip,
        buyerName: inv.buyerName,
        netAmount: amounts.net,
        vatAmount: amounts.vat,
        grossAmount: amounts.gross,
        vatRate: rate,
        invoiceType: inv.type === "CORRECTION" ? "KOREKTA" : "FV",
      });
    }
  }

  // Aggregate receipts by day and VAT rate for RO entries
  const receiptsByDay: Record<string, Record<string, { net: number; vat: number; gross: number; count: number }>> = {};

  for (const receipt of receipts) {
    const day = format(receipt.printedAt, "yyyy-MM-dd");
    if (!receiptsByDay[day]) receiptsByDay[day] = {};

    for (const item of receipt.order.items) {
      const rate = String(Number(item.taxRate.ratePercent));
      if (!receiptsByDay[day][rate]) receiptsByDay[day][rate] = { net: 0, vat: 0, gross: 0, count: 0 };
      const gross = Number(item.quantity) * Number(item.unitPrice) - Number(item.discountAmount ?? 0);
      const ratePercent = Number(item.taxRate.ratePercent);
      const net = gross / (1 + ratePercent / 100);
      receiptsByDay[day][rate].net += net;
      receiptsByDay[day][rate].vat += gross - net;
      receiptsByDay[day][rate].gross += gross;
      receiptsByDay[day][rate].count += 1;
    }
  }

  // Add RO (Raport Okresowy) entries for receipts
  for (const [day, rates] of Object.entries(receiptsByDay)) {
    for (const [rate, amounts] of Object.entries(rates)) {
      salesRows.push({
        invoiceNumber: `RO/${day.replace(/-/g, "/")}`,
        saleDate: day,
        issueDate: day,
        buyerNip: null,
        buyerName: null,
        netAmount: amounts.net,
        vatAmount: amounts.vat,
        grossAmount: amounts.gross,
        vatRate: rate,
        invoiceType: "RO",
      });
    }
  }

  // Calculate control sums
  const totalNet = salesRows.reduce((s, r) => s + r.netAmount, 0);
  const totalVat = salesRows.reduce((s, r) => s + r.vatAmount, 0);
  const rowCount = salesRows.length;

  // Build XML
  const periodStr = format(periodStart, "yyyy-MM");
  const now = new Date();
  const creationDate = format(now, "yyyy-MM-dd'T'HH:mm:ss");

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<JPK xmlns="http://crd.gov.pl/wzor/2022/02/17/11148/" xmlns:etd="http://crd.gov.pl/xml/schematy/dziedzinowe/mf/2022/01/05/eD/DefinicjeTypy/">\n`;

  // Naglowek (Header)
  xml += `  <Naglowek>\n`;
  xml += `    <KodFormularza kodSystemowy="JPK_V7M (2)" wersjaSchemy="1-2E">JPK_VAT</KodFormularza>\n`;
  xml += `    <WariantFormularza>2</WariantFormularza>\n`;
  xml += `    <DataWytworzeniaJPK>${creationDate}</DataWytworzeniaJPK>\n`;
  xml += `    <NazwaSystemu>POS Karczma Łabędź</NazwaSystemu>\n`;
  xml += `    <CelZlozenia plesent="1">1</CelZlozenia>\n`;
  xml += `    <KodUrzedu>0000</KodUrzedu>\n`;
  xml += `    <Rok>${year}</Rok>\n`;
  xml += `    <Miesiac>${month}</Miesiac>\n`;
  xml += `  </Naglowek>\n`;

  // Podmiot1 (Subject)
  xml += `  <Podmiot1>\n`;
  xml += `    <OsobaFizyczna>\n`;
  xml += `      <etd:NIP>${escapeXml(config.nip)}</etd:NIP>\n`;
  xml += `      <etd:ImiePierwsze>${escapeXml(config.companyName.split(" ")[0] ?? "")}</etd:ImiePierwsze>\n`;
  xml += `      <etd:Nazwisko>${escapeXml(config.companyName.split(" ").slice(1).join(" ") || config.companyName)}</etd:Nazwisko>\n`;
  xml += `      <etd:DataUrodzenia>1970-01-01</etd:DataUrodzenia>\n`;
  xml += `    </OsobaFizyczna>\n`;
  if (config.email) {
    xml += `    <Email>${escapeXml(config.email)}</Email>\n`;
  }
  if (config.phone) {
    xml += `    <Telefon>${escapeXml(config.phone)}</Telefon>\n`;
  }
  xml += `  </Podmiot1>\n`;

  // SprzedazWiersz (Sales rows)
  for (let i = 0; i < salesRows.length; i++) {
    const row = salesRows[i];
    xml += `  <SprzedazWiersz>\n`;
    xml += `    <LpSprzedazy>${i + 1}</LpSprzedazy>\n`;
    xml += `    <NrDowodu>${escapeXml(row.invoiceNumber)}</NrDowodu>\n`;
    xml += `    <DataWystawienia>${row.issueDate}</DataWystawienia>\n`;
    xml += `    <DataSprzedazy>${row.saleDate}</DataSprzedazy>\n`;
    xml += `    <TypDokumentu>${row.invoiceType}</TypDokumentu>\n`;
    if (row.buyerNip) {
      xml += `    <KodKrajuNadaniaTIN>PL</KodKrajuNadaniaTIN>\n`;
      xml += `    <NrKontrahenta>${escapeXml(row.buyerNip)}</NrKontrahenta>\n`;
    }
    if (row.buyerName) {
      xml += `    <NazwaKontrahenta>${escapeXml(row.buyerName)}</NazwaKontrahenta>\n`;
    }

    // Map VAT rate to JPK fields
    const rateNum = parseFloat(row.vatRate);
    if (rateNum === 23) {
      xml += `    <K_19>${formatDecimal(row.netAmount)}</K_19>\n`;
      xml += `    <K_20>${formatDecimal(row.vatAmount)}</K_20>\n`;
    } else if (rateNum === 8) {
      xml += `    <K_17>${formatDecimal(row.netAmount)}</K_17>\n`;
      xml += `    <K_18>${formatDecimal(row.vatAmount)}</K_18>\n`;
    } else if (rateNum === 5) {
      xml += `    <K_15>${formatDecimal(row.netAmount)}</K_15>\n`;
      xml += `    <K_16>${formatDecimal(row.vatAmount)}</K_16>\n`;
    } else if (rateNum === 0) {
      xml += `    <K_13>${formatDecimal(row.netAmount)}</K_13>\n`;
    } else {
      xml += `    <K_19>${formatDecimal(row.netAmount)}</K_19>\n`;
      xml += `    <K_20>${formatDecimal(row.vatAmount)}</K_20>\n`;
    }

    // Markers
    if (row.invoiceType === "RO") {
      xml += `    <SprzedazVAT_Marza>false</SprzedazVAT_Marza>\n`;
    }

    xml += `  </SprzedazWiersz>\n`;
  }

  // SprzedazCtrl (Sales control)
  xml += `  <SprzedazCtrl>\n`;
  xml += `    <LiczbaWierszySprzedazy>${rowCount}</LiczbaWierszySprzedazy>\n`;
  xml += `    <PodatekNalezny>${formatDecimal(totalVat)}</PodatekNalezny>\n`;
  xml += `  </SprzedazCtrl>\n`;

  xml += `</JPK>\n`;

  return xml;
}
