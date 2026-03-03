import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";
import { getKsefConfig } from "./config";
import { auditLog } from "@/lib/audit";

export type KsefSendResult = {
  sent: boolean;
  status: "PENDING" | "SENT" | "ACCEPTED" | "REJECTED" | "OFFLINE_QUEUED";
  refNumber?: string | null;
  errorMessage?: string | null;
};

type KsefStatusResult = {
  status: "PENDING" | "SENT" | "ACCEPTED" | "REJECTED";
  refNumber?: string | null;
  upoUrl?: string | null;
  errorMessage?: string | null;
};

const KSEF_API_URLS = {
  test: "https://ksef-test.mf.gov.pl/api",
  prod: "https://ksef.mf.gov.pl/api",
};

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Build KSeF FA(2) XML from invoice data.
 */
function buildInvoiceXml(invoice: {
  invoiceNumber: string;
  buyerNip: string | null;
  buyerName: string | null;
  buyerAddress: string | null;
  itemsJson: unknown;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  saleDate: Date;
  issueDate: Date;
  type: string;
  correctionReason: string | null;
  relatedInvoiceId: string | null;
}, config: { nip: string; subjectName: string; subjectAddress: string }): string {
  const items = (invoice.itemsJson ?? []) as Array<{
    name: string;
    qty: number;
    unitPrice: number;
    netPrice: number;
    vatRate: number;
    vatAmount: number;
    grossPrice: number;
  }>;

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
  const fmtDec = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<Faktura xmlns="http://crd.gov.pl/wzor/2023/06/29/12648/">\n`;

  // Naglowek
  xml += `  <Naglowek>\n`;
  xml += `    <KodFormularza kodSystemowy="FA (2)" wersjaSchemy="1-0E">FA</KodFormularza>\n`;
  xml += `    <WariantFormularza>2</WariantFormularza>\n`;
  xml += `    <DataWytworzeniaFa>${new Date().toISOString()}</DataWytworzeniaFa>\n`;
  xml += `    <SystemInfo>POS Karczma Łabędź</SystemInfo>\n`;
  xml += `  </Naglowek>\n`;

  // Podmiot1 (Seller)
  xml += `  <Podmiot1>\n`;
  xml += `    <DaneIdentyfikacyjne>\n`;
  xml += `      <NIP>${esc(config.nip)}</NIP>\n`;
  xml += `      <Nazwa>${esc(config.subjectName)}</Nazwa>\n`;
  xml += `    </DaneIdentyfikacyjne>\n`;
  xml += `    <Adres>\n`;
  xml += `      <AdresL1>${esc(config.subjectAddress || "")}</AdresL1>\n`;
  xml += `    </Adres>\n`;
  xml += `  </Podmiot1>\n`;

  // Podmiot2 (Buyer)
  if (invoice.buyerNip) {
    xml += `  <Podmiot2>\n`;
    xml += `    <DaneIdentyfikacyjne>\n`;
    xml += `      <NIP>${esc(invoice.buyerNip)}</NIP>\n`;
    if (invoice.buyerName) xml += `      <Nazwa>${esc(invoice.buyerName)}</Nazwa>\n`;
    xml += `    </DaneIdentyfikacyjne>\n`;
    if (invoice.buyerAddress) {
      xml += `    <Adres>\n`;
      xml += `      <AdresL1>${esc(invoice.buyerAddress)}</AdresL1>\n`;
      xml += `    </Adres>\n`;
    }
    xml += `  </Podmiot2>\n`;
  }

  // Fa
  xml += `  <Fa>\n`;
  xml += `    <KodWaluty>PLN</KodWaluty>\n`;
  xml += `    <P_1>${fmtDate(invoice.issueDate)}</P_1>\n`;
  xml += `    <P_2>${esc(invoice.invoiceNumber)}</P_2>\n`;
  xml += `    <P_6>${fmtDate(invoice.saleDate)}</P_6>\n`;

  // Correction reference
  if (invoice.type === "CORRECTION" && invoice.relatedInvoiceId) {
    xml += `    <RodzajFaktury>KOR</RodzajFaktury>\n`;
    if (invoice.correctionReason) {
      xml += `    <PrzyczynaKorekty>${esc(invoice.correctionReason)}</PrzyczynaKorekty>\n`;
    }
  } else if (invoice.type === "ADVANCE") {
    xml += `    <RodzajFaktury>ZAL</RodzajFaktury>\n`;
  } else {
    xml += `    <RodzajFaktury>VAT</RodzajFaktury>\n`;
  }

  // Items
  xml += `    <FaWiersz>\n`;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    xml += `      <FaWierszTyp>\n`;
    xml += `        <NrWierszaFa>${i + 1}</NrWierszaFa>\n`;
    xml += `        <P_7>${esc(item.name)}</P_7>\n`;
    xml += `        <P_8A>szt</P_8A>\n`;
    xml += `        <P_8B>${fmtDec(item.qty)}</P_8B>\n`;
    xml += `        <P_9A>${fmtDec(item.unitPrice)}</P_9A>\n`;
    xml += `        <P_11>${fmtDec(item.netPrice)}</P_11>\n`;
    xml += `        <P_12>${fmtDec(item.vatRate)}</P_12>\n`;
    xml += `      </FaWierszTyp>\n`;
  }
  xml += `    </FaWiersz>\n`;

  // Totals
  xml += `    <P_13_1>${fmtDec(Number(invoice.netTotal))}</P_13_1>\n`;
  xml += `    <P_14_1>${fmtDec(Number(invoice.vatTotal))}</P_14_1>\n`;
  xml += `    <P_15>${fmtDec(Number(invoice.grossTotal))}</P_15>\n`;

  xml += `  </Fa>\n`;
  xml += `</Faktura>\n`;

  return xml;
}

/**
 * Send invoice to KSeF API.
 * In DEMO mode: simulates success.
 * In LIVE mode: sends XML to KSeF API, handles auth, returns reference number.
 */
export async function sendInvoiceToKsef(invoiceId: string): Promise<KsefSendResult> {
  const config = await getKsefConfig();
  if (!config.enabled || !config.autoSend) {
    return { sent: false, status: "PENDING" };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) {
    return { sent: false, status: "PENDING", errorMessage: "Faktura nie istnieje" };
  }

  // DEMO mode: simulate success
  if (config.mode === "test" && !config.token) {
    const refNumber = `KSeF-DEMO-${Date.now()}-${invoice.invoiceNumber.replace(/\//g, "-")}`;
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ksefStatus: "ACCEPTED",
        ksefRefNumber: refNumber,
        ksefErrorMessage: null,
      },
    });
    return { sent: true, status: "ACCEPTED", refNumber };
  }

  // LIVE mode: send to KSeF API
  try {
    const baseUrl = KSEF_API_URLS[config.mode];
    const invoiceXml = buildInvoiceXml(
      {
        ...invoice,
        netTotal: Number(invoice.netTotal),
        vatTotal: Number(invoice.vatTotal),
        grossTotal: Number(invoice.grossTotal),
      },
      {
        nip: config.nip ?? "",
        subjectName: config.subjectName ?? "",
        subjectAddress: config.subjectAddress ?? "",
      }
    );

    // Step 1: Initiate session (if not already active)
    const sessionResponse = await fetch(`${baseUrl}/online/Session/InitSigned`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        Accept: "application/json",
      },
      body: config.token ?? "",
    });

    if (!sessionResponse.ok) {
      const errText = await sessionResponse.text().catch(() => "");
      // Queue for offline sending
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          ksefStatus: "OFFLINE_QUEUED",
          ksefErrorMessage: `Błąd sesji KSeF: ${sessionResponse.status} ${errText.slice(0, 200)}`,
        },
      });
      return {
        sent: false,
        status: "OFFLINE_QUEUED",
        errorMessage: `Błąd sesji KSeF (${sessionResponse.status})`,
      };
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData?.sessionToken?.token;

    if (!sessionToken) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          ksefStatus: "OFFLINE_QUEUED",
          ksefErrorMessage: "Brak tokenu sesji KSeF",
        },
      });
      return { sent: false, status: "OFFLINE_QUEUED", errorMessage: "Brak tokenu sesji" };
    }

    // Step 2: Send invoice
    const sendResponse = await fetch(`${baseUrl}/online/Invoice/Send`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
        Accept: "application/json",
        SessionToken: sessionToken,
      },
      body: invoiceXml,
    });

    if (!sendResponse.ok) {
      const errText = await sendResponse.text().catch(() => "");
      const errMsg = `Błąd wysyłki: ${sendResponse.status} ${errText.slice(0, 200)}`;
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          ksefStatus: "REJECTED",
          ksefErrorMessage: errMsg,
        },
      });
      Sentry.captureMessage("Invoice.ksefStatus REJECTED — błąd wysyłki KSeF", {
        level: "error",
        tags: { invoiceId },
        extra: { status: sendResponse.status, error: errMsg },
      });
      return {
        sent: true,
        status: "REJECTED",
        errorMessage: `Błąd wysyłki (${sendResponse.status})`,
      };
    }

    const sendData = await sendResponse.json();
    const refNumber = sendData?.elementReferenceNumber ?? null;

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ksefStatus: "SENT",
        ksefRefNumber: refNumber,
        ksefErrorMessage: null,
      },
    });

    // Step 3: Terminate session
    await fetch(`${baseUrl}/online/Session/Terminate`, {
      method: "GET",
      headers: { SessionToken: sessionToken },
    }).catch(() => {});

    return { sent: true, status: "SENT", refNumber };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Nieznany błąd";
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        ksefStatus: "OFFLINE_QUEUED",
        ksefErrorMessage: errMsg,
      },
    });
    return { sent: false, status: "OFFLINE_QUEUED", errorMessage: errMsg };
  }
}

