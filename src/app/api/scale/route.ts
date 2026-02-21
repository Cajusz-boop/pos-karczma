import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentWeight,
  updateWeight,
  clearWeight,
  parseScaleData,
  parseScaleBarcode,
  ScaleReading,
} from "@/lib/scale/scale-service";

/**
 * GET /api/scale - get current weight from scale
 */
export async function GET() {
  try {
    const weight = getCurrentWeight();

    if (!weight) {
      return NextResponse.json({
        weight: null,
        message: "Brak odczytu z wagi",
        stale: true,
      });
    }

    return NextResponse.json({
      weight: weight.weight,
      unit: weight.unit,
      stable: weight.stable,
      net: weight.net,
      gross: weight.gross,
      tare: weight.tare,
      timestamp: weight.timestamp,
      stale: false,
    });
  } catch (e) {
    console.error("[Scale GET]", e);
    return NextResponse.json({ error: "Błąd odczytu wagi" }, { status: 500 });
  }
}

/**
 * POST /api/scale - update weight reading (from external polling service)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawData, protocol, weight, unit, stable } = body;

    let reading: ScaleReading | null = null;

    if (rawData) {
      reading = parseScaleData(rawData, protocol ?? "GENERIC");
    } else if (weight !== undefined) {
      reading = {
        weight: parseFloat(weight),
        unit: unit ?? "kg",
        stable: stable ?? true,
        tare: 0,
        net: parseFloat(weight),
        gross: parseFloat(weight),
        timestamp: new Date(),
      };
    }

    if (!reading) {
      return NextResponse.json({ error: "Nieprawidłowe dane wagi" }, { status: 400 });
    }

    updateWeight(reading);

    return NextResponse.json({
      message: "Waga zaktualizowana",
      weight: reading.weight,
      stable: reading.stable,
    });
  } catch (e) {
    console.error("[Scale POST]", e);
    return NextResponse.json({ error: "Błąd aktualizacji wagi" }, { status: 500 });
  }
}

/**
 * DELETE /api/scale - clear current weight reading
 */
export async function DELETE() {
  try {
    clearWeight();
    return NextResponse.json({ message: "Odczyt wagi wyczyszczony" });
  } catch (e) {
    console.error("[Scale DELETE]", e);
    return NextResponse.json({ error: "Błąd czyszczenia wagi" }, { status: 500 });
  }
}

/**
 * PUT /api/scale - parse barcode from scale
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode } = body;

    if (!barcode || typeof barcode !== "string") {
      return NextResponse.json({ error: "Brak kodu kreskowego" }, { status: 400 });
    }

    const parsed = parseScaleBarcode(barcode);

    if (!parsed) {
      return NextResponse.json({
        error: "Nieprawidłowy kod kreskowy wagi",
        hint: "Oczekiwany format: EAN-13 zaczynający się od 2",
      }, { status: 400 });
    }

    return NextResponse.json({
      productCode: parsed.productCode,
      weight: parsed.weight,
      unit: "kg",
      barcode,
    });
  } catch (e) {
    console.error("[Scale PUT]", e);
    return NextResponse.json({ error: "Błąd parsowania kodu kreskowego" }, { status: 500 });
  }
}
