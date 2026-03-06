/**
 * Naprawia DB przed prisma db push:
 * 1. RecipeStatus: SEZONOWA/TESTOWA -> AKTYWNA, enum tylko AKTYWNA, ARCHIWALNA
 * 2. Allergen: usuwa duplikat indeksu (znany bug Prisma z MySQL)
 * Uruchamiane w predev przed prisma db push.
 */
import "dotenv/config";
import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[fix-db-before-push] Brak DATABASE_URL, pomijam");
    return;
  }

  let url = databaseUrl.replace(/^["']|["']$/g, "");
  if (url.toLowerCase().startsWith("mysql://")) {
    url = "mariadb://" + url.substring(8);
  }

  const adapter = new PrismaMariaDb(url);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. RecipeStatus - tylko AKTYWNA, ARCHIWALNA
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE \`recipes\` SET \`status\` = 'AKTYWNA' WHERE \`status\` IN ('SEZONOWA', 'TESTOWA')
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`recipes\` MODIFY COLUMN \`status\` ENUM('AKTYWNA', 'ARCHIWALNA') NOT NULL DEFAULT 'AKTYWNA'
      `);
      console.log("[fix-db-before-push] ✓ RecipeStatus: AKTYWNA, ARCHIWALNA");
    } catch (e) {
      if (String(e).includes("doesn't exist")) {
        // Tabela recipes może nie istnieć (starsza baza)
      } else {
        console.warn("[fix-db-before-push] RecipeStatus:", e instanceof Error ? e.message : e);
      }
    }

    // 2. Usuń indeksy z duplikatami (znany bug Prisma z MySQL przy db push)
    const dropIndex = async (tbl: string, idx: string) => {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE \`${tbl}\` DROP INDEX \`${idx}\``);
        console.log("[fix-db-before-push] ✓ Usunięto indeks", idx);
        return true;
      } catch (e) {
        if (String(e).includes("1091") || String(e).includes("Can't DROP")) {
          return false; // index nie istnieje
        }
        console.warn("[fix-db-before-push] DROP INDEX", tbl, idx, ":", e instanceof Error ? e.message : e);
        return false;
      }
    };

    // BanquetEvent: FK używa indeksu, więc trzeba najpierw usunąć FK
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`banquetevent\` DROP FOREIGN KEY \`BanquetEvent_reservationId_fkey\``);
      await dropIndex("banquetevent", "BanquetEvent_reservationId_key");
      console.log("[fix-db-before-push] ✓ BanquetEvent reservationId (Prisma odtworzy FK i indeks)");
    } catch (e) {
      if (!String(e).includes("1091") && !String(e).includes("check that it exists")) {
        console.warn("[fix-db-before-push] BanquetEvent FK:", e instanceof Error ? e.message : e);
      }
    }

    // Tylko indeksy bez FK (bug Prisma RedefineIndex – nie można ruszać tych z FK)
    const indexFixes: [string, string][] = [
      ["allergen", "allergen_code_key"],
      ["customer", "customer_hotelGuestId_key"],
      ["customer", "customer_phone_key"],
    ];
    for (const [tbl, idx] of indexFixes) {
      await dropIndex(tbl, idx);
    }

  } catch (e) {
    console.warn("[fix-db-before-push] Ostrzeżenie:", e instanceof Error ? e.message : e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
