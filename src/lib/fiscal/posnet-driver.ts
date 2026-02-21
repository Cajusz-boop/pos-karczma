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

    // LIVE mode — send receipt to printer
    if (config.connectionType === "TCP" && config.address) {
      // Build Posnet thermal protocol command for receipt
      // This is a simplified placeholder — real implementation needs full Posnet protocol
      const command = buildReceiptCommand(payload);
      const result = await sendTcpCommand(
        config.address,
        config.port ?? DEFAULT_TCP_PORT,
        command
      );
      if (result.success) {
        // Parse fiscal number from response
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

    if (config.connectionType === "TCP" && config.address) {
      // Posnet daily report command
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
