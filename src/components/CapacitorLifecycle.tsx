"use client";

import { useEffect, useRef } from "react";
import { App, type AppState } from "@capacitor/app";

const KEEP_ALIVE_INTERVAL = 25000;
const RECONNECT_TIMEOUT = 3000;

function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export function CapacitorLifecycle() {
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isNativeApp()) return;

    const pingServer = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        await fetch("/api/ping", {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        lastPingRef.current = Date.now();
      } catch {
        // Ignore errors - connection check handles this
      }
    };

    const handleAppStateChange = async (state: AppState) => {
      if (state.isActive) {
        const timeSinceLastPing = Date.now() - lastPingRef.current;
        
        if (timeSinceLastPing > KEEP_ALIVE_INTERVAL * 2) {
          console.log("[Capacitor] App resumed after long idle, checking connection...");
          
          const isConnected = await checkConnection();
          
          if (!isConnected) {
            console.log("[Capacitor] Server unreachable, will retry...");
            
            let retries = 0;
            const maxRetries = 5;
            
            const retryConnection = async () => {
              retries++;
              const connected = await checkConnection();
              
              if (connected) {
                console.log("[Capacitor] Reconnected to server");
                window.location.reload();
              } else if (retries < maxRetries) {
                setTimeout(retryConnection, RECONNECT_TIMEOUT * retries);
              } else {
                console.log("[Capacitor] Failed to reconnect after retries");
              }
            };
            
            setTimeout(retryConnection, RECONNECT_TIMEOUT);
          }
        }
        
        pingServer();
        
        if (!keepAliveRef.current) {
          keepAliveRef.current = setInterval(pingServer, KEEP_ALIVE_INTERVAL);
        }
      } else {
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
          keepAliveRef.current = null;
        }
      }
    };

    const checkConnection = async (): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch("/api/ping", {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } catch {
        return false;
      }
    };

    pingServer();
    keepAliveRef.current = setInterval(pingServer, KEEP_ALIVE_INTERVAL);

    const listener = App.addListener("appStateChange", handleAppStateChange);

    return () => {
      listener.then(l => l.remove());
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
      }
    };
  }, []);

  return null;
}
