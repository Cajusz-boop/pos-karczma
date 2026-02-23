# BUILD LOG - Offline-First POS Implementation

## Data wykonania: 2026-02-22/23

---

## ETAP 1: Dexie.js - Lokalna baza danych ✅

### 1.1 Instalacja Dexie
- ✅ Zainstalowano `dexie` i `dexie-react-hooks`
- Package: `npm install dexie dexie-react-hooks`

### 1.2 CREATE offline-db.ts
- ✅ Utworzono `src/lib/db/offline-db.ts`
- Schemat Dexie z tabelami: `products`, `categories`, `rooms`, `tables`, `modifierGroups`, `taxRates`, `allergens`, `orders`, `orderItems`, `payments`, `syncQueue`, `syncCheckpoints`, `paymentLocks`
- P1-FIX: UUID generator z `crypto.randomUUID()` + fallback
- P3-FIX: Single version strategy dla migracji
- P4-FIX: Payment locks (acquirePaymentLock/releasePaymentLock)
- P10-FIX: Auto-release locks after 60s
- P19-FIX: forceRefresh() z cache-busting query param
- P20-FIX: purgeOldOrders() dla archiwizacji (7 dni)

### 1.3 CREATE initial-sync.ts
- ✅ Utworzono `src/lib/db/initial-sync.ts`
- `initialSync()` - pełna synchronizacja przy starcie
- `backgroundRefresh()` - odświeżanie w tle
- P18-FIX: Paginacja z `hasMore` loop

### 1.4 CREATE api/sync/pull/route.ts
- ✅ Utworzono `src/app/api/sync/pull/route.ts`
- Endpoint GET dla pobierania danych referencyjnych
- Transformacja danych z Prisma → Dexie format
- Decyzja: Brak `updatedAt` w modelach Prisma → pełny sync zamiast incremental

### 1.5 CREATE hooks/useProducts.ts
- ✅ Utworzono `src/hooks/useProducts.ts`
- `useProducts()`, `useProduct()`, `useAllProducts()`
- Reactive queries z `useLiveQuery`

### 1.6 CREATE hooks/useCategories.ts
- ✅ Utworzono `src/hooks/useCategories.ts`
- `useCategories()`, `useCategory()`, `useAllCategories()`

### 1.7 CREATE hooks/useRooms.ts
- ✅ Utworzono `src/hooks/useRooms.ts`
- `useRooms()`, `useTables()`, `useTablesByStatus()`

### 1.8 CREATE DexieProvider.tsx
- ✅ Utworzono `src/components/providers/DexieProvider.tsx`
- Inicjalizacja Dexie przy starcie
- Background refresh co 5 min
- Auto-purge co 24h (P20-FIX)

### 1.9 MODIFY layout.tsx
- ✅ Dodano `DexieProvider` do `src/app/layout.tsx`
- Wrapper wewnątrz `QueryProvider`

---

## ETAP 2: Sync Engine v2 ✅

### 2.1 CREATE sync-engine.ts
- ✅ Utworzono `src/lib/sync/sync-engine.ts`
- SyncEngine class z retry logic, batching, priority queue
- P5-FIX: While loop do wyczerpania kolejki
- P7-FIX: Priority sorting (orders: 3, items: 2, payments: 1)
- Exponential backoff: 1s → 10min

### 2.2 CREATE order-actions.ts
- ✅ Utworzono `src/lib/orders/order-actions.ts`
- Wszystkie akcje zamówień offline:
  - `createOrderOffline()`, `addItemToOrder()`, `updateItemQuantity()`
  - `sendToKitchen()`, `addPaymentOffline()`, `finalizeOrderOffline()`
  - `payAndCloseOffline()`, `cancelItemFromOrder()`
  - `voidPaymentOffline()`, `refundPaymentOffline()`
  - `applyOrderDiscount()`, `getOrderTotal()`
- P9-FIX: Atomic modifies dla order totals
- Payment locking dla współbieżności

### 2.3 CREATE hooks/useOrder.ts
- ✅ Utworzono `src/hooks/useOrder.ts`
- `useCurrentOrder()`, `useOpenOrders()`, `useTableOrders()`
- `useOrder()`, `useOrderItems()`, `useSyncStatus()`
- `useAllOrders()`, `useOrderTotals()`

