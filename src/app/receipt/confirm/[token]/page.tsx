"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ConfirmData = {
  htmlContent: string | null;
  fiscalNumber: string;
  paidAt: string | null;
  orderNumber: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  total: number;
};

export default function ReceiptConfirmPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<ConfirmData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/receipt/confirm/${token}`)
      .then((res) => {
        if (res.status === 404) {
          setError("Potwierdzenie nie znalezione");
          return null;
        }
        if (res.status === 410) {
          setError("Link wygasł");
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch(() => setError("Błąd ładowania"));
  }, [token]);

  if (error) {
    return (
      <main className="min-h-dvh bg-stone-100 flex items-center justify-center p-4">
        <p className="text-stone-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-dvh bg-stone-100 flex items-center justify-center p-4">
        <div className="animate-pulse text-stone-500">Ładowanie…</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-stone-100 flex flex-col items-center p-4">
      <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-xl bg-white ring-1 ring-black/5 p-6">
        <h1 className="text-lg font-semibold text-stone-800 mb-4">
          Potwierdzenie płatności — Zamówienie #{data.orderNumber}
        </h1>
        {data.htmlContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: data.htmlContent }}
            className="[&_*]:max-w-full prose prose-sm"
          />
        ) : (
          <div className="space-y-2">
            {data.items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span>{i.name} × {i.quantity}</span>
                <span>{i.lineTotal.toFixed(2)} PLN</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Razem</span>
              <span>{data.total.toFixed(2)} PLN</span>
            </div>
          </div>
        )}
        {data.fiscalNumber && data.fiscalNumber !== "PENDING" && (
          <p className="mt-4 text-xs text-stone-500">Paragon fiskalny: {data.fiscalNumber}</p>
        )}
      </div>
      <p className="mt-4 text-xs text-stone-500">
        E-paragon — Karczma Łabędź
      </p>
    </main>
  );
}
