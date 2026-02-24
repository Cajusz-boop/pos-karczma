export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { sendToPrinter } from "@/lib/printer/print-service";
import { ESCPOS, createPrintJob, addText, addCommand, finalize } from "@/lib/printer/escpos";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/printers/[id]/print - send print job to printer
 */
// Required for output: 'export' (Capacitor build) – API not used in static bundle
export async function generateStaticParams() {
  return [ {"id":"_"} ];
}


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: printerId } = await params;
    const body = await request.json();
    const { type, orderId, orderNumber, text, testMode } = body;

    let content: Buffer;

    if (testMode || type === "test") {
      const job = createPrintJob();
      addCommand(job, ESCPOS.ALIGN_CENTER);
      addCommand(job, ESCPOS.DOUBLE_SIZE_ON);
      addText(job, "TEST WYDRUKU");
      addCommand(job, ESCPOS.NORMAL_SIZE);
      addText(job, "=".repeat(42));
      addText(job, new Date().toLocaleString("pl-PL"));
      addText(job, "");
      addText(job, "Drukarka działa poprawnie!");
      addText(job, "");
      addText(job, "ąćęłńóśźżĄĆĘŁŃÓŚŹŻ");
      content = finalize(job, true, false);
    } else if (text) {
      const job = createPrintJob();
      for (const line of text.split("\n")) {
        addText(job, line);
      }
      content = finalize(job, true, false);
    } else {
      return NextResponse.json({ error: "Brak treści do wydruku" }, { status: 400 });
    }

    const result = await sendToPrinter({
      printerId,
      orderId,
      orderNumber,
      printType: testMode ? "TEST" : "KITCHEN_ORDER",
      content,
      userId: request.headers.get("x-user-id") ?? undefined,
    });

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "PRINT_JOB_SENT", "Printer", printerId, undefined, {
      type: testMode ? "test" : type,
      success: result.success,
      logId: result.logId,
    });

    if (result.success) {
      return NextResponse.json({
        message: "Wydruk wysłany",
        logId: result.logId,
      });
    } else {
      return NextResponse.json({
        error: result.error ?? "Błąd wydruku",
        logId: result.logId,
      }, { status: 500 });
    }
  } catch (e) {
    console.error("[PrinterPrint POST]", e);
    return NextResponse.json({ error: "Błąd wysyłania wydruku" }, { status: 500 });
  }
}
