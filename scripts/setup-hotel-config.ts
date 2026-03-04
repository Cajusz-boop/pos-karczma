/**
 * Skrypt konfiguracji integracji hotelowej POS-Karczma ↔ HotelSystem
 * Czyta EXTERNAL_API_KEY z HotelSystem/.env i zapisuje w POS.
 *
 * Uruchom: npx tsx scripts/setup-hotel-config.ts
 */

import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/prisma";

function readApiKeyFromHotelSystem(): string | null {
  const paths = [
    process.env.HOTEL_SYSTEM_PATH ?? "C:\\HotelSystem",
    join(process.cwd(), "..", "HotelSystem"),
  ];
  for (const base of paths) {
    const envPath = join(base, ".env");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      const match = content.match(/EXTERNAL_API_KEY\s*=\s*["']?([^"'\s#]+)/);
      if (match?.[1]) return match[1].trim();
    }
  }
  return null;
}

async function main() {
  const apiKey = readApiKeyFromHotelSystem() ?? "karczma-pos-2026-hXk9mP4wQz";
  const baseUrl = "http://127.0.0.1:3011"; // HotelSystem (sprawdź port: 3000 lub 3011)

  const config = {
    enabled: true,
    baseUrl,
    apiKey,
  };

  console.log("🔧 Konfiguracja integracji hotelowej...\n");
  console.log("   baseUrl:", config.baseUrl);
  console.log("   apiKey:", config.apiKey.slice(0, 12) + "...");
  console.log("   enabled:", config.enabled);
  console.log("");

  await prisma.systemConfig.upsert({
    where: { key: "hotel_integration" },
    create: { key: "hotel_integration", value: config },
    update: { value: config },
  });

  console.log("✅ Konfiguracja zapisana w SystemConfig\n");

  const saved = await prisma.systemConfig.findUnique({
    where: { key: "hotel_integration" },
  });
  if (saved?.value) {
    console.log("📋 Zapisana konfiguracja:", JSON.stringify(saved.value as object, null, 2));
  }
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Błąd:", e);
    process.exit(1);
  });
