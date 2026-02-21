/**
 * Typy dla modułu fiskalnego (Posnet / paragony).
 */

export interface ReceiptItemPayload {
  /** Nazwa pozycji (max 40 znaków dla Posnet) */
  name: string;
  quantity: number;
  unitPrice: number;
  /** Symbol stawki VAT: A, B, C, D, E */
  vatSymbol: string;
}

export interface ReceiptPaymentPayload {
  method: string;
  amount: number;
}

export interface ReceiptPayload {
  orderNumber: number;
  items: ReceiptItemPayload[];
  payments: ReceiptPaymentPayload[];
  discountAmount?: number;
  /** NIP nabywcy na paragonie (opcjonalnie) */
  buyerNip?: string;
}

export interface FiscalStatus {
  ok: boolean;
  connected: boolean;
  message?: string;
  /** Ostatni numer fiskalny (jeśli dostępny) */
  lastFiscalNumber?: string;
  /** Tryb pracy (DEMO lub LIVE) */
  mode?: "DEMO" | "LIVE";
}

export interface PrintReceiptResult {
  success: boolean;
  fiscalNumber?: string;
  error?: string;
}

export interface DailyReportResult {
  success: boolean;
  error?: string;
}

/** Konfiguracja drukarki fiskalnej */
export interface FiscalPrinterConfig {
  /** Tryb: DEMO (symulacja) lub LIVE (prawdziwa drukarka) */
  mode: "DEMO" | "LIVE";
  /** Typ połączenia */
  connectionType: "USB" | "COM" | "TCP";
  /** Adres IP (TCP) lub ścieżka portu (COM) */
  address?: string;
  /** Port TCP (domyślnie 9100 dla Posnet) */
  port?: number;
  /** Model drukarki */
  model?: string;
  /** Prędkość portu COM (baud rate) */
  baudRate?: number;
}
