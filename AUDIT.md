# AUDIT.md — POS Karczma Łabędź

Audyt kodu projektu dla implementacji offline-first z Dexie.js, Capacitor i SoftPOS.

---

## SEKCJA 1: Struktura projektu

```
src\__tests__\globalSetup.ts
src\__tests__\helpers\auth.ts
src\__tests__\MOBILE-offline-sync.test.ts
src\__tests__\MOBILE-performance.test.ts
src\__tests__\MOBILE-waiter-flow.test.ts
src\__tests__\SC-01-login-shift.test.ts
src\__tests__\SC-02-open-order.test.ts
src\__tests__\SC-03-add-products.test.ts
src\__tests__\SC-04-kitchen.test.ts
src\__tests__\SC-05-move-split.test.ts
src\__tests__\SC-06-discounts.test.ts
src\__tests__\SC-07-payments.test.ts
src\__tests__\SC-08-close-receipt.test.ts
src\__tests__\SC-09-e2e-complex.test.ts
src\__tests__\SC-10-negative.test.ts
src\__tests__\T11-T20-advanced-tests.test.ts
src\__tests__\T1-auth-login.test.ts
src\__tests__\T21-T40-system-tests.test.ts
src\__tests__\T2-full-order-flow.test.ts
src\__tests__\T3-kds-flow.test.ts
src\__tests__\T41-T70-extended-tests.test.ts
src\__tests__\T4-T10-core-tests.test.ts
src\app\(auth)\login\LoginClient.tsx
src\app\(auth)\login\page.tsx
src\app\(dashboard)\banquets\page.tsx
src\app\(dashboard)\board\page.tsx
src\app\(dashboard)\day-close\page.tsx
src\app\(dashboard)\delivery\page.tsx
src\app\(dashboard)\help\page.tsx
src\app\(dashboard)\invoices\page.tsx
src\app\(dashboard)\kds\archive\page.tsx
src\app\(dashboard)\kitchen\86-board\page.tsx
src\app\(dashboard)\kitchen\breakfast\page.tsx
src\app\(dashboard)\kitchen\page.tsx
src\app\(dashboard)\layout.tsx
src\app\(dashboard)\manager\page.tsx
src\app\(dashboard)\orders\OrdersPageClient.tsx
src\app\(dashboard)\orders\page.tsx
src\app\(dashboard)\pos\delivery\page.tsx
src\app\(dashboard)\pos\order\[orderId]\OrderPageClient.tsx
src\app\(dashboard)\pos\order\[orderId]\orderPageTypes.ts
src\app\(dashboard)\pos\order\[orderId]\OrderPageView.tsx
src\app\(dashboard)\pos\order\[orderId]\page.tsx
src\app\(dashboard)\pos\order\[orderId]\PaymentDialog.tsx
src\app\(dashboard)\pos\page.tsx
src\app\(dashboard)\pos\PosPageClient.tsx
src\app\(dashboard)\products\page.tsx
src\app\(dashboard)\reports\export\page.tsx
src\app\(dashboard)\reports\extended\page.tsx
src\app\(dashboard)\reports\food-cost\page.tsx
src\app\(dashboard)\reports\menu-engineering\page.tsx
src\app\(dashboard)\reports\page.tsx
src\app\(dashboard)\reports\ReportsPageClient.tsx
src\app\(dashboard)\reports\tips\page.tsx
src\app\(dashboard)\reservations\page.tsx
src\app\(dashboard)\reservations\ReservationsPageClient.tsx
src\app\(dashboard)\settings\card-readers\page.tsx
src\app\(dashboard)\settings\categories\page.tsx
src\app\(dashboard)\settings\delivery\page.tsx
src\app\(dashboard)\settings\displays\page.tsx
src\app\(dashboard)\settings\kds\page.tsx
src\app\(dashboard)\settings\loyalty\page.tsx
src\app\(dashboard)\settings\menu-import\page.tsx
src\app\(dashboard)\settings\modifiers\page.tsx
src\app\(dashboard)\settings\page.tsx
src\app\(dashboard)\settings\printers\[id]\templates\page.tsx
src\app\(dashboard)\settings\printers\page.tsx
src\app\(dashboard)\settings\rooms\page.tsx
src\app\(dashboard)\settings\schedule\page.tsx
src\app\(dashboard)\settings\sets\page.tsx
src\app\(dashboard)\settings\SettingsPageClient.tsx
src\app\(dashboard)\settings\table-layout\page.tsx
src\app\(dashboard)\settings\tax-rates\page.tsx
src\app\(dashboard)\settings\terminal\page.tsx
src\app\(dashboard)\settings\tools\page.tsx
src\app\(dashboard)\settings\training\page.tsx
src\app\(dashboard)\settings\users\[id]\permissions\page.tsx
src\app\(dashboard)\settings\vouchers\page.tsx
src\app\(dashboard)\setup\page.tsx
src\app\(dashboard)\time-tracking\page.tsx
src\app\(dashboard)\time-tracking\TimeTrackingClient.tsx
src\app\(dashboard)\users\page.tsx
src\app\(dashboard)\warehouse\page.tsx
src\app\api\announcements\route.ts
src\app\api\auth\login\route.ts
src\app\api\auth\select-user\route.ts
src\app\api\auth\token\route.ts
src\app\api\auth\token-login\route.ts
src\app\api\auth\users\route.ts
src\app\api\backup\route.ts
src\app\api\banquets\[id]\order\route.ts
src\app\api\banquets\[id]\route.ts
src\app\api\banquets\[id]\start\route.ts
src\app\api\banquets\menus\[id]\route.ts
src\app\api\banquets\menus\route.ts
src\app\api\banquets\route.ts
src\app\api\card-readers\route.ts
src\app\api\cash\current\route.ts
src\app\api\cash-drawer\route.ts
src\app\api\categories\route.ts
src\app\api\config\route.ts
src\app\api\cron\no-shows\route.ts
src\app\api\currency\route.ts
src\app\api\customer-display\[id]\orders\route.ts
src\app\api\customer-display\route.ts
src\app\api\customers\[phone]\route.ts
src\app\api\customers\route.ts
src\app\api\day-close\route.ts
src\app\api\delivery\assign\route.ts
src\app\api\delivery\drivers\route.ts
src\app\api\delivery\settlements\route.ts
src\app\api\delivery\streets\route.ts
src\app\api\delivery\zones\route.ts
src\app\api\e-receipt\[token]\route.ts
src\app\api\e-receipt\send-sms\route.ts
src\app\api\export\route.ts
src\app\api\fiscal\config\route.ts
src\app\api\fiscal\period-report\route.ts
src\app\api\fiscal\route.ts
src\app\api\gdpr\route.ts
src\app\api\health\route.ts
src\app\api\hotel\breakfast\route.ts
src\app\api\hotel\charge\route.ts
src\app\api\hotel\rooms\route.ts
src\app\api\hotel\route.ts
src\app\api\invoices\[id]\correction\route.ts
src\app\api\invoices\[id]\route.ts
src\app\api\invoices\advance\route.ts
src\app\api\invoices\route.ts
src\app\api\jpk\route.ts
src\app\api\kds\[stationId]\orders\route.ts
src\app\api\kds\[stationId]\stream\route.ts
src\app\api\kds\archive\route.ts
src\app\api\kds\config\route.ts
src\app\api\kds\messages\[id]\read\route.ts
src\app\api\kds\messages\route.ts
src\app\api\kds\stations\[id]\config\route.ts
src\app\api\kds\stations\route.ts
src\app\api\kitchen\auto-norms\route.ts
src\app\api\kitchen\load\route.ts
src\app\api\kitchen\metrics\route.ts
src\app\api\kitchen\prediction\route.ts
src\app\api\ksef\retry-queue\route.ts
src\app\api\ksef\route.ts
src\app\api\ksef\status\route.ts
src\app\api\loyalty\rewards\route.ts
src\app\api\loyalty\route.ts
src\app\api\manager\cleanup-orders\route.ts
src\app\api\manager\config-backup\route.ts
src\app\api\manager\fiscalize-batch\route.ts
src\app\api\manager\order-counter\route.ts
src\app\api\modifiers\route.ts
src\app\api\notifications\route.ts
src\app\api\orders\[id]\add-helper-set\route.ts
src\app\api\orders\[id]\cancel\route.ts
src\app\api\orders\[id]\close\route.ts
src\app\api\orders\[id]\copy\route.ts
src\app\api\orders\[id]\course-delay\route.ts
src\app\api\orders\[id]\courses\route.ts
src\app\api\orders\[id]\discount\validate\route.ts
src\app\api\orders\[id]\guests\route.ts
src\app\api\orders\[id]\items\[itemId]\cancel\route.ts
src\app\api\orders\[id]\items\[itemId]\components\route.ts
src\app\api\orders\[id]\items\[itemId]\delay\route.ts
src\app\api\orders\[id]\items\[itemId]\fire\route.ts
src\app\api\orders\[id]\items\[itemId]\note\route.ts
src\app\api\orders\[id]\items\[itemId]\status\route.ts
src\app\api\orders\[id]\items\[itemId]\subtract\route.ts
src\app\api\orders\[id]\items\[itemId]\swap-component\route.ts
src\app\api\orders\[id]\items\[itemId]\takeaway\route.ts
src\app\api\orders\[id]\items\[itemId]\weight\route.ts
src\app\api\orders\[id]\limit\route.ts
src\app\api\orders\[id]\merge-items\route.ts
src\app\api\orders\[id]\move\route.ts
src\app\api\orders\[id]\release-course\route.ts
src\app\api\orders\[id]\reorder-items\route.ts
src\app\api\orders\[id]\route.ts
src\app\api\orders\[id]\send\route.ts
src\app\api\orders\[id]\split\route.ts
src\app\api\orders\[id]\split-bill\route.ts
src\app\api\orders\delivery\route.ts
src\app\api\orders\merge\route.ts
src\app\api\orders\route.ts
src\app\api\orders\weight-scan\route.ts
src\app\api\payment\polcard-callback\route.ts
src\app\api\payment\polcard-status\route.ts
src\app\api\payment\terminal\route.ts
src\app\api\payments\route.ts
src\app\api\payment-terminal\route.ts
src\app\api\ping\route.ts
src\app\api\pos\alerts\route.ts
src\app\api\pos\floor\route.ts
src\app\api\pos\floor\stream\route.ts
src\app\api\print\kitchen\route.ts
src\app\api\printers\[id]\categories\route.ts
src\app\api\printers\[id]\logs\route.ts
src\app\api\printers\[id]\print\route.ts
src\app\api\printers\[id]\route.ts
src\app\api\printers\[id]\templates\route.ts
src\app\api\printers\[id]\test\route.ts
src\app\api\printers\route.ts
src\app\api\products\[id]\components\route.ts
src\app\api\products\[id]\copy\route.ts
src\app\api\products\[id]\image\route.ts
src\app\api\products\[id]\route.ts
src\app\api\products\86\route.ts
src\app\api\products\defaults\route.ts
src\app\api\products\export\route.ts
src\app\api\products\import\route.ts
src\app\api\products\popular\route.ts
src\app\api\products\quick-entry\route.ts
src\app\api\products\route.ts
src\app\api\products\search\route.ts
src\app\api\promotions\active\route.ts
src\app\api\push\route.ts
src\app\api\refunds\route.ts
src\app\api\reports\audit\route.ts
src\app\api\reports\banquets\route.ts
src\app\api\reports\bottleneck\route.ts
src\app\api\reports\daily\route.ts
src\app\api\reports\delivery\route.ts
src\app\api\reports\export\route.ts
src\app\api\reports\food-cost\route.ts
src\app\api\reports\kitchen\route.ts
src\app\api\reports\menu-engineering\route.ts
src\app\api\reports\products\route.ts
src\app\api\reports\route.ts
src\app\api\reports\shift\route.ts
src\app\api\reports\shift-extended\route.ts
src\app\api\reports\tables\route.ts
src\app\api\reports\vat\route.ts
src\app\api\reports\warehouse\route.ts
src\app\api\reports\waste\route.ts
src\app\api\reservations\[id]\route.ts
src\app\api\reservations\online\route.ts
src\app\api\reservations\route.ts
src\app\api\roles\route.ts
src\app\api\rooms\[id]\background\route.ts
src\app\api\rooms\[id]\route.ts
src\app\api\rooms\route.ts
src\app\api\scale\route.ts
src\app\api\schedule\availability\route.ts
src\app\api\schedule\route.ts
src\app\api\schedule\swap\route.ts
src\app\api\settings\global-options\route.ts
src\app\api\settings\route.ts
src\app\api\settings\table-colors\route.ts
src\app\api\shifts\[id]\route.ts
src\app\api\shifts\route.ts
src\app\api\suggestions\route.ts
src\app\api\super-groups\route.ts
src\app\api\system-config\route.ts
src\app\api\tables\[id]\layout\route.ts
src\app\api\tax-rates\route.ts
src\app\api\time-tracking\route.ts
src\app\api\tips\route.ts
src\app\api\tools\scanner\reports\route.ts
src\app\api\tools\scanner\route.ts
src\app\api\tools\sync-menu\route.ts
src\app\api\training\route.ts
src\app\api\users\[id]\macros\route.ts
src\app\api\users\[id]\permissions\route.ts
src\app\api\users\[id]\pos-preferences\favorites\route.ts
src\app\api\users\[id]\pos-preferences\route.ts
src\app\api\users\[id]\route.ts
src\app\api\users\export\route.ts
src\app\api\users\import\route.ts
src\app\api\users\route.ts
src\app\api\vouchers\redeem\route.ts
src\app\api\vouchers\route.ts
src\app\api\warehouse\[id]\route.ts
src\app\api\warehouse\ingredients\[id]\route.ts
src\app\api\warehouse\ingredients\route.ts
src\app\api\warehouse\inventory\route.ts
src\app\api\warehouse\order-list\route.ts
src\app\api\warehouse\recipes\route.ts
src\app\api\warehouse\route.ts
src\app\api\warehouse\shopping-list\route.ts
src\app\api\warehouse\stock-items\[id]\route.ts
src\app\api\warehouse\stock-moves\route.ts
src\app\api\workstations\route.ts
src\app\display\[id]\page.tsx
src\app\e-receipt\[token]\page.tsx
src\app\e-receipt\not-found.tsx
src\app\global-error.tsx
src\app\layout.tsx
src\app\page.tsx
src\components\ConnectionMonitor.tsx
src\components\layout\DashboardShell.tsx
src\components\OfflineIndicator.tsx
src\components\pos\AllergenFilter.tsx
src\components\pos\SuggestionPopup.tsx
src\components\pos\VirtualizedProductGrid.tsx
src\components\providers\QueryProvider.tsx
src\components\providers\ServiceWorkerRegister.tsx
src\components\TrainingModeBanner.tsx
src\components\ui\button.tsx
src\components\ui\card.tsx
src\components\ui\dialog.tsx
src\components\ui\input.tsx
src\components\ui\label.tsx
src\components\ui\optimized-image.tsx
src\lib\api-response.ts
src\lib\audit.ts
src\lib\auth.ts
src\lib\config-snapshot.ts
src\lib\e-receipt\generator.ts
src\lib\e-receipt\qr.ts
src\lib\errors.ts
src\lib\export\excel.ts
src\lib\fetch-with-timeout.ts
src\lib\fiscal\index.ts
src\lib\fiscal\posnet-driver.ts
src\lib\fiscal\types.ts
src\lib\hooks\useFloorStream.ts
src\lib\hooks\useKdsStream.ts
src\lib\hooks\usePolcardGo.ts
src\lib\hooks\usePosKeyboard.ts
src\lib\hooks\useTokenReader.ts
src\lib\hooks\useWebNfc.ts
src\lib\hotel\client.ts
src\lib\hotel\sync.ts
src\lib\invoice-number.ts
src\lib\jpk\jpk-v7m.ts
src\lib\jwt.ts
src\lib\kitchen\auto-norms.ts
src\lib\kitchen\load-prediction.ts
src\lib\ksef\client.ts
src\lib\ksef\config.ts
src\lib\ksef\index.ts
src\lib\lazy.ts
src\lib\offline\sync.ts
src\lib\payment-terminal\client.ts
src\lib\payment-terminal\index.ts
src\lib\payment-terminal\types.ts
src\lib\pos\order-cache.ts
src\lib\print\kitchen.ts
src\lib\printer\escpos.ts
src\lib\printer\print-service.ts
src\lib\prisma.ts
src\lib\push\web-push.ts
src\lib\rate-limit.ts
src\lib\redis.ts
src\lib\reservations\no-show.ts
src\lib\scale\scale-service.ts
src\lib\sms\client.ts
src\lib\stock-move-number.ts
src\lib\utils.ts
src\lib\validation.ts
src\lib\warehouse\auto-consume.ts
src\middleware.ts
src\store\useAuthStore.ts
src\store\useOfflineStore.ts
src\store\useOrderStore.ts
src\store\usePosStore.ts
src\types\index.ts
```

