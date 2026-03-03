"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { InvoiceToggle } from "./InvoiceToggle";
import type { Locale } from "@/lib/i18n/translations";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type PayPayload = {
  items: Array<{ orderItemId: string; quantity: number }>;
  tipPercent?: number;
  tipAmount?: number;
  provider: "STRIPE";
  customerEmail?: string | null;
  wantInvoice?: boolean;
  invoiceNip?: string | null;
};

function InnerPaymentForm({
  qrId,
  items,
  tipPercent,
  tipAmount,
  onSuccess,
  onCancel,
  locale,
}: {
  qrId: string;
  items: Array<{ orderItemId: string; quantity: number }>;
  tipPercent: number;
  tipAmount: number;
  onSuccess: (confirmationUrl: string) => void;
  onCancel: () => void;
  locale: Locale;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wantInvoice, setWantInvoice] = useState(false);
  const [invoiceNip, setInvoiceNip] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const t = locale === "pl"
    ? { payButton: "Zapłać", cancel: "Anuluj", errorPay: "Błąd płatności" }
    : { payButton: "Pay", cancel: "Cancel", errorPay: "Payment error" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const payload: PayPayload = {
        items,
        provider: "STRIPE",
        tipPercent: tipAmount > 0 ? undefined : tipPercent,
        tipAmount: tipAmount > 0 ? tipAmount : undefined,
      };
      if (customerEmail) payload.customerEmail = customerEmail;
      if (wantInvoice && invoiceNip) {
        payload.wantInvoice = true;
        payload.invoiceNip = invoiceNip;
      }

      const res = await fetch(`/api/public/table/${qrId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409 && json.unavailableItems) {
          setError("Ktoś inny właśnie płaci za część pozycji. Odśwież rachunek.");
        } else {
          setError(json.error ?? t.errorPay);
        }
        setLoading(false);
        return;
      }

      const { clientSecret, confirmationUrl } = json;
      if (!clientSecret) {
        setError(t.errorPay);
        setLoading(false);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setError("Bramka płatności niedostępna");
        setLoading(false);
        return;
      }

      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: confirmationUrl,
          receipt_email: customerEmail || undefined,
        },
      });

      if (stripeError) {
        setError(stripeError.message ?? t.errorPay);
        setLoading(false);
        return;
      }

      onSuccess(confirmationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorPay);
      setLoading(false);
    }
  };

  if (!stripePromise) {
    return (
      <div className="p-4 bg-amber-50 rounded-xl text-amber-800">
        Bramka płatności nie jest skonfigurowana. Skontaktuj się z obsługą.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          E-mail (opcjonalnie)
        </label>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full min-h-[44px] px-4 rounded-xl border border-stone-300"
        />
      </div>

      <InvoiceToggle
        wantInvoice={wantInvoice}
        invoiceNip={invoiceNip}
        onWantInvoiceChange={setWantInvoice}
        onInvoiceNipChange={setInvoiceNip}
        locale={locale}
      />

      {error && (
        <div role="alert" className="p-3 bg-red-50 text-red-800 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-stone-200 font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
          aria-label={t.cancel}
        >
          {t.cancel}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-amber-700 text-white font-medium min-h-[44px] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label={t.payButton}
        >
          {loading ? "..." : t.payButton}
        </button>
      </div>
    </form>
  );
}

export function PaymentForm({
  qrId,
  items,
  tipPercent,
  tipAmount,
  onSuccess,
  onCancel,
  locale,
}: {
  qrId: string;
  items: Array<{ orderItemId: string; quantity: number }>;
  tipPercent: number;
  tipAmount: number;
  onSuccess: (url: string) => void;
  onCancel: () => void;
  locale: Locale;
}) {
  if (!stripePromise) {
    return (
      <div className="p-4 bg-amber-50 rounded-xl">
        Bramka płatności nie jest skonfigurowana.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <InnerPaymentForm
        qrId={qrId}
        items={items}
        tipPercent={tipPercent}
        tipAmount={tipAmount}
        onSuccess={onSuccess}
        onCancel={onCancel}
        locale={locale}
      />
    </Elements>
  );
}
