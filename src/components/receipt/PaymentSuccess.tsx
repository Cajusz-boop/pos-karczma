"use client";

import { translations } from "@/lib/i18n/translations";

// Pokazuj link tylko gdy skonfigurowano w .env (bez fallback placeholderu)
const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL;

export function PaymentSuccess({
  confirmationUrl,
  locale,
}: {
  confirmationUrl: string;
  locale: "pl" | "en";
}) {
  const t = translations[locale];

  const copyLink = () => {
    navigator.clipboard?.writeText(fullConfirmUrl);
  };

  const fullConfirmUrl =
    confirmationUrl.startsWith("http")
      ? confirmationUrl
      : typeof window !== "undefined"
        ? `${window.location.origin}${confirmationUrl.startsWith("/") ? "" : "/"}${confirmationUrl}`
        : confirmationUrl;

  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-6 space-y-6">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <span className="text-3xl" role="img" aria-hidden>
          ✓
        </span>
      </div>
      <h1 className="text-2xl font-semibold text-stone-800">{t.success}</h1>
      <p className="text-stone-600">{t.confirmationSaved}</p>
      <div className="w-full max-w-sm space-y-2">
        <a
          href={fullConfirmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 rounded-xl bg-stone-100 text-stone-800 hover:bg-stone-200 break-all text-sm"
        >
          {fullConfirmUrl}
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="w-full py-3 rounded-xl bg-stone-200 font-medium min-h-[44px]"
          aria-label={locale === "pl" ? "Kopiuj link do potwierdzenia" : "Copy confirmation link"}
        >
          {locale === "pl" ? "Kopiuj link" : "Copy link"}
        </button>
      </div>
      {GOOGLE_REVIEW_URL && (
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="py-3 px-6 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-800 min-h-[44px] flex items-center justify-center"
          aria-label={t.googleReview}
        >
          {t.googleReview}
        </a>
      )}
    </div>
  );
}
