"use client";

import { useMemo } from "react";
import type { Locale } from "./translations";

export function useLocale(): Locale {
  return useMemo(() => {
    if (typeof navigator === "undefined") return "pl";
    return navigator.language.startsWith("en") ? "en" : "pl";
  }, []);
}
