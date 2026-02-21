"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface WebNfcOptions {
  onToken: (serialNumber: string) => void;
  enabled?: boolean;
}

interface NDEFReader {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  addEventListener: (
    event: string,
    handler: (event: NDEFReadingEvent) => void
  ) => void;
  removeEventListener: (
    event: string,
    handler: (event: NDEFReadingEvent) => void
  ) => void;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: {
    records: Array<{
      recordType: string;
      data: ArrayBuffer;
      encoding?: string;
      lang?: string;
    }>;
  };
}

declare global {
  interface Window {
    NDEFReader?: new () => NDEFReader;
  }
}

/**
 * Hook for Web NFC API (Chrome Android 89+).
 *
 * Reads NFC tag serial numbers and passes them to onToken callback.
 * Falls back gracefully on unsupported browsers.
 *
 * Requirements:
 * - HTTPS (or localhost)
 * - Chrome Android 89+
 * - User must grant NFC permission
 */
export function useWebNfc(options: WebNfcOptions) {
  const { onToken, enabled = true } = options;
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "NDEFReader" in window);
  }, []);

  const startScan = useCallback(async () => {
    if (!supported || !enabled) return;
    if (scanning) return;

    try {
      setError(null);
      const NDEFReaderClass = window.NDEFReader;
      if (!NDEFReaderClass) return;

      const reader = new NDEFReaderClass();
      abortControllerRef.current = new AbortController();

      reader.addEventListener("reading", ((event: NDEFReadingEvent) => {
        const serialNumber = event.serialNumber;
        if (serialNumber) {
          // Normalize: remove colons/dashes, uppercase
          const normalized = serialNumber
            .replace(/[:\-\s]/g, "")
            .toUpperCase();
          if (normalized.length >= 4) {
            onTokenRef.current(normalized);
          }
        }
      }) as EventListener);

      await reader.scan({ signal: abortControllerRef.current.signal });
      setScanning(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Brak uprawnień NFC. Zezwól na dostęp do NFC.");
      } else if (err instanceof DOMException && err.name === "NotSupportedError") {
        setError("NFC nie jest obsługiwane na tym urządzeniu.");
      } else {
        setError("Błąd uruchamiania NFC.");
      }
      setScanning(false);
    }
  }, [supported, enabled, scanning]);

  const stopScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Auto-start scanning when enabled and supported
  useEffect(() => {
    if (enabled && supported) {
      startScan();
    }
    return () => {
      stopScan();
    };
  }, [enabled, supported, startScan, stopScan]);

  return { supported, scanning, error, startScan, stopScan };
}
