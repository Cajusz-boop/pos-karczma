"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";

const REFETCH_INTERVAL_MS = 4 * 60 * 1000; // 4 minuty
const SESSION_CHECK_URL = "/api/config";

/**
 * Waliduje sesję JWT w tle — co 4 min oraz przy powrocie do zakładki.
 * Przy 401 wywołuje logout(), zapobiegając porannemu problemowi "Brak sal i stolików"
 * gdy kelner zostawił aplikację otwartą na noc i sesja wygasła.
 */
export function SessionValidator() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkSession = async () => {
    if (!currentUser) return;
    if (!navigator.onLine) return;

    try {
      const res = await fetch(SESSION_CHECK_URL, { method: "GET", cache: "no-store", credentials: "include" });
      if (res.status === 401) {
        console.warn("[SessionValidator] Sesja wygasła — wylogowuję");
        logout();
      }
    } catch {
      // Offline lub błąd sieci — nie wylogowuj
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    checkSession();

    const interval = setInterval(checkSession, REFETCH_INTERVAL_MS);
    intervalRef.current = interval;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser, logout]);

  return null;
}
