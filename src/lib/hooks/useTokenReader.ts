"use client";

import { useEffect, useRef, useCallback } from "react";

interface TokenReaderOptions {
  onToken: (tokenId: string) => void;
  enabled?: boolean;
  maxIntervalMs?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Hook for Dallas iButton / NFC / barcode keyboard-wedge readers.
 *
 * These readers emulate a keyboard: they rapidly type the token ID
 * (hex serial number) followed by Enter. This hook detects rapid
 * sequential keystrokes (< maxIntervalMs apart) that end with Enter
 * and treats the accumulated string as a token ID.
 *
 * Typical Dallas iButton serial: 8-16 hex chars, e.g. "01A2B3C4D5E6F7"
 * Typical barcode: 6-20 alphanumeric chars
 *
 * The hook ignores input when the user is focused on a text field.
 */
export function useTokenReader(options: TokenReaderOptions) {
  const {
    onToken,
    enabled = true,
    maxIntervalMs = 80,
    minLength = 4,
    maxLength = 64,
  } = options;

  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const resetBuffer = useCallback(() => {
    bufferRef.current = "";
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Allow reader input even in input fields if it's rapid enough
      // but only process Enter from the reader buffer
      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;

      // If too much time passed, reset the buffer
      if (elapsed > maxIntervalMs) {
        bufferRef.current = "";
      }

      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const token = bufferRef.current.trim();
        if (token.length >= minLength && token.length <= maxLength) {
          e.preventDefault();
          e.stopPropagation();
          onTokenRef.current(token);
        }
        bufferRef.current = "";
        return;
      }

      // Only accumulate printable single characters (from wedge reader)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // If this is the first char and user is in an input, skip
        // (to avoid capturing normal typing)
        if (bufferRef.current.length === 0 && isInput) {
          return;
        }

        bufferRef.current += e.key;

        // Safety: prevent buffer overflow
        if (bufferRef.current.length > maxLength) {
          bufferRef.current = "";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [enabled, maxIntervalMs, minLength, maxLength, resetBuffer]);
}