/**
 * Poll KSeF for invoice status (check if SENT -> ACCEPTED).
 */
export async function pollKsefStatus(invoiceId: string): Promise<KsefStatusResult> {
  const config = await getKsefConfig();
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!invoice || !invoice.ksefRefNumber) {
    return { status: "PENDING", errorMessage: "Brak numeru referencyjnego" };
  }

  // DEMO mode
  if (config.mode === "test" && !config.token) {
    return { status: "ACCEPTED", refNumber: invoice.ksefRefNumber };
  }

  try {
    const baseUrl = KSEF_API_URLS[config.mode];
    const response = await fetch(
      `${baseUrl}/common/Invoice/KSeF/${invoice.ksefRefNumber}`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      return { status: "SENT", errorMessage: `Błąd sprawdzania statusu (${response.status})` };
    }

    const data = await response.json();
    const ksefStatus = data?.invoiceStatus;

    if (ksefStatus === "200") {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { ksefStatus: "ACCEPTED" },
      });
      return {
        status: "ACCEPTED",
        refNumber: invoice.ksefRefNumber,
        upoUrl: data?.upo?.url ?? null,
      };
    }

    if (ksefStatus === "400" || ksefStatus === "500") {
      const errMsg = data?.message ?? "Odrzucona przez KSeF";
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          ksefStatus: "REJECTED",
          ksefErrorMessage: errMsg,
        },
      });
      Sentry.captureMessage("Invoice.ksefStatus REJECTED — faktura odrzucona przez KSeF", {
        level: "error",
        tags: { invoiceId },
        extra: { ksefStatus, errorMessage: errMsg },
      });
      return {
        status: "REJECTED",
        refNumber: invoice.ksefRefNumber,
        errorMessage: errMsg,
      };
    }

    return { status: "SENT", refNumber: invoice.ksefRefNumber };
  } catch (e) {
    return {
      status: "SENT",
      refNumber: invoice.ksefRefNumber,
      errorMessage: e instanceof Error ? e.message : "Błąd połączenia",
    };
  }
}

