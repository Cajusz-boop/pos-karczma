/**
 * Konfiguracja integracji hotelowej na PRODUKCJI (Hetzner).
 * baseUrl: 127.0.0.1:3000 (hotel-pms na tym samym serwerze)
 * apiKey: zgodny z EXTERNAL_API_KEY w HotelSystem na Hetzner
 *
 * Uruchom na serwerze:
 *   cd /var/www/pos
 *   DATABASE_URL="mysql://..." npx tsx scripts/setup-hotel-config-production.ts
 *
 * Albo po deploy: npm run hotel:setup:prod (wymaga .env z DATABASE_URL)
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const PRODUCTION_CONFIG = {
  enabled: true,
  baseUrl: "http://127.0.0.1:3000",
  apiKey: process.env.HOTEL_EXTERNAL_API_KEY ?? "a89f3281-8ae4-4c06-a351-987b35caa4f",
};

async function main() {
  console.log("🔧 Konfiguracja integracji hotelowej (produkcja)...\n");
  console.log("   baseUrl:", PRODUCTION_CONFIG.baseUrl);
  console.log("   apiKey:", PRODUCTION_CONFIG.apiKey.slice(0, 12) + "...");
  console.log("   enabled:", PRODUCTION_CONFIG.enabled);
  console.log("");

  await prisma.systemConfig.upsert({
    where: { key: "hotel_integration" },
    create: { key: "hotel_integration", value: PRODUCTION_CONFIG },
    update: { value: PRODUCTION_CONFIG },
  });

  console.log("✅ Konfiguracja zapisana. Integracja hotelowa włączona.\n");
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Błąd:", e);
    process.exit(1);
  });
