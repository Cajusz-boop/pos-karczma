/**
 * Automatyczne tworzenie pliku .env z szablonu .env.template
 * Uruchamiane przy `npm run dev` (w predev)
 */
import { existsSync, copyFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const ENV_FILE = join(ROOT, ".env");
const TEMPLATE_FILE = join(ROOT, ".env.template");

function main() {
  if (existsSync(ENV_FILE)) {
    console.log("✓ .env już istnieje");
    return;
  }

  if (!existsSync(TEMPLATE_FILE)) {
    console.error("✗ Brak pliku .env.template!");
    process.exit(1);
  }

  copyFileSync(TEMPLATE_FILE, ENV_FILE);
  console.log("✓ Utworzono .env z szablonu .env.template");
  console.log("  → Możesz edytować .env według potrzeb (nie jest commitowany do Git)");
}

main();
