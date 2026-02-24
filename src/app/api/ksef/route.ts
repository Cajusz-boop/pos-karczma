export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKsefConfig, setKsefConfig } from "@/lib/ksef";
import { sendInvoiceToKsef } from "@/lib/ksef";

/** GET /api/ksef — konfiguracja KSeF (bez tokena w odpowiedzi) */
export async function GET() {
  try {
    const config = await getKsefConfig();
    return NextResponse.json({
      enabled: config.enabled,
      nip: config.nip,
      subjectName: config.subjectName,
      subjectAddress: config.subjectAddress,
      mode: config.mode,
      autoSend: config.autoSend,
      hasToken: !!config.token,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd odczytu konfiguracji KSeF" }, { status: 500 });
  }
}

/** PATCH /api/ksef — zapis konfiguracji KSeF */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      enabled,
      token,
      nip,
      subjectName,
      subjectAddress,
      mode,
      autoSend,
    } = body as {
      enabled?: boolean;
      token?: string;
      nip?: string;
      subjectName?: string;
      subjectAddress?: string;
      mode?: "test" | "prod";
      autoSend?: boolean;
    };
    await setKsefConfig({
      ...(enabled !== undefined && { enabled }),
      ...(token !== undefined && { token: token || null }),
      ...(nip !== undefined && { nip: nip || null }),
      ...(subjectName !== undefined && { subjectName: subjectName || null }),
      ...(subjectAddress !== undefined && { subjectAddress: subjectAddress || null }),
      ...(mode !== undefined && { mode: mode === "prod" ? "prod" : "test" }),
      ...(autoSend !== undefined && { autoSend }),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd zapisu konfiguracji KSeF" }, { status: 500 });
  }
}

/** POST /api/ksef — wysłanie faktury do KSeF (retry). Body: { invoiceId } */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { invoiceId } = body as { invoiceId?: string };
    if (!invoiceId) {
      return NextResponse.json({ error: "Brak invoiceId" }, { status: 400 });
    }
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      return NextResponse.json({ error: "Faktura nie istnieje" }, { status: 404 });
    }
    const result = await sendInvoiceToKsef(invoiceId);
    if (result.sent) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          ksefStatus: result.status,
          ksefRefNumber: result.refNumber ?? undefined,
          ksefErrorMessage: result.errorMessage ?? undefined,
        },
      });
    }
    return NextResponse.json({
      ok: result.sent,
      status: result.sent ? result.status : invoice.ksefStatus,
      refNumber: result.refNumber ?? invoice.ksefRefNumber,
      errorMessage: result.errorMessage ?? invoice.ksefErrorMessage,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd wysyłki do KSeF" }, { status: 500 });
  }
}
