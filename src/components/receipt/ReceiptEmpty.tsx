"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import { translations } from "@/lib/i18n/translations";

export function ReceiptEmpty() {
  const locale = useLocale();
  const t = translations[locale];

  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
      <p className="text-stone-600 text-lg">{t.empty}</p>
    </div>
  );
}
