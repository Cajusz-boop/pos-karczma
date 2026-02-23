"use client";

import { useEffect, useState } from "react";
import { WifiOff, CloudOff, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { useSyncStatus } from "@/hooks/useOrder";
import { syncEngine } from "@/lib/sync/sync-engine";

export function OfflineIndicator() {
  const { pendingCount, errorCount } = useSyncStatus();
  const [isOnline, setIsOnline] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status) => {
      setSyncInProgress(status.state === "syncing");
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (syncResult) {
      const timer = setTimeout(() => setSyncResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncResult]);

  const handleManualSync = async () => {
    if (syncInProgress || !isOnline) return;
    
    setSyncInProgress(true);
    const result = await syncEngine.pushNow();
    setSyncInProgress(false);
    
    if (result.synced > 0) {
      setSyncResult(`Zsynchronizowano ${result.synced} ${result.synced === 1 ? "operację" : "operacji"}`);
    } else if (result.failed > 0) {
      setSyncResult(`${result.failed} ${result.failed === 1 ? "błąd" : "błędów"} synchronizacji`);
    } else if (result.pending === 0) {
      setSyncResult("Wszystko zsynchronizowane");
    }
  };

  if (isOnline && pendingCount === 0 && errorCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9998]">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-all
          ${!isOnline 
            ? "bg-red-600 text-white" 
            : pendingCount > 0 
              ? "bg-yellow-500 text-white"
              : errorCount > 0
                ? "bg-orange-500 text-white"
                : "bg-gray-600 text-white"
          }
        `}
      >
        {!isOnline ? (
          <WifiOff className="w-4 h-4" />
        ) : syncInProgress ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : errorCount > 0 ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <CloudOff className="w-4 h-4" />
        )}
        
        <span className="text-sm font-medium">
          {!isOnline 
            ? "Offline" 
            : syncInProgress
              ? "Synchronizuję..."
              : pendingCount > 0
                ? `${pendingCount} oczekujących`
                : `${errorCount} błędów`
          }
        </span>
      </button>

      {showDetails && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">Status synchronizacji</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          
          <div className="p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Operacje w kolejce:</span>
              <span className={`font-medium ${pendingCount > 0 ? "text-yellow-600" : "text-gray-900"}`}>
                {pendingCount}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Zamówienia z błędami:</span>
              <span className={`font-medium ${errorCount > 0 ? "text-red-600" : "text-gray-900"}`}>
                {errorCount}
              </span>
            </div>
            
            {syncResult && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                <Check className="w-3 h-3" />
                {syncResult}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <button
              onClick={handleManualSync}
              disabled={!isOnline || syncInProgress || pendingCount === 0}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              {syncInProgress ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Synchronizuj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
