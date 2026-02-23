"use client";

import { Cloud, CloudOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncStatus = "synced" | "pending" | "error" | string;

interface OrderSyncBadgeProps {
  syncStatus: SyncStatus;
  className?: string;
}

/**
 * V4-14: Ikona statusu sync zamówienia — synced / pending / error.
 */
export function OrderSyncBadge({ syncStatus, className }: OrderSyncBadgeProps) {
  switch (syncStatus) {
    case "synced":
      return (
        <span
          className={cn("inline-flex items-center", className)}
          title="Zsynchronizowane"
          aria-label="Zsynchronizowane"
        >
          <Cloud className="h-4 w-4 text-green-500" />
        </span>
      );
    case "pending":
      return (
        <span
          className={cn("inline-flex items-center animate-pulse", className)}
          title="Zapisane lokalnie — zsynchronizuje się po powrocie sieci"
          aria-label="Oczekuje na synchronizację"
        >
          <CloudOff className="h-4 w-4 text-amber-500" />
        </span>
      );
    case "error":
      return (
        <span
          className={cn("inline-flex items-center", className)}
          title="Błąd synchronizacji"
          aria-label="Błąd synchronizacji"
        >
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </span>
      );
    default:
      return null;
  }
}
