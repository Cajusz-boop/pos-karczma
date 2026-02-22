"use client";

import { useEffect, useState } from "react";
import { WifiOff, CloudOff, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { useOfflineStore } from "@/store/useOfflineStore";
import { syncPendingActions, getSyncStatus } from "@/lib/offline/sync";

interface SyncStatus {
  pending: number;
  failed: number;
  lastSync: string | null;
  inProgress: boolean;
}

export function OfflineIndicator() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const pendingCount = useOfflineStore((s) => s.pendingActions.length);
  const failedCount = useOfflineStore((s) => s.failedPermanently.length);
  const syncInProgress = useOfflineStore((s) => s.syncInProgress);
  
  const [showDetails, setShowDetails] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (syncResult) {
      const timer = setTimeout(() => setSyncResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncResult]);

  const handleManualSync = async () => {
    if (syncInProgress || !isOnline) return;
    
    const result = await syncPendingActions();
    
    if (result.synced > 0) {
      setSyncResult(`Zsynchronizowano ${result.synced} ${result.synced === 1 ? "akcję" : "akcji"}`);
    } else if (result.failed > 0) {
      setSyncResult(`${result.failed} ${result.failed === 1 ? "błąd" : "błędów"} synchronizacji`);
    }
  };

  if (isOnline && pendingCount === 0 && failedCount === 0) {
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
              : failedCount > 0
                ? "bg-orange-500 text-white"
                : "bg-gray-600 text-white"
          }
        `}
      >
        {!isOnline ? (
          <WifiOff className="w-4 h-4" />
        ) : syncInProgress ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : failedCount > 0 ? (
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
                : `${failedCount} błędów`
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
              <span className="text-gray-600">Oczekujące akcje:</span>
              <span className={`font-medium ${pendingCount > 0 ? "text-yellow-600" : "text-gray-900"}`}>
                {pendingCount}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Błędy trwałe:</span>
              <span className={`font-medium ${failedCount > 0 ? "text-red-600" : "text-gray-900"}`}>
                {failedCount}
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
            
            {failedCount > 0 && (
              <button
                onClick={() => useOfflineStore.getState().clearFailedActions()}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                Wyczyść błędy
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
