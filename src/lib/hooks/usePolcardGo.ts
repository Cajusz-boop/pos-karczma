"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PaymentIntent, PolcardGoDeepLinkParams } from "@/lib/payment-terminal/types";

const POLCARD_GO_PACKAGE = "com.fiserv.polcard";
const POLCARD_GO_DEEP_LINK_SCHEME = "polcardgo";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90;

interface UsePolcardGoOptions {
  onSuccess?: (result: PaymentIntent) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface UsePolcardGoReturn {
  initiatePayment: (params: InitiatePaymentParams) => Promise<void>;
  cancelPayment: () => void;
  isProcessing: boolean;
  isPolcardAvailable: boolean;
  status: PolcardPaymentStatus;
  error: string | null;
}

interface InitiatePaymentParams {
  intentId: string;
  amount: number;
  orderId: string;
  description?: string;
}

type PolcardPaymentStatus =
  | "idle"
  | "initiating"
  | "waiting_for_app"
  | "polling"
  | "success"
  | "failed"
  | "cancelled";

export function usePolcardGo(options: UsePolcardGoOptions = {}): UsePolcardGoReturn {
  const { onSuccess, onError, onCancel } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<PolcardPaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPolcardAvailable, setIsPolcardAvailable] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const currentIntentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      setIsPolcardAvailable(ua.includes("android"));
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    attemptCountRef.current = 0;
  }, []);

  const pollPaymentStatus = useCallback(async (intentId: string) => {
    try {
      const response = await fetch(`/api/payment/polcard-status?intentId=${intentId}`);
      const data = await response.json();

      if (data.status === "SUCCEEDED") {
        stopPolling();
        setStatus("success");
        setIsProcessing(false);
        onSuccess?.({
          id: intentId,
          amount: data.amount,
          currency: data.currency,
          status: "SUCCEEDED",
          transactionRef: data.transactionRef,
          polcardResponse: data.polcardResponse,
        });
      } else if (data.status === "FAILED") {
        stopPolling();
        setStatus("failed");
        setError(data.errorMessage || "Płatność nie powiodła się");
        setIsProcessing(false);
        onError?.(data.errorMessage || "Płatność nie powiodła się");
      } else if (data.status === "CANCELLED") {
        stopPolling();
        setStatus("cancelled");
        setIsProcessing(false);
        onCancel?.();
      }
    } catch (e) {
      console.error("[usePolcardGo] Poll error:", e);
    }
  }, [stopPolling, onSuccess, onError, onCancel]);

  const startPolling = useCallback((intentId: string) => {
    setStatus("polling");
    attemptCountRef.current = 0;
    currentIntentIdRef.current = intentId;

    pollingRef.current = setInterval(() => {
      attemptCountRef.current++;

      if (attemptCountRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setStatus("failed");
        setError("Przekroczono czas oczekiwania na płatność");
        setIsProcessing(false);
        onError?.("Przekroczono czas oczekiwania na płatność");
        return;
      }

      pollPaymentStatus(intentId);
    }, POLL_INTERVAL_MS);
  }, [pollPaymentStatus, stopPolling, onError]);

  const generateDeepLink = useCallback((params: PolcardGoDeepLinkParams): string => {
    const amountInGrosze = Math.round(params.amount * 100);

    const queryParams = new URLSearchParams({
      action: params.action,
      amount: String(amountInGrosze),
      currency: params.currency,
      orderId: params.orderId,
      callback: params.callback,
    });

    if (params.description) {
      queryParams.set("description", params.description);
    }

    return `${POLCARD_GO_DEEP_LINK_SCHEME}://payment?${queryParams.toString()}`;
  }, []);

  const generateIntentUrl = useCallback((params: PolcardGoDeepLinkParams): string => {
    const amountInGrosze = Math.round(params.amount * 100);

    return `intent://payment?amount=${amountInGrosze}&currency=${params.currency}&orderId=${params.orderId}&callback=${encodeURIComponent(params.callback)}#Intent;scheme=${POLCARD_GO_DEEP_LINK_SCHEME};package=${POLCARD_GO_PACKAGE};end`;
  }, []);

  const initiatePayment = useCallback(async (params: InitiatePaymentParams) => {
    const { intentId, amount, orderId, description } = params;

    setIsProcessing(true);
    setStatus("initiating");
    setError(null);
    currentIntentIdRef.current = intentId;

    const callbackUrl = `${window.location.origin}/api/payment/polcard-callback?intentId=${intentId}`;

    const deepLinkParams: PolcardGoDeepLinkParams = {
      action: "payment",
      amount,
      currency: "PLN",
      orderId,
      description,
      callback: callbackUrl,
    };

    const deepLink = generateDeepLink(deepLinkParams);
    const intentUrl = generateIntentUrl(deepLinkParams);

    setStatus("waiting_for_app");

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    setTimeout(() => {
      document.body.removeChild(iframe);

      window.location.href = intentUrl;

      setTimeout(() => {
        startPolling(intentId);
      }, 1000);
    }, 500);
  }, [generateDeepLink, generateIntentUrl, startPolling]);

  const cancelPayment = useCallback(() => {
    stopPolling();
    setStatus("cancelled");
    setIsProcessing(false);

    if (currentIntentIdRef.current) {
      fetch(`/api/payment/polcard-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: currentIntentIdRef.current,
          success: false,
          errorCode: "USER_CANCELLED",
          errorMessage: "Użytkownik anulował płatność",
        }),
      }).catch(console.error);
    }

    onCancel?.();
  }, [stopPolling, onCancel]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    initiatePayment,
    cancelPayment,
    isProcessing,
    isPolcardAvailable,
    status,
    error,
  };
}
