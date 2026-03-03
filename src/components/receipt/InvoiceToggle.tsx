"use client";

import type { Locale } from "@/lib/i18n/translations";
import { translations } from "@/lib/i18n/translations";

function validateNip(nip: string): boolean {
  const digits = nip.replace(/\D/g, "");
  if (digits.length !== 10) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * weights[i];
  }
  const ctrl = sum % 11;
  const expected = ctrl === 10 ? 0 : ctrl;
  return parseInt(digits[9], 10) === expected;
}

export function InvoiceToggle({
  wantInvoice,
  invoiceNip,
  onWantInvoiceChange,
  onInvoiceNipChange,
  locale,
}: {
  wantInvoice: boolean;
  invoiceNip: string;
  onWantInvoiceChange: (v: boolean) => void;
  onInvoiceNipChange: (v: string) => void;
  locale: Locale;
}) {
  const t = translations[locale];
  const nipValid = !wantInvoice || !invoiceNip || validateNip(invoiceNip);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
        <input
          type="checkbox"
          checked={wantInvoice}
          onChange={(e) => onWantInvoiceChange(e.target.checked)}
          className="w-5 h-5 rounded"
        />
        <span className="text-sm font-medium">{t.invoiceToggle}</span>
      </label>
      {wantInvoice && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            {t.nip}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={invoiceNip}
            onChange={(e) => onInvoiceNipChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="0000000000"
            aria-label={t.nip}
            className={`w-full min-h-[44px] px-4 rounded-xl border ${
              nipValid ? "border-stone-300" : "border-red-500"
            }`}
            maxLength={10}
          />
          {!nipValid && invoiceNip.length === 10 && (
            <p className="text-sm text-red-600 mt-1">Nieprawidłowy NIP</p>
          )}
        </div>
      )}
    </div>
  );
}
