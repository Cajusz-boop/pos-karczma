# Capacitor build na Android

Sprawdzenie, czy aplikacja buduje się jako natywna APK (offline-first na urządzeniu Android).

## Wymagania

- Node.js, npm
- Android Studio (do budowania APK)
- Zmienna `CAPACITOR_BUILD=1` przy buildzie Next.js

## Kroki

### 1. Build statyczny Next.js (dla Capacitor)

```bash
# Windows (cmd)
set CAPACITOR_BUILD=1
set NEXT_PUBLIC_SENTRY_DSN=
npm run build

# Windows (PowerShell)
$env:CAPACITOR_BUILD="1"
$env:NEXT_PUBLIC_SENTRY_DSN=""
npm run build

# Lub użyj skryptu (Windows cmd):
npm run build:cap
```

Build generuje katalog `out/` ze statycznymi plikami. Next.js używa `output: 'export'` gdy `CAPACITOR_BUILD=1`.

**Naprawione konflikty ścieżek** (plik vs katalog przy export):
- `/api/kds/stations` → `/api/kds/station-list`
- `/api/reports` (lista) → `/api/report-list` (lista nieużywana, usunięta)

**Uwaga:** Na Windows może wystąpić błąd `EPERM` przy kopiowaniu do `out/`. Spróbuj:
- Uruchomić terminal jako Administrator
- Tymczasowo wyłączyć antywirus
- Uruchomić build ponownie (czasem działa przy drugiej próbie)

### 2. Dodanie platformy Android (jeśli brak)

```bash
npx cap add android
```

### 3. Synchronizacja

```bash
npx cap sync
```

Kopiuje zawartość `out/` do projektu Android.

### 4. Otwarcie w Android Studio

```bash
npx cap open android
```

### 5. Build APK w Android Studio

1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. APK zostanie wygenerowany w `android/app/build/outputs/apk/`

## Konfiguracja

- `capacitor.config.ts` – `webDir: "out"`, domyślnie brak `server.url` (UI z bundla w APK, działa offline)
- **Tryb live server:** aby WebView łączył się z dev serverem, uruchom `cap sync` z `CAPACITOR_LIVE_SERVER=1` (PowerShell: `$env:CAPACITOR_LIVE_SERVER="1"; npx cap sync`)
- `next.config.mjs` – gdy `CAPACITOR_BUILD=1`: `output: 'export'`, `images.unoptimized: true`, Sentry wyłączony

## Ograniczenia buildu statycznego

- API (Route Handlers) są prerenderowane z placeholderami – w APK działają tylko gdy backend jest dostępny przez sieć
- Trasy SSE (KDS stream, floor stream) zwracają stub w buildzie – runtime wymaga serwera
- E-paragon `/e-receipt/[token]` – wymaga backendu do odczytu z bazy

## Offline-first

Aplikacja używa Dexie.js do przechowywania danych lokalnie. Sync z backendem odbywa się przez `/api/sync/pull` i `/api/sync/batch` – gdy urządzenie jest online i backend działa.
