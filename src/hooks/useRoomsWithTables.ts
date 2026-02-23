import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/offline-db";

const isBrowser = () => typeof window !== "undefined";

export type RoomWithTables = {
  id: string;
  name: string;
  tables: { id: string; number: number; status: string }[];
};

/**
 * Rooms with their tables — for POS move dialog, merge dialog, etc.
 * Drop-in replacement for GET /api/rooms in OrderPageClient.
 */
export function useRoomsWithTables(): { rooms: RoomWithTables[]; isLoading: boolean } {
  const rooms = useLiveQuery(
    async () => {
      if (!isBrowser()) return [];

      const allRooms = await db.rooms
        .where("isActive")
        .equals(1)
        .sortBy("sortOrder");
      const allTables = await db.posTables.toArray();

      const tablesByRoom = new Map<string, typeof allTables>();
      for (const t of allTables) {
        if (!tablesByRoom.has(t.roomId)) tablesByRoom.set(t.roomId, []);
        tablesByRoom.get(t.roomId)!.push(t);
      }

      return allRooms.map((r) => ({
        id: r.id,
        name: r.name,
        tables: (tablesByRoom.get(r.id) ?? [])
          .filter((t) => t.isAvailable)
          .sort((a, b) => a.number - b.number)
          .map((t) => ({ id: t.id, number: t.number, status: t.status })),
      }));
    },
    [],
    []
  );

  return {
    rooms: rooms ?? [],
    isLoading: rooms === undefined,
  };
}
