import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  symbol: string;
  isActive: boolean;
  updatedAt: string;
}

const DEFAULT_RATES: CurrencyRate[] = [
  { code: "EUR", name: "Euro", rate: 4.30, symbol: "€", isActive: true, updatedAt: new Date().toISOString() },
  { code: "USD", name: "Dolar amerykański", rate: 4.00, symbol: "$", isActive: true, updatedAt: new Date().toISOString() },
  { code: "GBP", name: "Funt brytyjski", rate: 5.10, symbol: "£", isActive: false, updatedAt: new Date().toISOString() },
  { code: "CZK", name: "Korona czeska", rate: 0.17, symbol: "Kč", isActive: false, updatedAt: new Date().toISOString() },
];

const CONFIG_KEY = "currency_rates";

async function getRates(): Promise<CurrencyRate[]> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: CONFIG_KEY },
    });
    if (config?.value && Array.isArray(config.value)) {
      return config.value as unknown as CurrencyRate[];
    }
  } catch (e) {
    console.error("[Currency] Error reading config:", e);
  }
  return DEFAULT_RATES;
}

/**
 * GET /api/currency — list configured exchange rates
 * Optional ?active=true to filter only active currencies
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const rates = await getRates();
    const filtered = activeOnly ? rates.filter((r) => r.isActive) : rates;

    return NextResponse.json({ rates: filtered });
  } catch (e) {
    console.error("[Currency GET]", e);
    return NextResponse.json({ error: "Błąd pobierania kursów" }, { status: 500 });
  }
}

/**
 * PUT /api/currency — update exchange rates
 * Body: { rates: CurrencyRate[] }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rates } = body as { rates?: CurrencyRate[] };

    if (!rates || !Array.isArray(rates)) {
      return NextResponse.json({ error: "Wymagana tablica rates" }, { status: 400 });
    }

    for (const r of rates) {
      if (!r.code || !r.name || typeof r.rate !== "number" || r.rate <= 0) {
        return NextResponse.json({ error: `Nieprawidłowy kurs dla ${r.code}` }, { status: 400 });
      }
    }

    const updatedRates = rates.map((r) => ({
      ...r,
      updatedAt: new Date().toISOString(),
    }));

    await prisma.systemConfig.upsert({
      where: { key: CONFIG_KEY },
      create: { key: CONFIG_KEY, value: updatedRates as unknown as object },
      update: { value: updatedRates as unknown as object },
    });

    return NextResponse.json({ rates: updatedRates });
  } catch (e) {
    console.error("[Currency PUT]", e);
    return NextResponse.json({ error: "Błąd zapisu kursów" }, { status: 500 });
  }
}

/**
 * POST /api/currency — convert amount from foreign currency to PLN
 * Body: { amount, currency }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency } = body as { amount?: number; currency?: string };

    if (!amount || !currency) {
      return NextResponse.json({ error: "Wymagane: amount, currency" }, { status: 400 });
    }

    const rates = await getRates();
    const rate = rates.find((r) => r.code === currency && r.isActive);

    if (!rate) {
      return NextResponse.json({ error: `Waluta ${currency} nie jest obsługiwana` }, { status: 400 });
    }

    const plnAmount = Math.round(amount * rate.rate * 100) / 100;

    return NextResponse.json({
      originalAmount: amount,
      originalCurrency: currency,
      rate: rate.rate,
      plnAmount,
      symbol: rate.symbol,
    });
  } catch (e) {
    console.error("[Currency POST]", e);
    return NextResponse.json({ error: "Błąd przeliczenia" }, { status: 500 });
  }
}