---

## SEKCJA 2: package.json

```json
{
  "name": "pos-karczma",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "predev": "npx tsx scripts/setup-env.ts && prisma generate && prisma db push && npx tsx scripts/sync-config-on-start.ts",
    "dev": "next dev",
    "dev:turbo": "next dev --turbo",
    "build": "next build",
    "build:analyze": "ANALYZE=true next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "npx prisma db seed",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:config:export": "npx tsx prisma/config-export.ts",
    "db:config:import": "npx tsx prisma/config-import.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@next/bundle-analyzer": "^16.1.6",
    "@prisma/adapter-mariadb": "^7.4.0",
    "@prisma/client": "^7.4.0",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-slot": "^1.2.4",
    "@sentry/nextjs": "^10.39.0",
    "@tanstack/react-query": "^5.90.21",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "exceljs": "^4.4.0",
    "ioredis": "^5.9.3",
    "jose": "^6.1.3",
    "jszip": "^3.10.1",
    "lucide-react": "^0.563.0",
    "mariadb": "^3.4.5",
    "next": "14.2.35",
    "qrcode": "^1.5.4",
    "react": "^18",
    "react-dom": "^18",
    "react-window": "^2.2.7",
    "react-window-infinite-loader": "^2.0.1",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "web-push": "^3.6.7",
    "zod": "^4.3.6",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/qrcode": "^1.5.6",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/react-window": "^1.8.8",
    "@vitejs/plugin-react": "^5.1.4",
    "dotenv": "^17.3.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "postcss": "^8",
    "prisma": "^7.4.0",
    "sharp": "^0.34.5",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.21.0",
    "typescript": "^5",
    "vitest": "^4.0.18"
  }
}
```

