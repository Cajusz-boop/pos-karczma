"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/use-locale";
import { translations } from "@/lib/i18n/translations";

export default function ReceiptFallbackPage() {
  const locale = useLocale();
  const t = translations[locale];
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = tableNumber.trim();
    if (!num) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/public/fallback?tableNumber=${encodeURIComponent(num)}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(locale === "pl" ? "Stolik nie znaleziony" : "Table not found");
        setLoading(false);
        return;
      }
      if (json.redirectUrl) {
        window.location.href = json.redirectUrl;
        return;
      }
      setError("Błąd");
    } catch {
      setError(locale === "pl" ? "Błąd połączenia" : "Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-stone-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-xl font-semibold text-stone-800 text-center mb-2">
          {locale === "pl" ? "Nie możesz zeskanować kodu QR?" : "Can't scan the QR code?"}
        </h1>
        <p className="text-stone-600 text-center text-sm mb-6">
          {t.fallbackTitle}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="5"
            className="w-full min-h-[48px] px-4 rounded-xl border border-stone-300 text-center text-lg"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-700 text-white font-medium min-h-[48px] disabled:opacity-60"
          >
            {loading ? "..." : t.fallbackButton}
          </button>
        </form>
      </div>
    </main>
  );
}
