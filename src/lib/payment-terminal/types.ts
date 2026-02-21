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
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  transactionRef?: string;
  errorMessage?: string;
}

export interface TerminalStatus {
  connected: boolean;
  provider: TerminalProvider;
  terminalId?: string;
  batteryLevel?: number;
  message?: string;
}
