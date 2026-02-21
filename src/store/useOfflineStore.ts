import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Pending action queued while offline.
 * Will be replayed when connection is restored.
 */
export interface PendingAction {
  id: string;
  type: "CREATE_ORDER" | "SEND_ORDER" | "ADD_PAYMENT" | "CLOSE_ORDER" | "CANCEL_ITEM" | "CASH_OPERATION";
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

interface OfflineState {
  isOnline: boolean;
  pendingActions: PendingAction[];
  lastSyncAt: string | null;
  syncInProgress: boolean;

  setOnline: (online: boolean) => void;
  addPendingAction: (action: Omit<PendingAction, "id" | "createdAt" | "retryCount">) => void;
  removePendingAction: (id: string) => void;
  updatePendingAction: (id: string, updates: Partial<PendingAction>) => void;
  clearPendingActions: () => void;
  setLastSyncAt: (date: string) => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

function generateId(): string {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      isOnline: true,
      pendingActions: [],
      lastSyncAt: null,
      syncInProgress: false,

      setOnline: (online) => set({ isOnline: online }),

      addPendingAction: (action) =>
        set((state) => ({
          pendingActions: [
            ...state.pendingActions,
            {
              ...action,
              id: generateId(),
              createdAt: new Date().toISOString(),
              retryCount: 0,
            },
          ],
        })),

      removePendingAction: (id) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== id),
        })),

      updatePendingAction: (id, updates) =>
        set((state) => ({
          pendingActions: state.pendingActions.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      clearPendingActions: () => set({ pendingActions: [] }),

      setLastSyncAt: (date) => set({ lastSyncAt: date }),

      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),
    }),
    {
      name: "pos-karczma-offline",
    }
  )
);
