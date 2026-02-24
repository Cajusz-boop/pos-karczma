import { NextResponse } from "next/server";
import { predictKitchenLoad } from "@/lib/kitchen/load-prediction";

/**
 * GET /api/kitchen/prediction — kitchen load prediction for next hours
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prediction = await predictKitchenLoad();
    return NextResponse.json(prediction);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd predykcji obłożenia" }, { status: 500 });
  }
}
