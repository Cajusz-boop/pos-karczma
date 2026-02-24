export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getOccupiedRooms } from "@/lib/hotel/client";

/**
 * GET /api/hotel/rooms — proxy to hotel system, returns occupied rooms
 */
export async function GET() {
  try {
    const result = await getOccupiedRooms();
    if (result.error) {
      return NextResponse.json(
        { rooms: [], error: result.error },
        { status: result.rooms.length === 0 ? 200 : 200 }
      );
    }
    return NextResponse.json({ rooms: result.rooms });
  } catch (e) {
    console.error("[Hotel Rooms Proxy]", e);
    return NextResponse.json(
      { rooms: [], error: "Błąd połączenia z systemem hotelowym" },
      { status: 502 }
    );
  }
}