---

## SEKCJA 3: next.config.mjs

```javascript
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
  eslint: {
    ignoreDuringBuilds: true,
  },
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
```

---

## SEKCJA 4: Schemat bazy danych (prisma/schema.prisma)

Schemat Prisma jest bardzo obszerny (~1500 linii). Kluczowe modele:

### Modele główne dla offline-first:
- **User** (l.18-53) — użytkownicy, role, uprawnienia
- **Room** (l.103-122) — sale restauracyjne
- **Table** (l.140-166) — stoliki
- **Category** (l.187-208) — kategorie produktów
- **Product** (l.210-266) — produkty z modyfikatorami
- **TaxRate** (l.312-321) — stawki VAT
- **Order** (l.374-423) — zamówienia
- **OrderItem** (l.453-505) — pozycje zamówień
- **Payment** (l.527-541) — płatności
- **Receipt** (l.638-653) — paragony/e-paragony

### Modele wspierające:
- **ModifierGroup** / **Modifier** — modyfikatory produktów
- **KDSStation** — stacje Kitchen Display System
- **Printer** — drukarki (fiskalne, kuchenne)
- **Reservation** / **BanquetEvent** — rezerwacje i bankiety
- **Shift** / **CashDrawer** — zmiany i kasa

Pełny schemat w pliku: `prisma/schema.prisma`

