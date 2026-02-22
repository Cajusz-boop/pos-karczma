import "dotenv/config";
import * as mariadb from "mariadb";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is not set");

// Parse database URL
const match = rawUrl.match(/mysql:\/\/([^:]+):?([^@]*)@([^:]+):(\d+)\/(\w+)/);
if (!match) throw new Error("Invalid DATABASE_URL format");
const [, user, password, host, port, database] = match;

async function cleanup() {
  console.log("🧹 Cleanup - czyszczenie uszkodzonych danych...");

  const conn = await mariadb.createConnection({
    host,
    port: parseInt(port),
    user,
    password: password || undefined,
    database,
  });

  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    
    // Clear Room-related data (which has corrupted JSON)
    await conn.query("DELETE FROM `Table`");
    console.log("  ✓ Table cleared");
    
    await conn.query("DELETE FROM Room");
    console.log("  ✓ Room cleared");
    
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    
    console.log("✅ Cleanup zakończony pomyślnie");
  } catch (e) {
    console.error("Błąd podczas cleanup:", e);
    throw e;
  } finally {
    await conn.end();
  }
}

cleanup();
