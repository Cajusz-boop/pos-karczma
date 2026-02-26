import { prisma } from "@/lib/prisma";
import type { 
  TerminalConfig, 
  PaymentIntent, 
  TerminalStatus, 
  PolcardGoResponse,
  PolcardGoDeepLinkParams,
} from "./types";

const DEFAULT_CONFIG: TerminalConfig = {
  provider: "DEMO",
};

/**
 * Get terminal configuration from SystemConfig.
 */
async function getConfig(): Promise<TerminalConfig> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: "payment_terminal" },
    });
    if (config?.value && typeof config.value === "object") {
      return { ...DEFAULT_CONFIG, ...(config.value as object) } as TerminalConfig;
    }
  } catch (e) {
    console.error("[PaymentTerminal] Error reading config:", e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Create a payment intent on the terminal.
 * In DEMO mode: simulates a successful payment.
 * In STRIPE mode: creates a Stripe Terminal PaymentIntent.
 * In POLCARD mode: initiates a PolCard Go transaction.
 */
export async function createPaymentIntent(
  amount: number,
  orderId: string,
  description?: string
): Promise<PaymentIntent> {
  const config = await getConfig();

  if (config.provider === "DEMO") {
    return {
      id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount,
      currency: "PLN",
      status: "PENDING",
    };
  }

  if (config.provider === "STRIPE") {
    return createStripePaymentIntent(config, amount, orderId, description);
  }

  if (config.provider === "POLCARD") {
    return createPolcardPaymentIntent(config, amount, orderId, description);
  }

  return { id: "", amount, currency: "PLN", status: "FAILED", errorMessage: "Nieznany provider" };
}

/**
 * Confirm/capture a payment on the terminal.
 */
export async function confirmPayment(
  intentId: string
): Promise<PaymentIntent> {
  const config = await getConfig();

  if (config.provider === "DEMO") {
    return {
      id: intentId,
      amount: 0,
      currency: "PLN",
      status: "SUCCEEDED",
      transactionRef: `DEMO-${intentId}`,
    };
  }

  if (config.provider === "STRIPE") {
    return confirmStripePayment(config, intentId);
  }

  if (config.provider === "POLCARD") {
    return confirmPolcardPayment(config, intentId);
  }

  return { id: intentId, amount: 0, currency: "PLN", status: "FAILED", errorMessage: "Nieznany provider" };
}

/**
 * Cancel a pending payment.
 */
export async function cancelPayment(intentId: string): Promise<PaymentIntent> {
  const config = await getConfig();

  if (config.provider === "DEMO") {
    return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
  }

  if (config.provider === "STRIPE") {
    return cancelStripePayment(config, intentId);
  }

  if (config.provider === "POLCARD") {
    return cancelPolcardPayment(intentId);
  }

  return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
}

/**
 * Get terminal status.
 */
export async function getTerminalStatus(): Promise<TerminalStatus> {
  const config = await getConfig();

  if (config.provider === "DEMO") {
    return {
      connected: true,
      provider: "DEMO",
      message: "Tryb DEMO — terminal symulowany",
    };
  }

  if (config.provider === "STRIPE") {
    return getStripeTerminalStatus(config);
  }

  if (config.provider === "POLCARD") {
    return getPolcardTerminalStatus(config);
  }

  return { connected: false, provider: config.provider, message: "Nieznany provider" };
}

// ─── Stripe Terminal ────────────────────────────────────────────────

async function createStripePaymentIntent(
  config: TerminalConfig,
  amount: number,
  orderId: string,
  description?: string
): Promise<PaymentIntent> {
  try {
    const response = await fetch("https://api.stripe.com/v1/terminal/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)),
        currency: "pln",
        "payment_method_types[]": "card_present",
        description: description ?? `Zamówienie POS`,
        "metadata[orderId]": orderId,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        id: "",
        amount,
        currency: "PLN",
        status: "FAILED",
        errorMessage: data.error?.message ?? "Błąd Stripe",
      };
    }

    return {
      id: data.id,
      amount,
      currency: "PLN",
      status: "PENDING",
    };
  } catch (e) {
    return {
      id: "",
      amount,
      currency: "PLN",
      status: "FAILED",
      errorMessage: e instanceof Error ? e.message : "Błąd połączenia ze Stripe",
    };
  }
}

async function confirmStripePayment(
  config: TerminalConfig,
  intentId: string
): Promise<PaymentIntent> {
  try {
    const response = await fetch(
      `https://api.stripe.com/v1/terminal/payment_intents/${intentId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = await response.json();
    return {
      id: intentId,
      amount: (data.amount ?? 0) / 100,
      currency: "PLN",
      status: data.status === "succeeded" ? "SUCCEEDED" : "FAILED",
      transactionRef: data.charges?.data?.[0]?.id,
      errorMessage: data.status !== "succeeded" ? (data.error?.message ?? "Nie udało się") : undefined,
    };
  } catch (e) {
    return {
      id: intentId,
      amount: 0,
      currency: "PLN",
      status: "FAILED",
      errorMessage: e instanceof Error ? e.message : "Błąd",
    };
  }
}

async function cancelStripePayment(
  config: TerminalConfig,
  intentId: string
): Promise<PaymentIntent> {
  try {
    await fetch(
      `https://api.stripe.com/v1/payment_intents/${intentId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
  } catch {
    return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
  }
}

async function getStripeTerminalStatus(config: TerminalConfig): Promise<TerminalStatus> {
  try {
    const response = await fetch("https://api.stripe.com/v1/terminal/readers", {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    const data = await response.json();
    const readers = data.data ?? [];
    const online = readers.filter((r: { status: string }) => r.status === "online");
    return {
      connected: online.length > 0,
      provider: "STRIPE",
      terminalId: online[0]?.id,
      message: `${online.length}/${readers.length} czytników online`,
    };
  } catch {
    return { connected: false, provider: "STRIPE", message: "Błąd połączenia ze Stripe" };
  }
}

// ─── PolCard Go ─────────────────────────────────────────────────────

const POLCARD_GO_PACKAGE = "com.fiserv.polcard";
const POLCARD_GO_DEEP_LINK_SCHEME = "polcardgo";

async function createPolcardPaymentIntent(
  config: TerminalConfig,
  amount: number,
  orderId: string,
  description?: string
): Promise<PaymentIntent> {
  const intentId = `polcard-${Date.now()}-${orderId.slice(0, 8)}`;
  
  try {
    await prisma.pendingPayment.create({
      data: {
        id: intentId,
        orderId,
        amount,
        currency: "PLN",
        provider: "POLCARD",
        status: "PENDING",
        metadata: {
          description,
          merchantId: config.polcardConfig?.merchantId ?? config.merchantId,
          terminalId: config.polcardConfig?.terminalId ?? config.terminalId,
          createdAt: new Date().toISOString(),
        },
      },
    });
  } catch (e) {
    console.error("[PolCard Go] Error saving pending payment:", e);
  }

  return {
    id: intentId,
    amount,
    currency: "PLN",
    status: "PENDING",
  };
}

async function confirmPolcardPayment(
  config: TerminalConfig,
  intentId: string
): Promise<PaymentIntent> {
  try {
    const pending = await prisma.pendingPayment.findUnique({
      where: { id: intentId },
    });

    if (!pending) {
      return {
        id: intentId,
        amount: 0,
        currency: "PLN",
        status: "FAILED",
        errorMessage: "Płatność nie została znaleziona",
      };
    }

    if (pending.status === "COMPLETED") {
      const response = pending.response as PolcardGoResponse | null;
      return {
        id: intentId,
        amount: Number(pending.amount),
        currency: "PLN",
        status: "SUCCEEDED",
        transactionRef: response?.transactionId ?? `PC-${intentId}`,
        polcardResponse: response ?? undefined,
      };
    }

    if (pending.status === "FAILED" || pending.status === "CANCELLED") {
      const response = pending.response as PolcardGoResponse | null;
      return {
        id: intentId,
        amount: Number(pending.amount),
        currency: "PLN",
        status: pending.status === "FAILED" ? "FAILED" : "CANCELLED",
        errorMessage: response?.errorMessage ?? "Płatność nie powiodła się",
      };
    }

    return {
      id: intentId,
      amount: Number(pending.amount),
      currency: "PLN",
      status: "PROCESSING",
    };
  } catch (e) {
    console.error("[PolCard Go] Error confirming payment:", e);
    return {
      id: intentId,
      amount: 0,
      currency: "PLN",
      status: "FAILED",
      errorMessage: "Błąd sprawdzania statusu płatności",
    };
  }
}

async function cancelPolcardPayment(
  intentId: string
): Promise<PaymentIntent> {
  try {
    await prisma.pendingPayment.update({
      where: { id: intentId },
      data: { status: "CANCELLED" },
    });
  } catch (e) {
    console.error("[PolCard Go] Error cancelling payment:", e);
  }

  return { id: intentId, amount: 0, currency: "PLN", status: "CANCELLED" };
}

async function getPolcardTerminalStatus(config: TerminalConfig): Promise<TerminalStatus> {
  const merchantId = config.polcardConfig?.merchantId ?? config.merchantId;
  const terminalId = config.polcardConfig?.terminalId ?? config.terminalId;
  
  return {
    connected: !!merchantId && !!terminalId,
    provider: "POLCARD",
    terminalId,
    message: merchantId && terminalId 
      ? `PolCard Go gotowy (Terminal: ${terminalId})`
      : "Brak konfiguracji PolCard Go — uzupełnij merchantId i terminalId",
  };
}

/**
 * Generate a deep link URL to invoke PolCard Go app for payment.
 * Used on Android devices with PolCard Go installed.
 */
export function generatePolcardGoDeepLink(params: PolcardGoDeepLinkParams): string {
  const { action, amount, currency, orderId, description, callback } = params;
  
  const amountInGrosze = Math.round(amount * 100);
  
  const queryParams = new URLSearchParams({
    action,
    amount: String(amountInGrosze),
    currency,
    orderId,
    callback: encodeURIComponent(callback),
  });
  
  if (description) {
    queryParams.set("description", description);
  }
  
  return `${POLCARD_GO_DEEP_LINK_SCHEME}://payment?${queryParams.toString()}`;
}

/**
 * Generate an Android Intent URL for PolCard Go.
 * Fallback when deep link scheme doesn't work.
 */
export function generatePolcardGoIntentUrl(params: PolcardGoDeepLinkParams): string {
  return `intent://payment?${new URLSearchParams({
    amount: String(Math.round(params.amount * 100)),
    currency: params.currency,
    orderId: params.orderId,
    callback: params.callback,
  }).toString()}#Intent;scheme=${POLCARD_GO_DEEP_LINK_SCHEME};package=${POLCARD_GO_PACKAGE};end`;
}

/**
 * Check if PolCard Go app is likely installed (Android only).
 * Returns true on Android, false on iOS/desktop.
 */
export function isPolcardGoAvailable(): boolean {
  if (typeof window === "undefined") return false;
  
  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = ua.includes("android");
  
  return isAndroid;
}

/**
 * Process callback response from PolCard Go.
 * Called by the callback API endpoint.
 */
export async function processPolcardGoCallback(
  intentId: string,
  response: PolcardGoResponse
): Promise<PaymentIntent> {
  try {
    const status = response.success ? "COMPLETED" : "FAILED";
    
    await prisma.pendingPayment.update({
      where: { id: intentId },
      data: {
        status,
        response: response as object,
        completedAt: new Date(),
      },
    });

    return {
      id: intentId,
      amount: response.amount ?? 0,
      currency: response.currency ?? "PLN",
      status: response.success ? "SUCCEEDED" : "FAILED",
      transactionRef: response.transactionId,
      errorMessage: response.errorMessage,
      polcardResponse: response,
    };
  } catch (e) {
    console.error("[PolCard Go] Error processing callback:", e);
    return {
      id: intentId,
      amount: 0,
      currency: "PLN",
      status: "FAILED",
      errorMessage: "Błąd przetwarzania odpowiedzi PolCard Go",
    };
  }
}

/**
 * Poll for payment status (for use when waiting for PolCard Go callback).
 */
export async function pollPolcardPaymentStatus(
  intentId: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<PaymentIntent> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await confirmPolcardPayment({} as TerminalConfig, intentId);
    
    if (result.status === "SUCCEEDED" || result.status === "FAILED" || result.status === "CANCELLED") {
      return result;
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  return {
    id: intentId,
    amount: 0,
    currency: "PLN",
    status: "FAILED",
    errorMessage: "Przekroczono czas oczekiwania na płatność",
  };
}
