/**
 * Import danych receptur (produkty, receptury, składniki, tagi) do bazy.
 * Użycie: npx tsx scripts/import-receptury.ts [ścieżka-do-pliku.sql]
 * Domyślnie: scripts/receptury_import_v2.sql
 *
 * Wymaga DATABASE_URL w .env
 */
import "dotenv/config";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import mariadb from "mariadb";

const sqlPath = process.argv[2] ?? join(process.cwd(), "scripts", "receptury_import_v2.sql");

async function main() {
  const dbUrl = process.env.DATABASE_URL?.replace(/^mysql:\/\//, "mariadb://");
  if (!dbUrl) {
    console.error("Brak DATABASE_URL w .env");
    process.exit(1);
  }

  const u = new URL(dbUrl.replace("mariadb://", "http://"));
  const config = {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 3306,
    user: u.username,
    password: u.password || undefined,
    database: u.pathname.replace(/^\//, "").replace(/\?.*$/, ""),
  };

  console.log(`Import do ${config.database} @ ${config.host}:${config.port}`);
  console.log(`Plik: ${sqlPath}`);

  const conn = await mariadb.createConnection({ ...config, multipleStatements: true });
  const input = createReadStream(sqlPath);
  const rl = createInterface({ input, crlfDelay: Infinity });
  let buf = "";
  let count = 0;
  let inTmpIng = false;
  const tmpIngRows: string[] = [];
  const BATCH = 250;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") || trimmed === "") continue;

    if (trimmed.includes("CREATE TEMPORARY TABLE _tmp_ing")) continue;
    if (trimmed.includes("INSERT INTO _tmp_ing VALUES")) {
      inTmpIng = true;
      continue;
    }
    if (inTmpIng) {
      if (trimmed === ");") {
        inTmpIng = false;
        await conn.query("CREATE TEMPORARY TABLE _tmp_ing (recipeNumber INT, productName VARCHAR(200), quantity DOUBLE, unit VARCHAR(20))");
        count++;
        for (let i = 0; i < tmpIngRows.length; i += BATCH) {
          const chunk = tmpIngRows.slice(i, i + BATCH).join(", ");
          await conn.query(`INSERT INTO _tmp_ing VALUES ${chunk}`);
          count++;
          if (count % 20 === 0) process.stdout.write(`\r${count} zapytań...`);
        }
        tmpIngRows.length = 0;
        buf = "";
        continue;
      }
      const row = trimmed.replace(/,\s*$/, "");
      if (row) tmpIngRows.push(row);
      continue;
    }

    buf += line + "\n";
    if (trimmed.endsWith(";")) {
      try {
        await conn.query(buf);
        count++;
        if (count % 20 === 0) process.stdout.write(`\r${count} zapytań...`);
      } catch (e) {
        console.error("\nBłąd:", (e as Error).message?.slice(0, 250));
      }
      buf = "";
    }
  }
  if (buf.trim()) {
    try {
      await conn.query(buf);
      count++;
    } catch (e) {
      console.error("\nBłąd:", (e as Error).message?.slice(0, 250));
    }
  }

  await conn.end();
  console.log(`\nGotowe. Wykonano ${count} zapytań.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
