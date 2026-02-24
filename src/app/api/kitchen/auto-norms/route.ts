export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { autoLearnPrepNorms } from "@/lib/kitchen/auto-norms";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/kitchen/auto-norms — trigger auto-learning of prep time norms
 * Calculates median prep time from last 50+ completed items per product.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await autoLearnPrepNorms();

    const userId = request.headers.get("x-user-id");
    await auditLog(userId, "AUTO_NORMS_UPDATE", "Product", undefined, undefined, {
      productsAnalyzed: result.productsAnalyzed,
      productsUpdated: result.productsUpdated,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Błąd auto-uczenia normatywów" }, { status: 500 });
  }
}
