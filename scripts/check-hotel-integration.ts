/**
 * Diagnostyka integracji hotelowej — sprawdza konfigurację i połączenie z HotelSystem
 * Uruchom: npx tsx scripts/check-hotel-integration.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Diagnostyka integracji hotelowej\n");

  // 1. Konfiguracja z bazy
  const config = await prisma.systemConfig.findUnique({
    where: { key: "hotel_integration" },
  });

  if (!config?.value) {
    console.log("❌ Brak konfiguracji hotel_integration w bazie.");
    console.log("   Uruchom: npx tsx scripts/setup-hotel-config.ts\n");
    return;
  }

  const cfg = config.value as { enabled?: boolean; baseUrl?: string; apiKey?: string };
  console.log("📋 Aktualna konfiguracja:");
  console.log("   enabled:", cfg.enabled);
  console.log("   baseUrl:", cfg.baseUrl);
  console.log("   apiKey:", cfg.apiKey ? `${cfg.apiKey.slice(0, 12)}...` : "(pusty)");
  console.log();

  if (!cfg.enabled) {
    console.log("⚠️ Integracja wyłączona (enabled: false).\n");
    return;
  }

  if (!cfg.baseUrl || !cfg.apiKey) {
    console.log("❌ baseUrl lub apiKey jest pusty.\n");
    return;
  }

  // 2. Test HTTP do HotelSystem
  const url = `${cfg.baseUrl.replace(/\/$/, "")}/api/v1/external/occupied-rooms`;
  console.log("🌐 Test połączenia:", url);
  console.log();

  try {
    const res = await fetch(url, {
      headers: {
        "X-API-Key": cfg.apiKey,
        Authorization: `Bearer ${cfg.apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    console.log("   Status:", res.status, res.statusText);
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text.slice(0, 200);
    }
    console.log("   Odpowiedź:", typeof parsed === "object" ? JSON.stringify(parsed).slice(0, 300) : parsed);
    console.log();

    if (res.ok) {
      const data = parsed as { rooms?: unknown[] };
      const count = data?.rooms?.length ?? 0;
      console.log("✅ Połączenie OK. Liczba pokoi:", count);
    } else {
      console.log("❌ Błąd:", res.status);
      if (res.status === 401) {
        console.log("\n   Możliwe przyczyny 401:");
        console.log("   - Nieprawidłowy apiKey — sprawdź EXTERNAL_API_KEY w HotelSystem/.env");
        console.log("   - HotelSystem wymaga innego formatu autoryzacji");
        console.log("   - Konfiguracja w bazie (apiKey) nie zgadza się z HotelSystem");
      }
    }
  } catch (e) {
    console.log("❌ Błąd połączenia:", e instanceof Error ? e.message : e);
    console.log("\n   Sprawdź czy HotelSystem jest uruchomiony na", cfg.baseUrl);
  }

  console.log();
}

main()
  .finally(() => prisma.$disconnect());
