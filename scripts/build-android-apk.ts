/**
 * Buduje APK do instalacji na Androida.
 * Wymaga: Android SDK (ANDROID_HOME), Java 17+
 * 
 * Uruchom: npx tsx scripts/build-android-apk.ts
 * Lub: npm run android:apk
 */
import { execSync } from "child_process";
import { join } from "path";
import { existsSync } from "fs";

const root = join(__dirname, "..");
const androidDir = join(root, "android");
const isWin = process.platform === "win32";
const gradlew = isWin ? "gradlew.bat" : "./gradlew";

function run(cmd: string, cwd: string, env?: Record<string, string>) {
  execSync(cmd, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

console.log("📱 Budowanie APK dla Androida...\n");

// 1. Build Capacitor (Next.js export + cap copy/sync)
console.log("1/2 Budowanie aplikacji i kopiowanie do projektu Android...");
run("npx tsx scripts/build-capacitor.ts", root, { CAPACITOR_BUILD: "1" });

// 2. Gradle assembleDebug
console.log("\n2/2 Kompilowanie APK (Gradle)...");
if (!existsSync(join(androidDir, "gradlew"))) {
  console.error("❌ Brak android/gradlew. Uruchom: npx cap add android");
  process.exit(1);
}

run(`${gradlew} assembleDebug`, androidDir);

const apkPath = join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
console.log("\n✅ APK gotowe!");
console.log(`   Plik: ${apkPath}`);
console.log("\n   Instalacja na telefonie:");
console.log("   - Skopiuj app-debug.apk na telefon (USB/email/cloud)");
console.log("   - Otwórz plik na telefonie i zainstaluj (zezwól na instalację z nieznanych źródeł)");
console.log("\n   Lub przez ADB: adb install app-debug.apk");
