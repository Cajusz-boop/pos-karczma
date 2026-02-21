"use client";

import { useEffect, useState, useCallback, use } from "react";

interface DisplayConfig {
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontSize: number;
  showLogo: boolean;
  logoUrl: string | null;
  soundOnReady: boolean;
  soundUrl: string | null;
  showPreparingSection: boolean;
  showReadySection: boolean;
}

interface OrderItem {
  orderNumber: number;
  customerName?: string;
  readyAt?: string;
}

interface DisplayData {
  display: DisplayConfig;
  preparing: OrderItem[];
  ready: OrderItem[];
  timestamp: string;
}

export default function CustomerDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<DisplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prevReadyCount, setPrevReadyCount] = useState(0);

  const playSound = useCallback((soundUrl: string | null) => {
    try {
      const audio = new Audio(soundUrl || "/sounds/ready.mp3");
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/customer-display/${id}/orders`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Błąd pobierania");
        return;
      }
      const newData: DisplayData = await res.json();
      setData(newData);
      setError(null);

      if (newData.display.soundOnReady && newData.ready.length > prevReadyCount) {
        playSound(newData.display.soundUrl);
      }
      setPrevReadyCount(newData.ready.length);
    } catch {
      setError("Błąd połączenia");
    }
  }, [id, prevReadyCount, playSound]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Ładowanie...</div>
      </div>
    );
  }

  const { display, preparing, ready } = data;

  return (
    <div
      className="min-h-screen p-8"
      style={{
        backgroundColor: display.backgroundColor,
        color: display.textColor,
        fontSize: `${display.fontSize}px`,
      }}
    >
      {display.showLogo && display.logoUrl && (
        <div className="text-center mb-8">
          <img src={display.logoUrl} alt="Logo" className="h-24 mx-auto" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 h-full">
        {display.showPreparingSection && (
          <div className="rounded-xl p-6" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <h2
              className="text-center font-bold mb-6 pb-4 border-b-2"
              style={{ borderColor: display.accentColor, fontSize: `${display.fontSize * 0.8}px` }}
            >
              W PRZYGOTOWANIU
            </h2>
            <div className="space-y-4">
              {preparing.length === 0 ? (
                <div className="text-center opacity-50" style={{ fontSize: `${display.fontSize * 0.6}px` }}>
                  Brak zamówień
                </div>
              ) : (
                preparing.map((order, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center gap-4 p-4 rounded-lg animate-pulse"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  >
                    <span className="font-bold" style={{ fontSize: `${display.fontSize * 1.2}px` }}>
                      #{order.orderNumber}
                    </span>
                    {order.customerName && (
                      <span className="opacity-70" style={{ fontSize: `${display.fontSize * 0.5}px` }}>
                        {order.customerName}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {display.showReadySection && (
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: display.accentColor + "33" }}
          >
            <h2
              className="text-center font-bold mb-6 pb-4 border-b-2"
              style={{ borderColor: display.accentColor, fontSize: `${display.fontSize * 0.8}px` }}
            >
              GOTOWE DO ODBIORU
            </h2>
            <div className="space-y-4">
              {ready.length === 0 ? (
                <div className="text-center opacity-50" style={{ fontSize: `${display.fontSize * 0.6}px` }}>
                  Brak gotowych
                </div>
              ) : (
                ready.map((order, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center gap-4 p-4 rounded-lg"
                    style={{
                      backgroundColor: display.accentColor,
                      animation: i === 0 ? "pulse 1s infinite" : undefined,
                    }}
                  >
                    <span className="font-bold" style={{ fontSize: `${display.fontSize * 1.5}px` }}>
                      #{order.orderNumber}
                    </span>
                    {order.customerName && (
                      <span className="opacity-80" style={{ fontSize: `${display.fontSize * 0.5}px` }}>
                        {order.customerName}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 opacity-30" style={{ fontSize: "14px" }}>
        {new Date(data.timestamp).toLocaleTimeString("pl-PL")}
      </div>
    </div>
  );
}
