"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { initialSync, backgroundRefresh } from "@/lib/db/initial-sync";
import { clearExpiredSessions } from "@/lib/auth/cached-auth";
import { queueOperation } from "@/lib/sync/sync-engine";
import { db } from "@/lib/db/offline-db";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minut
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

export const DexieSyncContext = createContext<{ isReady: boolean }>({ isReady: false });

export function useDexieSyncReady(): boolean {
  return useContext(DexieSyncContext).isReady;
}

export function DexieProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function init() {
      try {
        // Napraw uszkodzonej bazy (v20 z 0 tabel) — Dexie nie może z niej migrować
        const needReset = await new Promise<boolean>((resolve) => {
          const req = indexedDB.open("PosKarczma");
          req.onsuccess = () => {
            const idb = req.result;
            const storeCount = idb.objectStoreNames.length;
            const version = idb.version;
            idb.close();
            resolve(version === 20 && storeCount === 0);
          };
          req.onerror = () => resolve(false);
        });
        if (needReset) {
          console.warn("[DexieProvider] Wykryto uszkodzoną bazę (v20, 0 tabel) — reset i przeładowanie");
          indexedDB.deleteDatabase("PosKarczma");
          location.reload();
          return;
        }

        await clearExpiredSessions();

        // V4-17: App version check — force refresh przy update (nie przy fresh install)
        const APP_VERSION = "1.0.0";
        const storedVersion = await db.syncCheckpoints.get("_appVersion");
        if (storedVersion && storedVersion.lastSyncAt !== APP_VERSION) {
          console.log("[DexieProvider] App update:", storedVersion.lastSyncAt, "→", APP_VERSION);
          await db.forceRefresh();
        }
        await db.syncCheckpoints.put({
          id: "_appVersion",
          lastSyncAt: APP_VERSION,
        });

        // V4-06: Quota management — persistent storage + agresywny purge przy >80%
        if (navigator.storage?.estimate) {
          const { usage, quota } = await navigator.storage.estimate();
          const usedMB = Math.round((usage ?? 0) / 1024 / 1024);
          const quotaMB = Math.round((quota ?? 0) / 1024 / 1024);
          const usedPercent = quota ? Math.round(((usage ?? 0) / quota) * 100) : 0;
          console.log(`[DexieProvider] Storage ${usedMB}MB / ${quotaMB}MB (${usedPercent}%)`);
          if (usedPercent > 80) {
            const deleted = await db.purgeOldOrders(3);
            if (deleted > 0) console.warn("[DexieProvider] Aggressive purge (>80% quota):", deleted);
          }
        }
        if (navigator.storage?.persist) {
          const persistent = await navigator.storage.persist();
          console.log("[DexieProvider] Persistent storage:", persistent);
        }

        // V4-11: Orphan detection — re-queue orders that are in Dexie but not in syncQueue (e.g. after crash)
        const pendingOrders = await db.orders.where("_syncStatus").equals("pending").toArray();
        for (const order of pendingOrders) {
          const inQueue = await db.syncQueue.where("localId").equals(order._localId).count();
          if (inQueue === 0) {
            await queueOperation("CREATE", "orders", order._localId, {
              tableId: order.tableId,
              roomId: order.roomId,
              userId: order.userId,
              type: order.type,
              guestCount: order.guestCount,
            });
            console.warn("[DexieProvider] Orphan re-queued:", order._localId);
          }
        }

        // Initial sync
        const result = await initialSync();
        console.log("[DexieProvider] Initial sync complete:", result.tables);
        if (result.errors.length > 0) {
          console.warn("[DexieProvider] Sync errors:", result.errors);
        }

        // Diagnostyka — dev only, dostęp do db w konsoli
        if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
          (window as unknown as { __POS_DB__?: typeof db }).__POS_DB__ = db;
          const rooms = await db.rooms.toArray();
          const tables = await db.posTables.toArray();
          console.log("[DexieProvider] DIAG: rooms count:", rooms.length);
          console.log("[DexieProvider] DIAG: sample isActive:", rooms[0]?.isActive, typeof rooms[0]?.isActive);
          console.log("[DexieProvider] DIAG: tables count:", tables.length);
          console.log("[DexieProvider] DIAG: sample isAvailable:", tables[0]?.isAvailable, typeof tables[0]?.isAvailable);
          if (rooms.length === 0) {
            console.warn("[DexieProvider] DIAG → Dane NIE trafiły do Dexie (problem w sync)");
          } else if (rooms[0] && (rooms[0].isActive === 0 || rooms[0].isActive === false)) {
            console.warn("[DexieProvider] DIAG → isActive=0/false — filtr active() może odrzucać");
          } else if (rooms.length > 0) {
            console.warn("[DexieProvider] DIAG → Dane OK w Dexie — problem w useLiveQuery/useMemo");
          }
        }

        // P20-FIX: Auto-purge starych zamówień (timestamp w Dexie)
        const lastPurgeCheckpoint = await db.syncCheckpoints.get("_lastPurge");
        const now = Date.now();
        const lastPurgeTime = lastPurgeCheckpoint?.lastSyncAt
          ? new Date(lastPurgeCheckpoint.lastSyncAt).getTime()
          : 0;

        if (now - lastPurgeTime > PURGE_INTERVAL_MS) {
          const deleted = await db.purgeOldOrders(7);
          if (deleted > 0) {
            console.log(`[DexieProvider] Purged ${deleted} old orders`);
          }
        }

        setReady(true);
      } catch (e) {
        console.error("[DexieProvider] Initial sync failed:", e);
        // Even if sync fails, allow app to work with cached data
        setReady(true);
      }
    }

    init();

    // V4-12: App foreground (Capacitor) — natychmiast sync
    let appListenerHandle: { remove: () => Promise<void> } | null = null;
    if (typeof window !== "undefined") {
      const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
      if (cap?.isNativePlatform?.()) {
        import("@capacitor/app").then((mod) =>
          mod.App.addListener("appStateChange", ({ isActive }: { isActive: boolean }) => {
            if (isActive) {
              import("@/lib/sync/sync-engine").then((m) => m.syncEngine.pushNow());
              backgroundRefresh();
            }
          })
        ).then((h) => { appListenerHandle = h; }).catch(() => {});
      }
    }

    // Background refresh every 5 minutes
    const interval = setInterval(backgroundRefresh, REFRESH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      appListenerHandle?.remove?.().catch(() => {});
    };
  }, []);

  return (
    <DexieSyncContext.Provider value={{ isReady: ready }}>
      {children}
    </DexieSyncContext.Provider>
  );
}
