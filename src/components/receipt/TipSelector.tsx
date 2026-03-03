"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/translations";

const TIP_PERCENTS = [0, 10, 15, 20];

export function TipSelector({
  amount,
  tipPercent,
  tipAmount,
  onTipPercentChange,
  onTipAmountChange,
  locale,
}: {
  amount: number;
  tipPercent: number;
  tipAmount: number;
  onTipPercentChange: (p: number) => void;
  onTipAmountChange: (a: number) => void;
  locale: Locale;
}) {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const t = locale === "pl"
    ? { tip: "Napiwek", tipCustom: "Inna kwota" }
    : { tip: "Tip", tipCustom: "Custom amount" };

  const handleCustomSubmit = () => {
    const v = parseFloat(customValue.replace(",", "."));
    if (!isNaN(v) && v >= 0) {
      onTipAmountChange(v);
      onTipPercentChange(0);
      setCustomMode(false);
    }
  };

  const tipValue = tipAmount > 0 ? tipAmount : (amount * tipPercent) / 100;
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700">
        {t.tip}
        {tipValue > 0 && (
          <span className="ml-2 text-stone-500 font-normal">
            ({new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(tipValue)})
          </span>
        )}
      </label>
      <div className="flex flex-wrap gap-2">
        {TIP_PERCENTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              onTipPercentChange(p);
              onTipAmountChange(0);
              setCustomMode(false);
            }}
            aria-label={`${t.tip} ${p}%`}
            aria-pressed={!customMode && tipPercent === p}
            className={`min-h-[44px] min-w-[44px] px-4 rounded-xl font-medium transition-colors ${
              !customMode && tipPercent === p
                ? "bg-amber-700 text-white"
                : "bg-stone-200 text-stone-800 hover:bg-stone-300"
            }`}
          >
            {p}%
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setCustomMode(true);
            setCustomValue("");
          }}
          aria-label={t.tipCustom}
          aria-pressed={customMode || tipAmount > 0}
          className={`min-h-[44px] min-w-[44px] px-4 rounded-xl font-medium transition-colors ${
            customMode || tipAmount > 0
              ? "bg-amber-700 text-white"
              : "bg-stone-200 text-stone-800 hover:bg-stone-300"
          }`}
        >
          {t.tipCustom}
        </button>
      </div>
      {customMode && (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="0.00"
            className="flex-1 min-h-[44px] px-4 rounded-xl border border-stone-300"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            className="min-h-[44px] px-4 rounded-xl bg-amber-700 text-white font-medium"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