---

## SEKCJA 5: Service Worker (public/sw.js)

```javascript
const CACHE_NAME = "pos-karczma-v4";
const STATIC_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
];
const API_PRECACHE = [
  "/api/products",
  "/api/categories",
];

const BACKGROUND_SYNC_TAG = "pos-offline-sync";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(STATIC_ASSETS);
      for (const url of API_PRECACHE) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch (e) {
          console.warn(`[SW] Failed to precache ${url}:`, e);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Background Sync ─────────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  const clients = await self.clients.matchAll({ type: "window" });
  
  for (const client of clients) {
    client.postMessage({ type: "SYNC_REQUESTED" });
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "REGISTER_SYNC") {
    if ("sync" in self.registration) {
      self.registration.sync.register(BACKGROUND_SYNC_TAG).catch(() => {
        // Background sync not supported
      });
    }
  }
  
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Push Notifications ─────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "POS Karczma", body: event.data.text() };
  }

  const options = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: payload.data?.type ?? "default",
    renotify: true,
    data: payload.data ?? {},
    actions: [],
  };

  // Add actions based on notification type
  if (payload.data?.type === "ORDER_READY") {
    options.actions = [
      { action: "open", title: "Otwórz zamówienie" },
      { action: "dismiss", title: "OK" },
    ];
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "POS Karczma", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data ?? {};

  if (event.action === "dismiss") return;

  // Navigate to the relevant page
  let url = "/pos";
  if (data.orderId) {
    url = `/pos/order/${data.orderId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes("/pos") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

// ─── Fetch (Caching) ────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API requests: network-first with offline fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests (HTML pages): ALWAYS network-first
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Immutable hashed assets (_next/static): cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Other static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
```

---

## SEKCJA 6: State Management (Zustand Stores)

### src/store/useAuthStore.ts

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  isOwner: boolean;
}

interface AuthState {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    { name: "pos-karczma-auth" }
  )
);
```

### src/store/useOrderStore.ts

```typescript
import { create } from "zustand";

export interface OrderItemLine {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRateId: string;
  modifiersJson?: Array<{ modifierId: string; name: string; priceDelta: number }>;
  note?: string;
  courseNumber: number;
  status: "ORDERED" | "SENT" | "CANCELLED";
}

interface OrderState {
  orderId: string | null;
  orderNumber: number | null;
  tableNumber: number | null;
  items: OrderItemLine[];
  setOrder: (orderId: string, orderNumber: number, tableNumber: number | null, items: OrderItemLine[]) => void;
  addItem: (item: Omit<OrderItemLine, "status"> & { status?: OrderItemLine["status"] }) => void;
  updateQuantity: (index: number, delta: number) => void;
  updateNote: (index: number, note: string) => void;
  removeItem: (index: number) => void;
  clearOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orderId: null,
  orderNumber: null,
  tableNumber: null,
  items: [],

  setOrder: (orderId, orderNumber, tableNumber, items) =>
    set({ orderId, orderNumber, tableNumber, items }),

  addItem: (item) =>
    set((s) => ({
      items: [
        ...s.items,
        {
          ...item,
          status: (item.status ?? "ORDERED") as OrderItemLine["status"],
        },
      ],
    })),

  updateQuantity: (index, delta) =>
    set((s) => {
      const items = [...s.items];
      const line = items[index];
      if (!line || line.status === "SENT") return s;
      const q = Math.max(0, line.quantity + delta);
      if (q === 0) {
        items.splice(index, 1);
        return { items };
      }
      items[index] = { ...line, quantity: q };
      return { items };
    }),

  updateNote: (index, note) =>
    set((s) => {
      const items = [...s.items];
      if (items[index]?.status === "SENT") return s;
      items[index] = { ...items[index]!, note };
      return { items };
    }),

  removeItem: (index) =>
    set((s) => {
      const items = [...s.items];
      if (items[index]?.status === "SENT") return s;
      items.splice(index, 1);
      return { items };
    }),

  clearOrder: () =>
    set({ orderId: null, orderNumber: null, tableNumber: null, items: [] }),
}));
```

### src/store/useOfflineStore.ts

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OfflineActionType =
  | "CREATE_ORDER"
  | "SEND_ORDER"
  | "ADD_PAYMENT"
  | "CLOSE_ORDER"
  | "CANCEL_ITEM"
  | "CASH_OPERATION"
  | "UPDATE_ORDER_ITEM"
  | "ADD_DISCOUNT"
  | "REMOVE_DISCOUNT"
  | "UPDATE_GUEST_COUNT"
  | "SPLIT_ORDER"
  | "MERGE_ORDER"
  | "TRANSFER_TABLE"
  | "RELEASE_COURSE"
  | "RECALL_ITEM"
  | "ADD_TIP"
  | "PRINT_RECEIPT"
  | "REQUEST_BILL";

export type ActionPriority = "critical" | "high" | "normal" | "low";

export interface PendingAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
  lastError?: string;
  priority: ActionPriority;
  expiresAt?: string;
}

