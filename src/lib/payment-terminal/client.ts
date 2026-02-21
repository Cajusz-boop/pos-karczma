import { prisma } from "@/lib/prisma";
import type { TerminalConfig, PaymentIntent, TerminalStatus, TerminalProvider } from "./types";

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
    return {
      connected: !!config.merchantId,
      provider: "POLCARD",
      terminalId: config.terminalId,
      message: config.merchantId ? "PolCard Go skonfigurowany" : "Brak konfiguracji merchantId",
    };
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

async function createPolcardPaymentIntent(
  config: TerminalConfig,
  amount: number,
  orderId: string,
  _description?: string
): Promise<PaymentIntent> {
  // PolCard Go SoftPOS integration placeholder
  // Real implementation would use PolCard Go SDK/API
  const intentId = `polcard-${Date.now()}-${orderId.slice(0, 8)}`;
  return {
    id: intentId,
    amount,
    currency: "PLN",
    status: "PENDING",
  };
}

async function confirmPolcardPayment(
  _config: TerminalConfig,
  intentId: string
): Promise<PaymentIntent> {
  // PolCard Go confirmation placeholder
  return {
    id: intentId,
    amount: 0,
    currency: "PLN",
    status: "SUCCEEDED",
    transactionRef: `PC-${intentId}`,
  };
}
