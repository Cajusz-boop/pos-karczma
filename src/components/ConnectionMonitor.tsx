"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { WifiOff, Wifi, ArrowRight, Zap } from "lucide-react";

const MAIN_SERVER = process.env.NEXT_PUBLIC_MAIN_SERVER_URL ?? "https://pos.karczma-labedz.pl";
const LOCAL_SERVER = process.env.NEXT_PUBLIC_LOCAL_SERVER_URL ?? "http://10.119.169.20:3001";
const CHECK_INTERVAL = Number(process.env.NEXT_PUBLIC_CONNECTION_CHECK_INTERVAL) || 30000;
const REDIRECT_DELAY = Number(process.env.NEXT_PUBLIC_REDIRECT_DELAY) || 5000;
const PREFERRED_SERVER_KEY = "pos-preferred-server";

type ConnectionStatus = "online" | "offline" | "checking" | "local";
type ServerCheckResult = { url: string; available: boolean; latencyMs: number };

export function ConnectionMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [isOnLocalServer, setIsOnLocalServer] = useState(false);
  const [mainServerAvailable, setMainServerAvailable] = useState(false);
  const [localServerAvailable, setLocalServerAvailable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [fasterServer, setFasterServer] = useState<string | null>(null);
  const isInitialCheck = useRef(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal =
        window.location.hostname === "10.119.169.20" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      setIsOnLocalServer(isLocal);
    }
  }, []);

  const checkServerWithLatency = useCallback(async (url: string): Promise<ServerCheckResult> => {
    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      await fetch(`${url}/api/ping`, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return { url, available: true, latencyMs: performance.now() - start };
    } catch {
      return { url, available: false, latencyMs: Infinity };
    }
  }, []);

  const checkServer = useCallback(async (url: string): Promise<boolean> => {
    const result = await checkServerWithLatency(url);
    return result.available;
  }, [checkServerWithLatency]);

  const checkBothServers = useCallback(async (): Promise<{ main: ServerCheckResult; local: ServerCheckResult }> => {
    const [main, local] = await Promise.all([
      checkServerWithLatency(MAIN_SERVER),
      checkServerWithLatency(LOCAL_SERVER),
    ]);
    return { main, local };
  }, [checkServerWithLatency]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    let countdownInterval: NodeJS.Timeout | undefined;

    const checkConnection = async () => {
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        setStatus("offline");
        if (!isOnLocalServer) {
          setShowBanner(true);
          setCountdown(REDIRECT_DELAY / 1000);
          countdownInterval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                if (countdownInterval) clearInterval(countdownInterval);
                window.location.href = LOCAL_SERVER;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
        return;
      }

      const { main, local } = await checkBothServers();
      setMainServerAvailable(main.available);
      setLocalServerAvailable(local.available);

      if (main.available && local.available) {
        const faster = main.latencyMs < local.latencyMs ? MAIN_SERVER : LOCAL_SERVER;
        setFasterServer(faster);

        if (isOnLocalServer) {
          setStatus("local");
          if (main.latencyMs < local.latencyMs * 0.7 && !dismissed) {
            setShowBanner(true);
          }
        } else {
          setStatus("online");
          if (local.latencyMs < main.latencyMs * 0.7 && !dismissed && isInitialCheck.current) {
            setShowBanner(true);
          }
        }
      } else if (main.available && !local.available) {
        setFasterServer(MAIN_SERVER);
        if (isOnLocalServer && !dismissed) {
          setShowBanner(true);
          setStatus("local");
        } else {
          setStatus("online");
          setShowBanner(false);
        }
      } else if (!main.available && local.available) {
        setFasterServer(LOCAL_SERVER);
        if (!isOnLocalServer) {
          setStatus("offline");
          setShowBanner(true);
          setCountdown(REDIRECT_DELAY / 1000);
          countdownInterval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                if (countdownInterval) clearInterval(countdownInterval);
                window.location.href = LOCAL_SERVER;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setStatus("local");
          setShowBanner(false);
        }
      } else {
        setFasterServer(null);
        setStatus("offline");
      }

      isInitialCheck.current = false;
    };

    const initialCheck = setTimeout(checkConnection, 1000);
    intervalId = setInterval(checkConnection, CHECK_INTERVAL);

    const handleOnline = () => checkConnection();
    const handleOffline = () => checkConnection();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(initialCheck);
      if (intervalId) clearInterval(intervalId);
      if (countdownInterval) clearInterval(countdownInterval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnLocalServer, checkBothServers, dismissed]);

  const handleGoToMain = () => {
    window.location.href = MAIN_SERVER;
  };

  const handleStayLocal = () => {
    setDismissed(true);
    setShowBanner(false);
  };

  const handleCancelRedirect = () => {
    setCountdown(0);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  // Na serwerze lokalnym, główny dostępny - sugestia przejścia do chmury
  if (isOnLocalServer && mainServerAvailable && fasterServer === MAIN_SERVER) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-green-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <div>
              <p className="font-medium">Serwer w chmurze jest szybszy!</p>
              <p className="text-sm opacity-90">
                Główny serwer odpowiada szybciej. Zalecamy przejście do wersji w chmurze.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStayLocal}
              className="px-3 py-1.5 text-sm bg-green-700 hover:bg-green-800 rounded transition-colors"
            >
              Zostań lokalnie
            </button>
            <button
              onClick={handleGoToMain}
              className="px-3 py-1.5 text-sm bg-white text-green-700 hover:bg-green-50 rounded font-medium flex items-center gap-1 transition-colors"
            >
              Przejdź do chmury
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Na serwerze lokalnym, główny dostępny ale wolniejszy
  if (isOnLocalServer && mainServerAvailable && fasterServer === LOCAL_SERVER) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-blue-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5" />
            <div>
              <p className="font-medium">Internet dostępny</p>
              <p className="text-sm opacity-90">
                Serwer lokalny jest szybszy - zostajesz tutaj.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStayLocal}
              className="px-3 py-1.5 text-sm bg-blue-700 hover:bg-blue-800 rounded transition-colors"
            >
              OK
            </button>
            <button
              onClick={handleGoToMain}
              className="px-3 py-1.5 text-sm bg-white text-blue-700 hover:bg-blue-50 rounded font-medium flex items-center gap-1 transition-colors"
            >
              Mimo to przejdź
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Na głównym serwerze, lokalny jest szybszy - sugestia przejścia
  if (!isOnLocalServer && localServerAvailable && fasterServer === LOCAL_SERVER && status !== "offline") {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <div>
              <p className="font-medium">Serwer lokalny jest szybszy!</p>
              <p className="text-sm opacity-90">
                Jesteś w sieci lokalnej - przełącz się dla lepszej wydajności.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStayLocal}
              className="px-3 py-1.5 text-sm bg-amber-700 hover:bg-amber-800 rounded transition-colors"
            >
              Zostań w chmurze
            </button>
            <button
              onClick={() => (window.location.href = LOCAL_SERVER)}
              className="px-3 py-1.5 text-sm bg-white text-amber-700 hover:bg-amber-50 rounded font-medium flex items-center gap-1 transition-colors"
            >
              Przejdź lokalnie
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Na głównym serwerze, brak połączenia - failover na lokalny
  if (!isOnLocalServer && status === "offline") {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 animate-pulse" />
            <div>
              <p className="font-medium">Brak połączenia z serwerem głównym!</p>
              <p className="text-sm opacity-90">
                {localServerAvailable
                  ? countdown > 0
                    ? `Przełączam na serwer lokalny za ${countdown}s...`
                    : "Przekierowuję na serwer lokalny..."
                  : "Oba serwery niedostępne - sprawdź połączenie sieciowe"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {localServerAvailable && (
              <>
                <button
                  onClick={handleCancelRedirect}
                  className="px-3 py-1.5 text-sm bg-red-700 hover:bg-red-800 rounded transition-colors"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => (window.location.href = LOCAL_SERVER)}
                  className="px-3 py-1.5 text-sm bg-white text-red-700 hover:bg-red-50 rounded font-medium flex items-center gap-1 transition-colors"
                >
                  Przejdź teraz
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