interface OfflineState {
  isOnline: boolean;
  pendingActions: PendingAction[];
  lastSyncAt: string | null;
  syncInProgress: boolean;
  failedPermanently: PendingAction[];

  setOnline: (online: boolean) => void;
  addPendingAction: (action: Omit<PendingAction, "id" | "createdAt" | "retryCount">) => void;
  removePendingAction: (id: string) => void;
  updatePendingAction: (id: string, updates: Partial<PendingAction>) => void;
  clearPendingActions: () => void;
  setLastSyncAt: (date: string) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  markAsFailed: (action: PendingAction) => void;
  clearFailedActions: () => void;
  getPendingCount: () => number;
  getActionsByType: (type: OfflineActionType) => PendingAction[];
}

// ... implementation (183 lines total)

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingActions: [],
      lastSyncAt: null,
      syncInProgress: false,
      failedPermanently: [],

      setOnline: (online) => set({ isOnline: online }),

      addPendingAction: (action) =>
        set((state) => {
          const newAction: PendingAction = {
            ...action,
            id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            retryCount: 0,
            priority: action.priority ?? getDefaultPriority(action.type),
          };
          
          const updatedActions = sortByPriority([...state.pendingActions, newAction]);
          
          return { pendingActions: updatedActions };
        }),

      // ... remaining actions
    }),
    {
      name: "pos-karczma-offline",
      version: 2,
    }
  )
);
```

### src/store/usePosStore.ts

```typescript
import { create } from "zustand";

interface PosState {
  currentShiftId: string | null;
  activeTableIds: string[];
  setCurrentShiftId: (id: string | null) => void;
  setActiveTableIds: (ids: string[]) => void;
}

export const usePosStore = create<PosState>((set) => ({
  currentShiftId: null,
  activeTableIds: [],
  setCurrentShiftId: (id) => set({ currentShiftId: id }),
  setActiveTableIds: (ids) => set({ activeTableIds: ids }),
}));
```

---

## SEKCJA 7: Providers

### src/components/providers/QueryProvider.tsx

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const CACHE_KEY = "pos-karczma-query-cache";
const CACHE_VERSION = 1;
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry {
  version: number;
  timestamp: number;
  data: Record<string, unknown>;
}

function loadCache(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    if (Date.now() - entry.timestamp > CACHE_MAX_AGE) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return entry.data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCache(client: QueryClient): void {
  if (typeof window === "undefined") return;
  
  try {
    const cache = client.getQueryCache();
    const queries = cache.getAll();
    
    const persistableQueries = queries
      .filter((query) => {
        const queryKey = query.queryKey;
        if (!Array.isArray(queryKey) || queryKey.length === 0) return false;
        const key = queryKey[0];
        return ["products", "categories", "rooms", "tables", "modifiers"].includes(key as string);
      })
      .reduce((acc, query) => {
        const key = JSON.stringify(query.queryKey);
        if (query.state.data !== undefined) {
          acc[key] = {
            data: query.state.data,
            dataUpdatedAt: query.state.dataUpdatedAt,
          };
        }
        return acc;
      }, {} as Record<string, unknown>);
    
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data: persistableQueries,
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            gcTime: 1000 * 60 * 30,
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );
  
  useEffect(() => {
    const cachedData = loadCache();
    if (cachedData) {
      restoreCache(client, cachedData);
    }
    
    const saveInterval = setInterval(() => {
      saveCache(client);
    }, 30000);
    
    const handleBeforeUnload = () => {
      saveCache(client);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveCache(client);
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      saveCache(client);
    };
  }, [client]);
  
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
```

