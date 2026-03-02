export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { pollKsefStatus } from "@/lib/ksef";


/**
 * GET /api/ksef/status?invoiceId= "” poll KSeF for invoice status
 */
export async function GET(request: NextRequest) {
  try {
    const invoiceId = request.nextUrl.searchParams.get("invoiceId");
    if (!invoiceId) {
      return NextResponse.json({ error: "Wymagany parametr invoiceId" }, { status: 400 });
    }

    const result = await pollKsefStatus(invoiceId);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd sprawdzania statusu KSeF" }, { status: 500 });
  }
}
