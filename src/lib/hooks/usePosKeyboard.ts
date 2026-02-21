"use client";

import { useEffect } from "react";

interface PosKeyboardOptions {
  onSendToKitchen?: () => void;
  onCloseBill?: () => void;
  onBackToMap?: () => void;
  onSearch?: () => void;
  onQuantityUp?: () => void;
  onQuantityDown?: () => void;
  enabled?: boolean;
}

/**
 * Keyboard shortcuts for POS desktop usage.
 * - F2: Send to kitchen
 * - F3: Close bill / payment
 * - Escape: Back to table map
 * - F4: Focus search
 * - +/numpad+: Increase quantity of selected item
 * - -/numpad-: Decrease quantity of selected item
 */
export function usePosKeyboard(options: PosKeyboardOptions) {
  const {
    onSendToKitchen,
    onCloseBill,
    onBackToMap,
    onSearch,
    onQuantityUp,
    onQuantityDown,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Allow Escape in inputs
        if (e.key !== "Escape") return;
      }

      switch (e.key) {
        case "F2":
          e.preventDefault();
          onSendToKitchen?.();
          break;
        case "F3":
          e.preventDefault();
          onCloseBill?.();
          break;
        case "Escape":
          e.preventDefault();
          onBackToMap?.();
          break;
        case "F4":
          e.preventDefault();
          onSearch?.();
          break;
        case "+":
        case "Add":
          e.preventDefault();
          onQuantityUp?.();
          break;
        case "-":
        case "Subtract":
          e.preventDefault();
          onQuantityDown?.();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onSendToKitchen, onCloseBill, onBackToMap, onSearch, onQuantityUp, onQuantityDown]);
}
