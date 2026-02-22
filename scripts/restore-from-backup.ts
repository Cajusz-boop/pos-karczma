/**
 * Restore lokalnej bazy z pliku backup (sql lub sql.gz)
 * Użycie: npx tsx scripts/restore-from-backup.ts backups/backup_2026-02-22_055849.sql.gz
 */
import "dotenv/config";
import { createReadStream } from "fs";
import { createGunzip } from "zlib";
import { createInterface } from "readline";
import mariadb from "mariadb";

const backupPath = process.argv[2];
if (!backupPath) {
  console.error("Użycie: npx tsx scripts/restore-from-backup.ts <plik.sql.gz|plik.sql>");
  process.exit(1);
}

async function main() {
  const dbUrl = process.env.DATABASE_URL?.replace(/^mysql:\/\//, "mariadb://");
  if (!dbUrl) {
    console.error("Brak DATABASE_URL w .env. Uruchom: $env:DATABASE_URL=(Get-Content .env | Where-Object {$_ -match 'DATABASE_URL'}| ForEach-Object {$_ -replace 'DATABASE_URL=','' -replace '\"',''}); npx tsx scripts/restore-from-backup.ts backups/backup_xxx.sql.gz");
    process.exit(1);
  }

  const u = new URL(dbUrl.replace("mariadb://", "http://"));
  const config = {
    host: u.hostname,
    port: u.port ? parseInt(u.port, 10) : 3306,
    user: u.username,
    password: u.password || undefined,
    database: u.pathname.replace(/^\//, ""),
  };
  console.log(`Restore do ${config.database} @ ${config.host}:${config.port}`);

  const conn = await mariadb.createConnection(config);
  const input = backupPath.endsWith(".gz")
    ? createReadStream(backupPath).pipe(createGunzip())
    : createReadStream(backupPath);

  const rl = createInterface({ input, crlfDelay: Infinity });
  let buf = "";
  let count = 0;
  let totalLines = 0;

  for await (const line of rl) {
    totalLines++;
    const trimmed = line.trim();
    if (trimmed.startsWith("--") || trimmed === "") continue;
    buf += line + "\n";
    if (trimmed.endsWith(";")) {
      try {
        await conn.query(buf);
        count++;
        if (count % 100 === 0) process.stdout.write(`\r${count} zapytań...`);
      } catch (e) {
        console.error("\nBłąd:", (e as Error).message?.slice(0, 200));
      }
      buf = "";
    }
  }
  if (buf.trim()) {
    try {
      await conn.query(buf);
      count++;
    } catch (e) {
      console.error("\nBłąd:", (e as Error).message?.slice(0, 200));
    }
  }

  await conn.end();
  console.log(`\nGotowe. Przeczytano ${totalLines} linii, wykonano ${count} zapytań.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
