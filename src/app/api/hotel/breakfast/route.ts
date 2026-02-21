import { NextResponse } from "next/server";
import { getBreakfastGuests } from "@/lib/hotel/client";

/**
 * GET /api/hotel/breakfast — list hotel guests with breakfast for today
 */
export async function GET() {
  try {
    const result = await getBreakfastGuests();
    return NextResponse.json(result);
  } catch (e) {
    console.error("[Hotel Breakfast Proxy]", e);
    return NextResponse.json(
      { guests: [], error: "Błąd pobierania listy śniadaniowej" },
      { status: 502 }
    );
  }
}