/**
 * Retry sending for all OFFLINE_QUEUED invoices.
 */
export async function retryOfflineQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const queued = await prisma.invoice.findMany({
    where: { ksefStatus: "OFFLINE_QUEUED" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  let sent = 0;
  let failed = 0;

  for (const invoice of queued) {
    const result = await sendInvoiceToKsef(invoice.id);
    if (result.sent && result.status !== "OFFLINE_QUEUED") {
      sent++;
    } else {
      failed++;
    }
    // Small delay between retries
    await new Promise((r) => setTimeout(r, 1000));
  }

  return { processed: queued.length, sent, failed };
}

/**
 * Retry sending a single invoice with exponential backoff.
 */
export async function retrySendInvoiceToKsef(
  invoiceId: string,
  maxAttempts: number = MAX_RETRY_ATTEMPTS
): Promise<KsefSendResult> {
  let lastResult: KsefSendResult = { sent: false, status: "PENDING" };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await sendInvoiceToKsef(invoiceId);

    if (lastResult.sent && lastResult.status !== "OFFLINE_QUEUED") {
      await auditLog(null, "KSEF_RETRY_SUCCESS", "Invoice", invoiceId, undefined, {
        attempt,
        status: lastResult.status,
        refNumber: lastResult.refNumber,
      });
      return lastResult;
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }

  await auditLog(null, "KSEF_RETRY_FAILED", "Invoice", invoiceId, undefined, {
    attempts: maxAttempts,
    lastStatus: lastResult.status,
    lastError: lastResult.errorMessage,
  });

  return lastResult;
}
