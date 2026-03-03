import type { CapacitorConfig } from "@capacitor/cli";

// Tryb live server TYLKO gdy jawnie ustawiono CAPACITOR_LIVE_SERVER=1
// Domyślnie APK używa bundla z out/ — działa offline
const useLiveServer = process.env.CAPACITOR_LIVE_SERVER === "1";
const serverUrl = process.env.CAPACITOR_SERVER_URL || "https://pos.karczma-labedz.pl";

const config: CapacitorConfig = {
  appId: "pl.karczmalabedz.pos",
  appName: "POS Karczma",
  webDir: "out",
  server: useLiveServer
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http:"),
      }
    : undefined,
  android: {
    allowMixedContent: useLiveServer,
  },
  plugins: {
    // Plugin configs will go here for Stripe, NFC, etc.
  },
};

export default config;
