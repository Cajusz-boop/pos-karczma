"use client";

import { useEffect, useState, useCallback } from "react";
import { useSyncStatus } from "@/hooks/useOrder";

interface SWStatus {
  registered: boolean;
  error: string | null;
  updateAvailable: boolean;
}

export function ServiceWorkerRegister() {
  const [status, setStatus] = useState<SWStatus>({
    registered: false,
    error: null,
    updateAvailable: false,
  });
  
  const { pendingCount } = useSyncStatus();

  const handleSWMessage = useCallback(async (event: MessageEvent) => {
    if (event.data?.type === "SYNC_REQUESTED") {
      // Legacy sync - can be removed after full migration
      try {
        const { syncPendingActions } = await import("@/lib/offline/sync");
        syncPendingActions();
      } catch {
        // Old sync not available
      }
    }
    
    if (event.data?.type === "DEXIE_SYNC_REQUESTED") {
      // New Dexie sync engine
      try {
        const { syncEngine } = await import("@/lib/sync/sync-engine");
        syncEngine.pushNow();
      } catch (e) {
        console.error("[SW] Dexie sync failed:", e);
      }
    }
  }, []);

  const requestBackgroundSync = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "REGISTER_SYNC" });
    }
  }, []);

  useEffect(() => {
    if (pendingCount > 0) {
      requestBackgroundSync();
    }
  }, [pendingCount, requestBackgroundSync]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setStatus((s) => ({ ...s, error: "Service Worker nie jest wspierany" }));
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker.addEventListener("message", handleSWMessage);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;
        setStatus((s) => ({ ...s, registered: true }));

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setStatus((s) => ({ ...s, updateAvailable: true }));
              }
            });
          }
        });

        if (reg.waiting && navigator.serviceWorker.controller) {
          setStatus((s) => ({ ...s, updateAvailable: true }));
        }
      })
      .catch((err) => {
        console.error("[SW] Registration failed:", err);
        setStatus((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Błąd rejestracji SW",
        }));
      });

    const checkForUpdates = () => {
      if (registration) {
        registration.update().catch(() => {
          // Ignore update check errors
        });
      }
    };

    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener("message", handleSWMessage);
    };
  }, [handleSWMessage]);

  const handleUpdate = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  if (status.updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <p className="font-medium text-sm">Dostępna aktualizacja</p>
        <p className="text-xs opacity-90 mt-1">
          Odśwież stronę, aby załadować najnowszą wersję.
        </p>
        <button
          onClick={handleUpdate}
          className="mt-2 px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Odśwież teraz
        </button>
      </div>
    );
  }

  if (status.error && !status.registered) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] bg-yellow-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <p className="font-medium text-sm">Tryb offline niedostępny</p>
        <p className="text-xs opacity-90 mt-1">
          Aplikacja wymaga połączenia z internetem.
        </p>
      </div>
    );
  }

  return null;
}
