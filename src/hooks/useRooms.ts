import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/offline-db";
import type { LocalRoom, LocalTable } from "@/lib/db/offline-db";

const isBrowser = () => typeof window !== "undefined";

export function useRooms(activeOnly = true): { rooms: LocalRoom[]; isLoading: boolean } {
  const rooms = useLiveQuery(
    async () => {
      if (!isBrowser()) return [];
      const allRooms = await db.rooms.toArray();
      const filtered = activeOnly ? allRooms.filter(r => r.isActive) : allRooms;
      return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [activeOnly],
    []
  );
  return { rooms: rooms ?? [], isLoading: rooms === undefined };
}

/** All rooms including inactive — for settings. */
export function useAllRooms(): { rooms: LocalRoom[]; isLoading: boolean } {
  return useRooms(false);
}

export function useRoom(roomId: string): LocalRoom | undefined {
  return useLiveQuery(
    () => (!isBrowser() ? undefined : db.rooms.get(roomId)),
    [roomId],
    undefined
  );
}

export function useTables(roomId?: string): { tables: LocalTable[]; isLoading: boolean } {
  const tables = useLiveQuery(
    async () => {
      if (!isBrowser()) return [];
      if (roomId) return db.posTables.where("roomId").equals(roomId).sortBy("number");
      return db.posTables.orderBy("number").toArray();
    },
    [roomId],
    []
  );
  return { tables: tables ?? [], isLoading: tables === undefined };
}

export function useTable(tableId: string): LocalTable | undefined {
  return useLiveQuery(
    () => (!isBrowser() ? undefined : db.posTables.get(tableId)),
    [tableId],
    undefined
  );
}

export function useTablesByStatus(status: LocalTable["status"]): {
  tables: LocalTable[];
  isLoading: boolean;
} {
  const tables = useLiveQuery(
    () => (!isBrowser() ? [] : db.posTables.where("status").equals(status).toArray()),
    [status],
    []
  );
  return { tables: tables ?? [], isLoading: tables === undefined };
}
