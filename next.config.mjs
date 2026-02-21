import { withSentryConfig } from "@sentry/nextjs";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let authDisabledFromSnapshot = "false";
try {
  const snapshotPath = join(__dirname, "prisma", "config-snapshot.json");
  if (existsSync(snapshotPath)) {
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf-8"));
    const authSetting = snapshot?.systemConfig?.find?.(
      (c) => c.key === "authDisabled"
    );
    if (authSetting?.value === true) {
      authDisabledFromSnapshot = "true";
    }
  }
} catch {
  // snapshot nie istnieje lub jest uszkodzony — ignoruj
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    AUTH_DISABLED: process.env.AUTH_DISABLED || authDisabledFromSnapshot,
  },
};

const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG ?? "",
      project: process.env.SENTRY_PROJECT ?? "",
      silent: true,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
