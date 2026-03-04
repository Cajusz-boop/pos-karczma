/**
 * Skrypt diagnostyczny — sprawdza receptury w bazie (np. produkcja).
 * Użycie:
 *   DATABASE_URL="mysql://..." npx tsx scripts/check-receptury-prod.ts
 *   lub: npx tsx scripts/check-receptury-prod.ts  (wczytuje z .env)
 *
 * Na serwerze: cd /var/www/pos && npx tsx scripts/check-receptury-prod.ts
 */
import "dotenv/config";
import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("Brak DATABASE_URL. Ustaw w .env lub: DATABASE_URL=... npx tsx scripts/check-receptury-prod.ts");
  process.exit(1);
}
const connectionString = rawUrl.replace(/^mysql:\/\/([^:]+):@/, "mariadb://$1@");

const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Diagnostyka receptur ===\n");

  const count = await prisma.recipeDish.count();
  console.log(`1. Liczba receptur: ${count}`);

  const recipe194 = await prisma.recipeDish.findUnique({
    where: { id: 194 },
    select: { id: true, recipeNumber: true, name: true },
  });
  console.log(`\n2. Receptura id=194: ${recipe194 ? `${recipe194.name} (recipeNumber=${recipe194.recipeNumber})` : "NIE ZNALEZIONO"}`);

  const sample = await prisma.recipeDish.findMany({
    take: 15,
    orderBy: { id: "asc" },
    select: { id: true, recipeNumber: true, name: true },
  });
  console.log("\n3. Przykładowe receptury (id, recipeNumber, name):");
  for (const r of sample) {
    console.log(`   ${r.id}\t${r.recipeNumber}\t${r.name.slice(0, 50)}${r.name.length > 50 ? "…" : ""}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
