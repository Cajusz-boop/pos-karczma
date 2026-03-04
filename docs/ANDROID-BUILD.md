# Instalacja aplikacji POS Karczma na Androidzie

## Wymagania

- **Node.js 18+** (już masz przy pracy nad projektem)
- **Android SDK** — zainstaluj [Android Studio](https://developer.android.com/studio) albo sam SDK
- **JAVA_HOME** — ustaw na JDK 17 (np. `C:\Program Files\Android\Android Studio\jbr`)
- **ANDROID_HOME** — ustaw na ścieżkę do SDK (np. `%LOCALAPPDATA%\Android\Sdk`)

### Szybka konfiguracja (Windows)

1. Zainstaluj Android Studio
2. Ustaw zmienne środowiskowe:
   - `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`
   - `ANDROID_HOME` = `C:\Users\<TwojaNazwa>\AppData\Local\Android\Sdk`
3. Dodaj do PATH: `%ANDROID_HOME%\platform-tools` (ADB)

## Budowanie APK

```bash
npm run android:apk
```

Skrypt:
1. Buduje aplikację Next.js (tryb export)
2. Kopiuje pliki do projektu Android (Capacitor)
3. Kompiluje APK przez Gradle

Po zakończeniu plik APK znajduje się w:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Instalacja na telefonie

### Opcja A: Kopiowanie pliku
1. Skopiuj `app-debug.apk` na telefon (USB, e‑mail, Google Drive itp.)
2. Na telefonie otwórz plik
3. Zezwól na instalację z nieznanych źródeł (jeśli system poprosi)

### Opcja B: ADB (telefon podłączony USB)
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Tryby APK

- **Domyślny** (`npm run android:apk`) — bundle lokalny, działa offline. API wywoływane na serwerze chmurowym.
- **Live** — APK ładuje treść z serwera (potrzebny internet):
  ```bash
  CAPACITOR_LIVE_SERVER=1 npm run build:cap
  cd android && gradlew assembleDebug
  ```

## Android Studio (opcjonalnie)

Aby otworzyć projekt w Android Studio:
```bash
npx cap open android
```

Z poziomu Android Studio możesz uruchomić na emulatorze lub podłączonym urządzeniu.