### src/components/providers/ServiceWorkerRegister.tsx

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { syncPendingActions } from "@/lib/offline/sync";
import { useOfflineStore } from "@/store/useOfflineStore";

interface SWStatus {
  registered: boolean;
  error: string | null;
  updateAvailable: boolean;
}

export function ServiceWorkerRegister() {
  const [status, setStatus] = useState<SWStatus>({
    registered: false,
    error: null,
    updateAvailable: false,
  });
  
  const pendingCount = useOfflineStore((s) => s.pendingActions.length);

  const handleSWMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === "SYNC_REQUESTED") {
      syncPendingActions();
    }
  }, []);

  const requestBackgroundSync = useCallback(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "REGISTER_SYNC" });
    }
  }, []);

  useEffect(() => {
    if (pendingCount > 0) {
      requestBackgroundSync();
    }
  }, [pendingCount, requestBackgroundSync]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setStatus((s) => ({ ...s, error: "Service Worker nie jest wspierany" }));
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker.addEventListener("message", handleSWMessage);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        registration = reg;
        setStatus((s) => ({ ...s, registered: true }));

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setStatus((s) => ({ ...s, updateAvailable: true }));
              }
            });
          }
        });
      })
      .catch((err) => {
        console.error("[SW] Registration failed:", err);
        setStatus((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Błąd rejestracji SW",
        }));
      });

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSWMessage);
    };
  }, [handleSWMessage]);

  // ... render logic for update banner
}
```

---

## SEKCJA 8: Hooki (src/lib/hooks/)

### src/lib/hooks/useFloorStream.ts

Hook SSE (Server-Sent Events) dla real-time aktualizacji mapy stolików:

```typescript
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Types for table/room view...

interface UseFloorStreamOptions {
  enabled?: boolean;
  fallbackPollingMs?: number;
}

