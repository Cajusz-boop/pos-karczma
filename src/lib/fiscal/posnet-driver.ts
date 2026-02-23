/**
 * Driver Posnet — warstwa abstrakcji nad drukarką fiskalną Posnet (protokół thermal).
 *
 * Obsługuje dwa tryby:
 * - DEMO: symulacja bez fizycznej drukarki (domyślny)
 * - LIVE: komunikacja z prawdziwą drukarką Posnet (TCP/COM/USB)
 *
 * Konfiguracja w SystemConfig (klucz: "fiscal_printer"):
 * { mode: "DEMO"|"LIVE", connectionType: "TCP"|"COM"|"USB", address: "192.168.1.100", port: 9100 }
 */

import type {
  ReceiptPayload,
  FiscalStatus,
  PrintReceiptResult,
  DailyReportResult,
  FiscalPrinterConfig,
} from "./types";

const RECEIPT_NAME_MAX_LEN = 40;
const DEFAULT_TCP_PORT = 9100;
const COMMAND_TIMEOUT_MS = 10000;

function truncateName(name: string): string {
  if (name.length <= RECEIPT_NAME_MAX_LEN) return name;
  return name.slice(0, RECEIPT_NAME_MAX_LEN - 2) + "..";
}

/**
 * Formatuje pozycję paragonu (nazwa max 40 znaków, qty, cena, stawka VAT).
 */
export function formatReceiptLines(payload: ReceiptPayload): string[] {
  const lines: string[] = [];
  for (const item of payload.items) {
    const name = truncateName(item.name);
    lines.push(`${name} ${item.quantity}×${item.unitPrice.toFixed(2)} [${item.vatSymbol}]`);
  }
  if (payload.discountAmount && payload.discountAmount > 0) {
    lines.push(`Rabat: -${payload.discountAmount.toFixed(2)} zł`);
  }
  for (const p of payload.payments) {
    lines.push(`Płatność ${p.method}: ${p.amount.toFixed(2)} zł`);
  }
  if (payload.buyerNip?.trim()) {
    lines.push(`NIP: ${payload.buyerNip.trim()}`);
  }
  return lines;
}

/**
 * Generuje numer fiskalny w trybie DEMO (bez drukarki).
 */
function generateDemoFiscalNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const rnd = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `FP-${date}-${time}-${rnd}`;
}

/**
 * Pobiera konfigurację drukarki z SystemConfig.
 * Domyślnie: tryb DEMO.
 */
async function getConfig(): Promise<FiscalPrinterConfig> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const config = await prisma.systemConfig.findUnique({
      where: { key: "fiscal_printer" },
    });
    if (config?.value && typeof config.value === "object") {
      return config.value as unknown as FiscalPrinterConfig;
    }
  } catch (e) {
    console.error("[Posnet] Error reading config:", e);
  }
  return { mode: "DEMO", connectionType: "TCP" };
}

/**
 * Wysyła komendę do drukarki Posnet przez TCP.
 * W trybie LIVE: nawiązuje połączenie TCP, wysyła dane, czeka na odpowiedź.
 * Placeholder — docelowo implementacja pełnego protokołu Posnet thermal.
 */
async function sendTcpCommand(
  address: string,
  port: number,
  command: string
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const net = await import("net");
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let responseData = "";
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve({ success: false, error: "Timeout połączenia z drukarką" });
      }, COMMAND_TIMEOUT_MS);

      socket.connect(port, address, () => {
        socket.write(command);
      });

      socket.on("data", (data) => {
        responseData += data.toString();
      });

      socket.on("end", () => {
        clearTimeout(timeout);
        resolve({ success: true, response: responseData });
      });

      socket.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: `Błąd połączenia: ${err.message}` });
      });
    });
  } catch (e) {
    return {
      success: false,
      error: `Błąd TCP: ${e instanceof Error ? e.message : "Unknown"}`,
    };
  }
}

/**
 * Driver Posnet — automatycznie wybiera tryb DEMO lub LIVE na podstawie konfiguracji.
 */
