/**
 * Skrypt konfiguracji integracji hotelowej POS-Karczma ↔ HotelSystem
 * 
 * Uruchom: npx tsx scripts/setup-hotel-config.ts
 */

import mariadb from "mariadb";

async function main() {
  const config = {
    enabled: true,
    baseUrl: "http://localhost:3011", // HotelSystem port
    apiKey: "karczma-pos-2026-hXk9mP4wQz", // Klucz z HotelSystem/.env EXTERNAL_API_KEY
  };

  console.log("🔧 Konfiguracja integracji hotelowej...\n");
  console.log("   baseUrl:", config.baseUrl);
  console.log("   apiKey:", config.apiKey.slice(0, 10) + "...");
  console.log("   enabled:", config.enabled);
  console.log("");

  // Połącz z bazą
  const connection = await mariadb.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "pos_karczma",
  });

  const id = crypto.randomUUID();
  const valueJson = JSON.stringify(config);

  // Upsert - wstaw lub zaktualizuj (SystemConfig nie ma createdAt/updatedAt)
  await connection.query(
    `INSERT INTO SystemConfig (id, \`key\`, value) 
     VALUES (?, 'hotel_integration', ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [id, valueJson]
  );

  console.log("✅ Konfiguracja zapisana w SystemConfig\n");

  // Weryfikacja
  const rows = await connection.query(
    "SELECT * FROM SystemConfig WHERE `key` = 'hotel_integration'"
  );

  if (Array.isArray(rows) && rows.length > 0) {
    console.log("📋 Zapisana konfiguracja:");
    const row = rows[0] as { value: string };
    try {
      console.log(JSON.stringify(JSON.parse(row.value as string), null, 2));
    } catch {
      console.log(row.value);
    }
  }

  await connection.end();
}

main()
  .catch((e) => {
    console.error("❌ Błąd:", e);
    process.exit(1);
  });