interface UseFloorStreamResult {
  rooms: RoomView[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export function useFloorStream(options: UseFloorStreamOptions = {}): UseFloorStreamResult {
  // SSE connection with automatic reconnect
  // Falls back to polling if SSE fails 3 times
  // 258 lines total
}
```

### src/lib/hooks/useKdsStream.ts

Hook SSE dla Kitchen Display System — podobna struktura do useFloorStream.

### src/lib/hooks/usePolcardGo.ts

Hook do integracji z PolCard Go SoftPOS:

```typescript
export function usePolcardGo(options: {
  onSuccess: (result: { id: string; transactionRef?: string }) => void;
  onError: (error: string) => void;
}) {
  // Initiates payment via Android Intent
  // Polls for payment status
  // Returns: initiatePayment, cancelPayment, isProcessing, status, error, isPolcardAvailable
}
```

### src/lib/hooks/usePosKeyboard.ts

Obsługa klawiatury numerycznej i skrótów klawiszowych w POS.

### src/lib/hooks/useTokenReader.ts

Obsługa czytników kart/tokenów NFC/barcode.

### src/lib/hooks/useWebNfc.ts

Obsługa Web NFC API dla odczytu tagów NFC.

---

## SEKCJA 9: API Routes — Zamówienia

### src/app/api/orders/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createOrderSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  // List orders with status filter
  // Returns: id, orderNumber, tableNumber, tableName, waiterName, status, total, createdAt
}

export async function POST(request: NextRequest) {
  // Create new order
  // Handles: tableId, roomId, userId, guestCount, type
  // Updates table status to OCCUPIED
  // Returns: { order: { id, orderNumber, type } }
}
```

### src/app/api/orders/[id]/route.ts

```typescript
export async function GET(request, { params }) {
  // Get single order with items
  // Returns: full order data with items, products, tax rates
}

export async function PATCH(request, { params }) {
  // Update order (discount, note, etc.)
}
```

### src/app/api/orders/[id]/send/route.ts

```typescript
export async function POST(request, { params }) {
  // Send order to kitchen
  // Updates items status to SENT
  // Updates order status to SENT_TO_KITCHEN
  // Triggers kitchen print
}
```

### src/app/api/orders/[id]/close/route.ts

```typescript
export async function POST(request, { params }) {
  // Close order
  // Validates payments cover total
  // Prints fiscal receipt (Posnet driver)
  // Generates e-receipt HTML
  // Updates order status to CLOSED
  // Frees table
  // Auto-consumes stock
}
```

### Pozostałe API routes dla zamówień:
- `/api/orders/[id]/cancel` — anulowanie zamówienia
- `/api/orders/[id]/move` — przeniesienie do innego stolika
- `/api/orders/[id]/split` — podział rachunku
- `/api/orders/[id]/split-bill` — podział na osoby
- `/api/orders/[id]/items/[itemId]/cancel` — storno pozycji
- `/api/orders/[id]/items/[itemId]/status` — zmiana statusu pozycji
- `/api/orders/[id]/release-course` — zwolnienie kursu (bankiet)
- `/api/orders/merge` — łączenie zamówień

---

## SEKCJA 10: API Routes — Produkty i Kategorie

### src/app/api/products/route.ts

```typescript
export async function GET(request: NextRequest) {
  // Returns products with categories, modifiers, allergens
  // Uses Redis cache (TTL 120s)
  // Supports ?all=true (include inactive) and ?minimal=true
}

export async function POST(request: NextRequest) {
  // Create new product
  // Invalidates cache
  // Auto-exports config snapshot
}
```

### src/app/api/categories/route.ts

```typescript
export async function GET() {
  // List all categories with product count
  // Redis cache (TTL 120s)
}

export async function POST(request: NextRequest) {
  // Create category
}

export async function PATCH(request: NextRequest) {
  // Update category or reorder
}

export async function DELETE(request: NextRequest) {
  // Delete category (only if no products/children)
}
```

---

## SEKCJA 11: API Routes — Płatności

### src/app/api/payments/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createPaymentSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  // Register payments for order
  // Validates: orderId, payments[], tipAmount, tipUserId
  // Payment methods: CASH, CARD, BLIK, TRANSFER, VOUCHER, ROOM_CHARGE
  // Creates Payment records
  // Creates Tip record if tipAmount > 0
}
```

### Powiązane endpointy płatności:
- `/api/payment/terminal` — integracja z terminalem płatniczym
- `/api/payment/polcard-callback` — callback PolCard Go
- `/api/payment/polcard-status` — status płatności PolCard
- `/api/vouchers/redeem` — realizacja vouchera

---

## SEKCJA 12: API Routes — KDS (Kitchen Display System)

### src/app/api/kds/[stationId]/orders/route.ts

```typescript
export async function GET(request, { params }) {
  // Returns active orders for KDS station
  // Filters by station's assigned categories
  // Includes: orderId, orderNumber, tableNumber, items with status
  // Calculates urgency (elapsed vs estimated time)
  // Returns: { active: [...], served: [...] }
}
```

### Pozostałe KDS routes:
- `/api/kds/[stationId]/stream` — SSE stream dla real-time updates
- `/api/kds/stations` — lista/tworzenie stacji KDS
- `/api/kds/messages` — wiadomości kelner ↔ kuchnia
- `/api/kds/archive` — archiwum zamówień

---

## SEKCJA 13: Główne strony POS

### src/app/(dashboard)/pos/PosPageClient.tsx (886 linii)

Główny komponent mapy stolików:
- Real-time aktualizacje via SSE (useFloorStream)
- Fallback na polling jeśli SSE niedostępne
- Alert bar dla powiadomień kuchni
- TableCard z context menu (rachunek, przenieś, otwórz)
- Dialog wyboru liczby gości
- Quick actions: Na wynos, Szybki paragon, Kuchnia

### src/app/(dashboard)/pos/order/[orderId]/OrderPageClient.tsx (969 linii)

Główny komponent edycji zamówienia:
- Lista produktów z kategoriami (breadcrumb navigation)
- Wyszukiwanie produktów
- Obsługa modyfikatorów (dialog)
- Filtr alergenów
- Ulubione produkty
- Sugestie produktów
- Zarządzanie pozycjami (ilość, notatki, storno)
- Dialogi: płatność, przenoszenie, podział, łączenie, wiadomość do kuchni

### src/app/(dashboard)/pos/order/[orderId]/PaymentDialog.tsx (1356 linii)

Kompleksowy dialog płatności:
- Metody: Gotówka, Karta, BLIK, Mix, Voucher, Na pokój (hotel)
- PolCard Go SoftPOS integration
- Obsługa rabatów (% i kwotowy)
- Podział rachunku na osoby
- Waluta obca (EUR, USD)
- E-paragon z QR + SMS
- Faktura VAT
- Napiwki

---

## SEKCJA 14: Typy i interfejsy

### src/types/index.ts

```typescript
// Shared TypeScript types — extend as needed from Prisma or API
export type {};
```

Typy są głównie definiowane inline w komponentach lub importowane z Prisma.

---

## SEKCJA 15: Lib / utils

### src/lib/prisma.ts

```typescript
import { PrismaClient, Prisma } from "../../prisma/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export { PrismaClient, Prisma };

function createPrismaClient(): PrismaClient {
  let databaseUrl = process.env.DATABASE_URL;
  // URL cleanup and mariadb:// conversion
  const adapter = new PrismaMariaDb(mariaDbUrl);
  return new PrismaClient({ adapter, log: [...] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
```

### src/lib/auth.ts

```typescript
import bcrypt from "bcryptjs";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
```

### src/lib/offline/sync.ts

```typescript
// Sync engine for offline actions
// - MAX_RETRIES: 5
// - RETRY_DELAY_BASE_MS: 2000 (exponential backoff)
// - FETCH_TIMEOUT_MS: 10000
// - CONNECTIVITY_CHECK_INTERVAL: 30000

const ACTION_ENDPOINTS: Record<OfflineActionType, EndpointConfig> = {
  CREATE_ORDER: { url: "/api/orders", method: "POST" },
  SEND_ORDER: { url: (p) => `/api/orders/${p.orderId}/send`, method: "POST" },
  ADD_PAYMENT: { url: "/api/payments", method: "POST" },
  CLOSE_ORDER: { url: (p) => `/api/orders/${p.orderId}/close`, method: "PATCH" },
  // ... 18 action types total
};

export async function syncPendingActions(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
  permanentlyFailed: number;
}>;

export async function checkConnectivity(): Promise<boolean>;

export function initOfflineSync(): () => void;
```

### src/lib/fiscal/posnet-driver.ts

```typescript
// Posnet thermal protocol driver
// Modes: DEMO (simulation) and LIVE (TCP/COM/USB)

export const posnetDriver = {
  async getStatus(): Promise<FiscalStatus>;
  async printReceipt(payload: ReceiptPayload): Promise<PrintReceiptResult>;
  async printDailyReport(): Promise<DailyReportResult>;
  async printPeriodReport(dateFrom, dateTo): Promise<DailyReportResult>;
};
```

### src/lib/validation.ts

Zod schemas for all API endpoints (411 lines):
- Auth: loginSchema, tokenLoginSchema
- Orders: createOrderSchema, sendOrderSchema, closeOrderSchema, splitOrderSchema, moveOrderSchema
- Payments: createPaymentSchema, paymentInputSchema
- Products: createProductSchema, updateProductSchema
- Users: createUserSchema, updateUserSchema
- Reservations, Banquets, Warehouse, Printers, KDS, etc.

---

## SEKCJA 16: manifest.json

```json
{
  "name": "POS Karczma Łabędź",
  "short_name": "Łabędź POS",
  "description": "System POS gastronomiczny - Karczma Łabędź",
  "start_url": "/pos",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0a0f10",
  "theme_color": "#895a3a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "food"],
  "lang": "pl"
}
```

---

## SEKCJA 17: Middleware

### src/middleware.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/jwt";
import { checkRateLimit, getConfigForRoute } from "@/lib/rate-limit";

const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/token-login",
  "/api/auth/users",
  "/api/users",
  "/api/health",
  "/api/ping",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimitKey = `${clientIp}:${pathname.split("/").slice(0, 4).join("/")}`;
  const rl = checkRateLimit(rateLimitKey, getConfigForRoute(pathname));

  if (!rl.allowed) {
    return NextResponse.json({ error: "Zbyt wiele żądań..." }, { status: 429 });
  }

  // Auth check for protected routes
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Sesja wygasła" }, { status: 401 });
  }

  // Pass user info in headers
  const headers = new Headers(request.headers);
  headers.set("x-user-id", session.userId);
  headers.set("x-user-role", session.roleName);
  headers.set("x-user-is-owner", String(session.isOwner));

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/api/:path*"],
};
```

---

## SEKCJA 18: Podsumowanie architektoniczne

### Statystyki kodu

| Metryka | Wartość |
|---------|---------|
| **API Routes** | ~150 endpointów |
| **Hooki (src/lib/hooks/)** | 6 plików |
| **Store'y Zustand** | 4 store'y |
| **Pliki TS/TSX** | ~290 plików |
| **Testy** | 17 plików testowych |

### External API / Serwisy

1. **Database**: MariaDB via Prisma (PrismaMariaDb adapter)
2. **Cache**: Redis (ioredis) — cache produktów, kategorii
3. **Fiscal**: Posnet thermal protocol (TCP/COM/USB)
4. **Payments**: 
   - PolCard Go (SoftPOS via Android Intent)
   - Terminal zewnętrzny
5. **Hotel PMS**: Integracja dla ROOM_CHARGE
6. **SMS**: Web Push + custom SMS API (e-paragony)
7. **KSeF**: Krajowy System e-Faktur (faktury elektroniczne)
8. **Sentry**: Error tracking (optional)

### Architektura offline

**Obecny stan:**
- Service Worker z precache dla `/api/products`, `/api/categories`
- `useOfflineStore` (Zustand + persist) — kolejka pending actions
- `src/lib/offline/sync.ts` — sync engine z retry logic
- Network-first strategy dla API, cache fallback

**Luki do implementacji offline-first:**
1. Brak IndexedDB (tylko localStorage przez Zustand persist)
2. Brak lokalnej bazy danych dla zamówień/płatności
3. Brak mechanizmu ID mapping (local → server)
4. Brak batch sync
5. Brak conflict resolution

### Znane problemy / TODO w kodzie

1. **Hardcoded strings** — wiele komunikatów po polsku inline
2. **Any types** — kilka miejsc z `eslint-disable` dla `any`
3. **Missing error boundaries** — tylko `global-error.tsx`
4. **No i18n** — wszystko po polsku
5. **Fiscal LIVE mode** — placeholder dla pełnego protokołu Posnet
6. **KSeF** — podstawowa integracja, wymaga rozbudowy

### Kluczowe pliki dla offline-first

| Komponent | Plik | Rola |
|-----------|------|------|
| Sync Store | `src/store/useOfflineStore.ts` | Kolejka offline actions |
| Sync Engine | `src/lib/offline/sync.ts` | Wykonywanie pending actions |
| Service Worker | `public/sw.js` | Cache + Background Sync trigger |
| SW Provider | `src/components/providers/ServiceWorkerRegister.tsx` | Rejestracja SW |
| Order Store | `src/store/useOrderStore.ts` | Stan aktualnego zamówienia |
| Query Provider | `src/components/providers/QueryProvider.tsx` | React Query + localStorage persist |

### Rekomendacje dla IMPLEMENTATION.md

1. **Dexie.js** — zamienić localStorage na IndexedDB dla:
   - LocalProduct, LocalCategory, LocalRoom, LocalTable (read-only, sync from server)
   - LocalOrder, LocalOrderItem, LocalPayment (read-write, sync to server)
   - SyncQueue (pending operations)

2. **Capacitor.js** — wrapper natywny dla:
   - PolCard Go (Android Intent)
   - Posnet Trio WiFi (HTTP API)
   - NFC (Web NFC fallback)
   - Background Sync

3. **SoftPOS** — rozbudowa `usePolcardGo`:
   - Stripe Tap to Pay jako alternatywa
   - Offline payment registration (fiscalization later)

4. **Sync Engine v2**:
   - Batch sync
   - Dependency resolution (orderId → items/payments)
   - Local ID → Server ID mapping
   - Conflict resolution (timestamp-based)

5. **Payment Lock** — mechanizm blokady zamówienia podczas płatności

---

*Audyt wygenerowany: 2026-02-22*
*Projekt: POS Karczma Łabędź*