import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * All supported offline action types.
 * Each type maps to a specific API endpoint.
 */
export type OfflineActionType =
  | "CREATE_ORDER"
  | "SEND_ORDER"
  | "ADD_PAYMENT"
  | "CLOSE_ORDER"
  | "CANCEL_ITEM"
  | "CASH_OPERATION"
  | "UPDATE_ORDER_ITEM"
  | "ADD_DISCOUNT"
  | "REMOVE_DISCOUNT"
  | "UPDATE_GUEST_COUNT"
  | "SPLIT_ORDER"
  | "MERGE_ORDER"
  | "TRANSFER_TABLE"
  | "RELEASE_COURSE"
  | "RECALL_ITEM"
  | "ADD_TIP"
  | "PRINT_RECEIPT"
  | "REQUEST_BILL";

/**
 * Priority levels for offline actions.
 * Higher priority actions are synced first.
 */
export type ActionPriority = "critical" | "high" | "normal" | "low";

/**
 * Pending action queued while offline.
 * Will be replayed when connection is restored.
 */
export interface PendingAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
  priority: ActionPriority;
  expiresAt?: string;
}

interface OfflineState {
  isOnline: boolean;
  pendingActions: PendingAction[];
  lastSyncAt: string | null;
  syncInProgress: boolean;
  failedPermanently: PendingAction[];

  setOnline: (online: boolean) => void;
  addPendingAction: (action: Omit<PendingAction, "id" | "createdAt" | "retryCount">) => void;
  removePendingAction: (id: string) => void;
  updatePendingAction: (id: string, updates: Partial<PendingAction>) => void;
  clearPendingActions: () => void;
  setLastSyncAt: (date: string) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  markAsFailed: (action: PendingAction) => void;
  clearFailedActions: () => void;
  getPendingCount: () => number;
  getActionsByType: (type: OfflineActionType) => PendingAction[];
}

function generateId(): string {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultPriority(type: OfflineActionType): ActionPriority {
  switch (type) {
    case "CREATE_ORDER":
    case "SEND_ORDER":
    case "ADD_PAYMENT":
    case "CLOSE_ORDER":
      return "critical";
    case "CANCEL_ITEM":
    case "CASH_OPERATION":
    case "SPLIT_ORDER":
    case "MERGE_ORDER":
      return "high";
    case "UPDATE_ORDER_ITEM":
    case "ADD_DISCOUNT":
    case "REMOVE_DISCOUNT":
    case "TRANSFER_TABLE":
    case "RELEASE_COURSE":
      return "normal";
    default:
      return "low";
  }
}

function sortByPriority(actions: PendingAction[]): PendingAction[] {
  const priorityOrder: Record<ActionPriority, number> = {
    critical: 0,
    high: 1,
    normal: 2,
    low: 3,
  };
  
  return [...actions].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingActions: [],
      lastSyncAt: null,
      syncInProgress: false,
      failedPermanently: [],

      setOnline: (online) => set({ isOnline: online }),

      addPendingAction: (action) =>
        set((state) => {
          const newAction: PendingAction = {
            ...action,
            id: generateId(),
            createdAt: new Date().toISOString(),
            retryCount: 0,
            priority: action.priority ?? getDefaultPriority(action.type),
          };
          
          const updatedActions = sortByPriority([...state.pendingActions, newAction]);
          
          return { pendingActions: updatedActions };
        }),

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
      
      markAsFailed: (action) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== action.id),
          failedPermanently: [...state.failedPermanently, action],
        })),
      
      clearFailedActions: () => set({ failedPermanently: [] }),
      
      getPendingCount: () => get().pendingActions.length,
      
      getActionsByType: (type) => 
        get().pendingActions.filter((a) => a.type === type),
    }),
    {
      name: "pos-karczma-offline",
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          return {
            ...(persistedState as OfflineState),
            failedPermanently: [],
          };
        }
        return persistedState as OfflineState;
      },
    }
  )
);
