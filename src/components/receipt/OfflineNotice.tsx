"use client";

import { useState, useEffect } from "react";
import { useLocale } from "@/lib/i18n/use-locale";
import { translations } from "@/lib/i18n/translations";

export function OfflineNotice() {
  const locale = useLocale();
  const t = translations[locale];
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="bg-amber-100 border border-amber-300 rounded-xl p-4 text-center text-amber-900 mb-4"
    >
      {t.offline}
    </div>
  );
}