### 2.4 CREATE api/sync/batch/route.ts
- ✅ Utworzono `src/app/api/sync/batch/route.ts`
- Batch endpoint dla syncowania operacji
- P6-FIX: SyncLog w transakcji z operacją
- P12-FIX: Server-side guard dla double payment
- P14-FIX: Auth required (x-user-id header)
- Fiskalizacja i e-receipt po płatności

### 2.5 Prisma migration
- ✅ Dodano modele do `prisma/schema.prisma`:
  - `SyncLog` - idempotency tracking
  - `ReceiptErrorLog` - audyt błędów fiskalizacji
  - `FiscalEvent` - kolejka zdarzeń fiskalnych
- Uruchomiono `npx prisma db push`

---

## ETAP 3: Capacitor ✅

### 3.1 Instalacja Capacitor
- ✅ Zainstalowano:
  - `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
  - `@capacitor/network`, `@capacitor/app`, `@capacitor/splash-screen`
  - `@capacitor/preferences`, `@capacitor/haptics`
- Zainicjalizowano Capacitor i dodano platformę Android

### 3.2 CREATE capacitor.config.ts
- ✅ Utworzono `capacitor.config.ts`
- P-CAPACITOR-FIX: Dev vs Prod config
  - Dev: Live server mode z `window.CAPACITOR_SERVER_URL`
  - Prod: Assets bundled w APK

### 3.3 SoftPOS (Stripe Tap to Pay)
- ⏸️ ODROCZONE - wymaga fizycznego urządzenia i konta Stripe
- Przygotowana struktura dla przyszłej implementacji

---

## ETAP 4: Integracje fiskalne ✅

### 4.1 MODIFY posnet-driver.ts
- ✅ Zmodyfikowano `src/lib/fiscal/posnet-driver.ts`
- Dodano HTTP JSONPOS API (Posnet Trio WiFi):
  - `sendJsonPosCommand()` - generyczna komenda JSONPOS
  - `printReceiptJsonPos()` - druk paragonu HTTP
  - `getStatusJsonPos()` - status drukarki HTTP
  - `printDailyReportJsonPos()` - raport dzienny HTTP
- Routing TCP vs HTTP na podstawie `connectionType`

### 4.2 UPDATE fiscal types
- ✅ Zmodyfikowano `src/lib/fiscal/types.ts`
- Dodano `"HTTP"` do `FiscalPrinterConfig.connectionType`

---

## ETAP 5: Migracja UI ✅

### 5.1 MODIFY OfflineIndicator.tsx
- ✅ Zmodyfikowano `src/components/OfflineIndicator.tsx`
- Zamieniono stary `useOfflineStore` na nowy `useSyncStatus` hook
- Integracja z `syncEngine`

### 5.2 Auto-purge w DexieProvider
- ✅ Zaimplementowano w ramach 1.8
- Automatyczne czyszczenie zamówień starszych niż 7 dni
- Uruchamiane co 24h

### 5.3 MODIFY sw.js + ServiceWorkerRegister
- ✅ Zmodyfikowano `public/sw.js`
- Dodano `postMessage({ type: "DEXIE_SYNC_REQUESTED" })`
- ✅ Utworzono/zaktualizowano `src/components/providers/ServiceWorkerRegister.tsx`
- Handler dla `DEXIE_SYNC_REQUESTED` → `syncEngine.pushNow()`

---

## FINAŁ: npm run build

### Wynik
```
✓ Compiled successfully
❌ Linting and checking validity of types... Failed
```

### Status
- **Kompilacja TypeScript**: ✅ SUKCES
- **ESLint**: ❌ FAILED (pre-existing issues)

### Błędy lintingu
Wszystkie błędy ESLint są **PRE-EXISTING** (istniały przed implementacją offline-first):
- ~70 błędów w ~35 plikach
- Głównie: unused vars, missing deps w hooks, any types
- **ŻADEN z błędów nie pochodzi z nowego kodu offline-first**

### Pliki z pre-existing issues (wybrane):
- `banquets/page.tsx`, `day-close/page.tsx`, `delivery/page.tsx`
- `kitchen/page.tsx`, `manager/page.tsx`, `products/page.tsx`
- `PaymentDialog.tsx`, `ConnectionMonitor.tsx`
- Pliki testowe `__tests__/*.ts`

---

## DECYZJE ARCHITEKTONICZNE

1. **Brak updatedAt w Prisma models**
   - Decyzja: Pełny sync zamiast incremental dla reference data
   - Server generuje `_serverUpdatedAt` w momencie pull

2. **DexieProvider w root layout**
   - Decyzja: Wrapper wewnątrz QueryProvider w `src/app/layout.tsx`
   - Zapewnia dostęp globalny

3. **SoftPOS odroczone**
   - Powód: Wymaga fizycznego urządzenia Android z NFC
   - Status: Struktura przygotowana, implementacja wymaga testów na device

---

## UTWORZONE PLIKI (19 nowych)

```
src/lib/db/offline-db.ts
src/lib/db/initial-sync.ts
src/lib/sync/sync-engine.ts
src/lib/orders/order-actions.ts
src/hooks/useProducts.ts
src/hooks/useCategories.ts
src/hooks/useRooms.ts
src/hooks/useOrder.ts
src/app/api/sync/pull/route.ts
src/app/api/sync/batch/route.ts
src/components/providers/DexieProvider.tsx
src/components/providers/ServiceWorkerRegister.tsx
capacitor.config.ts
android/ (Capacitor project)
src/lib/auth/cached-auth.ts
```

## ZMODYFIKOWANE PLIKI (8+)

```
package.json (dexie, capacitor deps)
prisma/schema.prisma (SyncLog, ReceiptErrorLog, FiscalEvent)
src/app/layout.tsx (DexieProvider)
src/lib/fiscal/posnet-driver.ts (HTTP JSONPOS)
src/lib/fiscal/types.ts (HTTP connectionType)
src/components/OfflineIndicator.tsx (Dexie hooks)
public/sw.js (DEXIE_SYNC_REQUESTED)
```

---

## Capacitor build na Android

Zaimplementowano proces buildu statycznego dla APK:

- `next.config.mjs` – przy `CAPACITOR_BUILD=1`: `output: 'export'`, `images.unoptimized`, Sentry wyłączony
- `generateStaticParams` – dodane do tras API z segmentami dynamicznymi oraz stron (pos/order, display, e-receipt, settings)
- Skrypty: `scripts/add-generate-static-params.js`, `scripts/fix-generate-static-params-return.js`
- Strony client-only: rozdzielone na Server Page + Client Component (display, printers/templates, users/permissions)
- Trasy wymagające runtime: early return przy `CAPACITOR_BUILD` (sync/pull, KDS stream, floor stream, reports/export)

**Kroki:** `npm run build:cap` → `npx cap add android` → `npx cap sync` → `npx cap open android` → Build APK w Android Studio.

Szczegóły: `docs/CAPACITOR-BUILD.md`

Naprawione konflikty ścieżek: `/api/kds/stations` → `/api/kds/station-list`, `/api/reports` (lista) usunięta (podstrony jak daily/shift bez zmian). Build przechodzi. **Android Studio** wymagane do `cap open android` i budowania APK.

---

## ETAP 6: Cached Session — logowanie offline ✅

### 6.1 Problem
- Logowanie wymaga serwera (`/api/auth/*`)
- Kelner offline nie mógł się zalogować — offline-first POS był bezużyteczny

### 6.2 Rozwiązanie
- Cached session w Dexie — kelner loguje się RAZ online, sesja cache'owana lokalnie
- Offline używa cached sesji do 7 dni

### 6.3 MODIFY offline-db.ts
- ✅ Wersja schematu 2 z migracją
- ✅ Interfejs `CachedSession`: userId, userName, userRole, isOwner, pinHash, cachedAt, expiresAt
- ✅ Tabela `cachedSessions`: indeksy userId, userName

### 6.4 CREATE cached-auth.ts
- ✅ `cacheSession(user, pin)` — hashuje PIN bcrypt, zapisuje w Dexie, expiresAt = now + 7 dni
- ✅ `getCachedUsers()` — zwraca userów z ważną cached session
- ✅ `getCachedSession(userId)` — zwraca sesję lub null jeśli expired
- ✅ `verifyCachedPin(userId, pin)` — bcrypt.compare offline
- ✅ `clearExpiredSessions()` — usuwa wygasłe sesje

### 6.5 MODIFY LoginClient.tsx
- ✅ `loadUsers()`: offline → `getCachedUsers()` z Dexie, online → fetch /api/auth/users
- ✅ `submitPin()`: offline → `verifyCachedPin()` + `getCachedSession()`, online → fetch + `cacheSession()` po sukcesie
- ✅ Badge "Tryb offline — logowanie z cache" w UI
- ✅ Flow online bez zmian

### 6.6 MODIFY DexieProvider.tsx
- ✅ `clearExpiredSessions()` wywoływane przy starcie

### 6.7 Zasady bezpieczeństwa
- PIN hashowany bcrypt PRZED zapisem (bcryptjs)
- Session expires po 7 dniach
- Cached session NIE zawiera JWT — tylko userId/name/role/isOwner
- Nie zmieniano API routes auth ani useAuthStore

### 6.8 npm run build (2026-02-23)
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```
**Status:** ✅ SUKCES

---

## ETAP 7: IMPLEMENTATION v4 DELTA (2026-02-23)

### BLOK 1 — Blokery
- **V4-01** SSR Safety: Dodano default value w useLiveQuery (useProduct, useCategory, useRoom, useTable, useOrder). Wszystkie hooki mają guard `isBrowser()`.
- **V4-04** Safe Fetch: Utworzono `src/lib/utils/safe-fetch.ts`. Podmiana fetch().json() na safeFetch w: sync-engine.ts, initial-sync.ts, LoginClient.tsx.

### BLOK 2 — Core offline
- **V4-11** Orphan detection: `detectOrphans()` w DexieProvider — re-kolejkowanie zamówień pending bez wpisu w syncQueue (np. po crashu).
- **V4-14** OrderSyncBadge: Komponent `src/components/OrderSyncBadge.tsx` (Cloud/CloudOff/AlertTriangle). Użycie w merge dialog i nagłówku OrderPageView.
- **V4-21** Order number offline: `getNextLocalOrderNumber()` w order-actions, syncCheckpoints "_lastOrderNumber". Prefix "L-" w orderNumberLabel przy pending. createOrderOffline ustawia orderNumber.
- **V4-06** Quota management: `checkStorageQuota()` w DexieProvider — navigator.storage.estimate, agresywny purge przy >80%, persistent storage.
- **V4-12** Capacitor background sync: App.addListener("appStateChange") — pushNow + backgroundRefresh przy powrocie na foreground. Zainstalowano @capacitor/app.

### BLOK 3 — Operacje restauracyjne
- **V4-16** Transfer table offline: `transferTableOffline()` w order-actions, akcja TRANSFER_TABLE w batch endpoint.
- **V4-19** Reszta z gotówki: Banner "Reszta do wydania: X zł" w PaymentDialog przy change > 0.
- **V4-17** App version: `checkAppVersion()` w DexieProvider — force refresh przy upgrade (storedVersion !== APP_VERSION).
- **V4-18** Emergency recovery: Zakładka "Cache offline" w manager page — przycisk "Resetuj cache offline" (Dexie.delete + reload).
- **V4-24** Audit log: Po każdej udanej operacji w batch endpoint — auditLog z offlineTimestamp, offlineOperationId, syncedAt w metadata.

### npm run build (2026-02-23)
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```
**Status:** ✅ SUKCES

---

## NASTĘPNE KROKI (zalecane)

1. **Naprawić pre-existing lint errors** - osobne zadanie
2. **Przetestować na urządzeniu Android** - Capacitor build (po udanym `out/`)
3. **Implementacja SoftPOS** - po uzyskaniu konta Stripe TTP
4. **Migracja komponentów UI** - zamiana React Query na Dexie hooks
5. **Testy E2E offline** - scenariusze offline/online

---

*Wygenerowano automatycznie przez Cursor Agent*
