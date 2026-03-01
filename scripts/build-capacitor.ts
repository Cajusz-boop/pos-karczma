import { execSync } from "child_process";
import { cpSync, existsSync, rmSync, mkdirSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const API_DIR = join(__dirname, "..", "src", "app", "api");
const API_BACKUP = join(__dirname, "..", "src", "app", "_api_backup");
const E_RECEIPT_DIR = join(__dirname, "..", "src", "app", "e-receipt");
const E_RECEIPT_BACKUP = join(__dirname, "..", "src", "app", "_e_receipt_backup");

const NEXT_DIR = join(__dirname, "..", ".next");
const OUT_DIR = join(__dirname, "..", "out");
const TS_BUILDINFO = join(__dirname, "..", "tsconfig.tsbuildinfo");

console.log("🔧 Przygotowanie buildu Capacitor...\n");

function emptyDir(dir: string) {
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      rmSync(filePath, { recursive: true, force: true });
    } else {
      rmSync(filePath, { force: true });
    }
  }
}

let apiBackedUp = false;
let eReceiptBackedUp = false;
let buildFailed = false;

try {
  console.log("🧹 Czyszczenie poprzednich buildów...");
  if (existsSync(NEXT_DIR)) {
    rmSync(NEXT_DIR, { recursive: true, force: true });
  }
  if (existsSync(OUT_DIR)) {
    rmSync(OUT_DIR, { recursive: true, force: true });
  }
  if (existsSync(TS_BUILDINFO)) {
    rmSync(TS_BUILDINFO, { force: true });
  }

  if (existsSync(API_DIR)) {
    console.log("📦 Tworzenie kopii zapasowej API routes...");
    
    if (existsSync(API_BACKUP)) {
      rmSync(API_BACKUP, { recursive: true, force: true });
    }
    
    cpSync(API_DIR, API_BACKUP, { recursive: true });
    apiBackedUp = true;
    
    console.log("📦 Czyszczenie folderu API...");
    emptyDir(API_DIR);
    
    writeFileSync(join(API_DIR, ".gitkeep"), "");
  }

  if (existsSync(E_RECEIPT_DIR)) {
    console.log("📦 Tworzenie kopii zapasowej e-receipt...");
    
    if (existsSync(E_RECEIPT_BACKUP)) {
      rmSync(E_RECEIPT_BACKUP, { recursive: true, force: true });
    }
    
    cpSync(E_RECEIPT_DIR, E_RECEIPT_BACKUP, { recursive: true });
    eReceiptBackedUp = true;
    
    rmSync(E_RECEIPT_DIR, { recursive: true, force: true });
  }

  console.log("🏗️  Budowanie aplikacji...\n");
  
  execSync("next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      CAPACITOR_BUILD: "1",
    },
  });

  console.log("\n✅ Build zakończony pomyślnie!");
  
} catch (error) {
  console.error("\n❌ Build nie powiódł się:", error);
  buildFailed = true;
} finally {
  if (apiBackedUp && existsSync(API_BACKUP)) {
    console.log("📦 Przywracanie API routes...");
    
    emptyDir(API_DIR);
    cpSync(API_BACKUP, API_DIR, { recursive: true });
    rmSync(API_BACKUP, { recursive: true, force: true });
    
    console.log("✅ API routes przywrócone");
  }
  
  if (eReceiptBackedUp && existsSync(E_RECEIPT_BACKUP)) {
    console.log("📦 Przywracanie e-receipt...");
    
    cpSync(E_RECEIPT_BACKUP, E_RECEIPT_DIR, { recursive: true });
    rmSync(E_RECEIPT_BACKUP, { recursive: true, force: true });
    
    console.log("✅ E-receipt przywrócony");
  }
}

if (buildFailed) {
  process.exit(1);
}

console.log("\n📱 Teraz uruchom:");
console.log("   npx cap copy android");
console.log("   npx cap open android");
