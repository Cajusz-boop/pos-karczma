"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/lib/i18n/use-locale";
import { translations } from "@/lib/i18n/translations";
import { OfflineNotice } from "./OfflineNotice";
import { OrderSummary } from "./OrderSummary";
import { ReceiptEmpty } from "./ReceiptEmpty";
import { TipSelector } from "./TipSelector";
import { PaymentForm } from "./PaymentForm";
import { PaymentSuccess } from "./PaymentSuccess";
import { SplitBillModal } from "./SplitBillModal";

type ReceiptItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  fiscalSymbol: string;
  discountAmount: number;
  modifiers: string | null;
  note: string | null;
  paidQuantity: number;
  lockedQuantity: number;
  availableQuantity: number;
  lineTotal: number;
  status: string;
};

type ReceiptData = {
  orderId: string;
  orderNumber: number;
  tableName: string;
  tableNumber: number;
  status: string;
  onlinePaymentStatus: string;
  items: ReceiptItem[];
  totalGross: number;
  totalPaidOnline: number;
  totalLocked: number;
  totalRemaining: number;
  createdAt: string;
  locale: string;
};

type PaymentPhase = "view" | "split" | "pay" | "success";

export function ReceiptPage({ qrId }: { qrId: string }) {
  const locale = useLocale();
  const t = translations[locale];
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<PaymentPhase>("view");
  const [splitItems, setSplitItems] = useState<Array<{ orderItemId: string; quantity: number }>>([]);
  const [tipPercent, setTipPercent] = useState(10);
  const [tipAmount, setTipAmount] = useState(0);
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const fetchReceipt = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/table/${qrId}/receipt`, {
        headers: { Accept: "application/json" },
      });
      if (res.status === 204) {
        setData(null);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [qrId]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  useEffect(() => {
    const es = new EventSource(`/api/public/table/${qrId}/sse`);
    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        if (ev.type === "PAYMENT_CONFIRMED" || ev.type === "ORDER_UPDATED") {
          fetchReceipt();
        }
      } catch {
        // ignore
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [qrId, fetchReceipt]);

  if (loading) {
    return (
      <main className="min-h-dvh bg-stone-100 flex items-center justify-center p-4">
        <div className="animate-pulse text-stone-500" role="status" aria-live="polite">
          Ładowanie…
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-dvh bg-stone-100 flex flex-col p-4">
        <OfflineNotice />
        <ReceiptEmpty />
      </main>
    );
  }

  if (phase === "success") {
    return (
      <main className="min-h-dvh bg-stone-100 flex flex-col p-4">
        <PaymentSuccess
          confirmationUrl={confirmationUrl ?? `${baseUrl}/receipt/confirm/placeholder`}
          locale={locale}
        />
      </main>
    );
  }

  const itemsToPay = splitItems.length > 0
    ? splitItems
    : data.items
        .filter((i) => i.availableQuantity > 0)
        .map((i) => ({ orderItemId: i.id, quantity: i.availableQuantity }));

  const amountToPay = itemsToPay.reduce(
    (sum, it) => {
      const item = data.items.find((i) => i.id === it.orderItemId);
      if (!item) return sum;
      return sum + item.unitPrice * it.quantity;
    },
    0
  );

  return (
    <main className="min-h-dvh bg-stone-100 flex flex-col p-4 max-w-md mx-auto" aria-label={t.title}>
      <OfflineNotice />
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-stone-800">{t.title}</h1>
        <p className="text-sm text-stone-600">{data.tableName} — Zamówienie #{data.orderNumber}</p>
      </header>

      <section aria-live="polite" className="flex-1">
        <OrderSummary items={data.items} locale={locale} />
      </section>

      <section className="mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span>Do zapłaty:</span>
          <span className="font-semibold">
            {new Intl.NumberFormat("pl-PL", {
              style: "currency",
              currency: "PLN",
            }).format(data.totalRemaining)}
          </span>
        </div>

        {phase === "view" && data.totalRemaining > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPhase("split")}
              className="flex-1 py-3 px-4 rounded-xl bg-stone-200 text-stone-800 font-medium hover:bg-stone-300 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label={t.splitBill}
            >
              {t.splitBill}
            </button>
            <button
              type="button"
              onClick={() => {
                setSplitItems([]);
                setPhase("pay");
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label={t.payButton}
            >
              {t.payButton}
            </button>
          </div>
        )}

        {phase === "split" && (
          <SplitBillModal
            items={data.items}
            totalRemaining={data.totalRemaining}
            onClose={() => setPhase("view")}
            onConfirm={(items) => {
              setSplitItems(items);
              setPhase("pay");
            }}
            locale={locale}
          />
        )}

        {phase === "pay" && (
          <div className="space-y-4">
            <TipSelector
              amount={amountToPay}
              tipPercent={tipPercent}
              tipAmount={tipAmount}
              onTipPercentChange={setTipPercent}
              onTipAmountChange={setTipAmount}
              locale={locale}
            />
            <PaymentForm
              qrId={qrId}
              items={itemsToPay}
              tipPercent={tipPercent}
              tipAmount={tipAmount}
              onSuccess={(url) => {
                setConfirmationUrl(url);
                setPhase("success");
              }}
              onCancel={() => setPhase("view")}
              locale={locale}
            />
          </div>
        )}
      </section>
    </main>
  );
}