export const posnetDriver = {
  async getStatus(): Promise<FiscalStatus> {
    const config = await getConfig();

    if (config.mode === "DEMO") {
      return {
        ok: true,
        connected: true,
        message: "Tryb DEMO — drukarka symulowana",
        mode: "DEMO",
      };
    }

    // LIVE mode — test connection
    // HTTP JSONPOS (Posnet Trio WiFi)
    if (config.connectionType === "HTTP" && config.address) {
      return getStatusJsonPos(config.address, config.port ?? 80);
    }

    // TCP mode
    if (config.connectionType === "TCP" && config.address) {
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        "\x1B#s" // Posnet status command (ENQ)
      );
      return {
        ok: result.success,
        connected: result.success,
        message: result.success
          ? `Połączono z ${config.address}:${config.port ?? DEFAULT_TCP_PORT} (${config.model ?? "Posnet"})`
          : result.error ?? "Brak połączenia",
        mode: "LIVE",
      };
    }

    // COM/USB — placeholder
    return {
      ok: false,
      connected: false,
      message: `Tryb ${config.connectionType} — wymaga konfiguracji sterownika`,
      mode: "LIVE",
    };
  },

  async printReceipt(payload: ReceiptPayload): Promise<PrintReceiptResult> {
    const config = await getConfig();
    const lines = formatReceiptLines(payload);

    if (config.mode === "DEMO") {
      console.log("[Posnet DEMO] Paragon #" + payload.orderNumber, lines);
      return { success: true, fiscalNumber: generateDemoFiscalNumber() };
    }

    // HTTP JSONPOS (Posnet Trio WiFi)
    if (config.connectionType === "HTTP" && config.address) {
      return printReceiptJsonPos(config.address, config.port ?? 80, payload);
    }

    // LIVE mode — send receipt to printer via TCP
    if (config.connectionType === "TCP" && config.address) {
      const command = buildReceiptCommand(payload);
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        command
      );
      if (result.success) {
        const fiscalNumber = parseFiscalNumber(result.response ?? "") || generateDemoFiscalNumber();
        return { success: true, fiscalNumber };
      }
      return { success: false, error: result.error };
    }

    return { success: false, error: "Drukarka nie skonfigurowana" };
  },

  async printDailyReport(): Promise<DailyReportResult> {
    const config = await getConfig();

    if (config.mode === "DEMO") {
      console.log("[Posnet DEMO] Raport dobowy");
      return { success: true };
    }

    // HTTP JSONPOS
    if (config.connectionType === "HTTP" && config.address) {
      return printDailyReportJsonPos(config.address, config.port ?? 80);
    }

    if (config.connectionType === "TCP" && config.address) {
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        "\x1B#r" // Posnet daily report command
      );
      return {
        success: result.success,
        error: result.success ? undefined : result.error,
      };
    }

    return { success: false, error: "Drukarka nie skonfigurowana" };
  },

  async printPeriodReport(dateFrom: string, dateTo: string): Promise<DailyReportResult> {
    const config = await getConfig();

    if (config.mode === "DEMO") {
      console.log(`[Posnet DEMO] Raport okresowy ${dateFrom} - ${dateTo}`);
      return { success: true };
    }

    // HTTP JSONPOS
    if (config.connectionType === "HTTP" && config.address) {
      const result = await sendJsonPosCommand(
        config.address,
        config.port ?? 80,
        "periodReport",
        { dateFrom, dateTo }
      );
      return {
        success: result.success,
        error: result.success ? undefined : result.error,
      };
    }

    if (config.connectionType === "TCP" && config.address) {
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        `\x1B#p${dateFrom}${dateTo}` // Posnet period report command
      );
      return {
        success: result.success,
        error: result.success ? undefined : result.error,
      };
    }

    return { success: false, error: "Drukarka nie skonfigurowana" };
  },
};

/**
 * Build Posnet thermal protocol receipt command.
 * Placeholder — real implementation needs full Posnet protocol specification.
 */
function buildReceiptCommand(payload: ReceiptPayload): string {
  const lines = formatReceiptLines(payload);
  // Simplified: send formatted text to printer
  return lines.join("\n") + "\n\x1D\x56\x00"; // Cut paper command
}

/**
 * Parse fiscal number from Posnet printer response.
 */
function parseFiscalNumber(response: string): string | null {
  // Look for fiscal number pattern in response
  const match = response.match(/FP[-/]\d+/);
  return match ? match[0] : null;
}

// ─── JSONPOS HTTP API (Posnet Trio WiFi) ───────────────────

async function sendJsonPosCommand(
  address: string,
  port: number,
  method: string,
  params: Record<string, unknown> = {}
): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
  try {
    const response = await fetch(`http://${address}:${port}/jsonpos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        id: Date.now(),
        params,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (data.error) {
      return { success: false, error: data.error.message || "Błąd drukarki" };
    }
    return { success: true, result: data.result };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Błąd komunikacji" };
  }
}

/**
 * Print receipt via JSONPOS HTTP API (Posnet Trio WiFi).
 */
async function printReceiptJsonPos(
  address: string,
  port: number,
  payload: ReceiptPayload
): Promise<PrintReceiptResult> {
  const result = await sendJsonPosCommand(
    address,
    port,
    "receipt",
    {
      lines: payload.items.map((item) => ({
        type: "sale",
        name: truncateName(item.name),
        quantity: item.quantity,
        price: Math.round(item.unitPrice * 100),
        taxRate: item.vatSymbol,
        unit: "szt",
      })),
      payments: payload.payments.map((p) => ({
        type: p.method.toLowerCase(),
        value: Math.round(p.amount * 100),
      })),
      ...(payload.buyerNip && { buyerNip: payload.buyerNip }),
    }
  );

  if (result.success) {
    return {
      success: true,
      fiscalNumber: (typeof result.result?.receiptNumber === "string" ? result.result.receiptNumber : null) ?? generateDemoFiscalNumber(),
    };
  }
  return { success: false, error: result.error };
}

/**
 * Get printer status via JSONPOS HTTP API.
 */
async function getStatusJsonPos(
  address: string,
  port: number
): Promise<FiscalStatus> {
  const result = await sendJsonPosCommand(address, port, "getStatus");
  return {
    ok: result.success,
    connected: result.success,
    message: result.success
      ? `Połączono z ${address}:${port} (JSONPOS HTTP)`
      : result.error ?? "Brak połączenia",
    mode: "LIVE",
  };
}

/**
 * Print daily report via JSONPOS HTTP API.
 */
async function printDailyReportJsonPos(
  address: string,
  port: number
): Promise<DailyReportResult> {
  const result = await sendJsonPosCommand(address, port, "dailyReport");
  return {
    success: result.success,
    error: result.success ? undefined : result.error,
  };
}
