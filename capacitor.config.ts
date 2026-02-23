import type { CapacitorConfig } from "@capacitor/cli";

// Tryb live server TYLKO gdy jawnie ustawiono CAPACITOR_LIVE_SERVER=1
// Domyślnie APK używa bundla z out/ — działa offline
const useLiveServer = process.env.CAPACITOR_LIVE_SERVER === "1";

const config: CapacitorConfig = {
  appId: "pl.karczmalabedz.pos",
  appName: "POS Karczma",
  webDir: "out",
  server: useLiveServer
    ? {
        url: "http://10.119.169.20:3001",
        cleartext: true,
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
