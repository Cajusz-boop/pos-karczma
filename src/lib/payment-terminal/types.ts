/**
 * Payment terminal integration types.
 * Supports Stripe Terminal and PolCard Go (SoftPOS).
 */

export type TerminalProvider = "STRIPE" | "POLCARD" | "DEMO";

export interface TerminalConfig {
  provider: TerminalProvider;
  apiKey?: string;
  locationId?: string;
  merchantId?: string;
  terminalId?: string;
  polcardConfig?: PolcardGoConfig;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  transactionRef?: string;
  errorMessage?: string;
  polcardResponse?: PolcardGoResponse;
}

export interface TerminalStatus {
  connected: boolean;
  provider: TerminalProvider;
  terminalId?: string;
  batteryLevel?: number;
  message?: string;
}

// ─── PolCard Go Types ────────────────────────────────────────────────

export interface PolcardGoConfig {
  merchantId: string;
  terminalId: string;
  callbackUrl: string;
  appPackage?: string;
  deepLinkScheme?: string;
}

export interface PolcardGoPaymentRequest {
  amount: number;
  currency: "PLN";
  orderId: string;
  description?: string;
  callbackUrl: string;
  merchantReference?: string;
}

export interface PolcardGoResponse {
  success: boolean;
  transactionId?: string;
  authorizationCode?: string;
  cardMasked?: string;
  cardType?: "VISA" | "MASTERCARD" | "OTHER";
  amount?: number;
  currency?: string;
  timestamp?: string;
  errorCode?: string;
  errorMessage?: string;
  receiptData?: PolcardGoReceiptData;
}

export interface PolcardGoReceiptData {
  merchantName?: string;
  merchantAddress?: string;
  terminalId?: string;
  transactionDate?: string;
  transactionTime?: string;
  cardNumber?: string;
  authCode?: string;
  rrn?: string;
  aid?: string;
  tvr?: string;
}

export interface PolcardGoDeepLinkParams {
  action: "payment" | "refund" | "status";
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  callback: string;
}

export type PolcardGoTransactionStatus = 
  | "INITIATED"
  | "WAITING_FOR_CARD" 
  | "PROCESSING"
  | "APPROVED"
  | "DECLINED"
  | "CANCELLED"
  | "ERROR"
  | "TIMEOUT";
