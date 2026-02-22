# POS Karczma - Skaner Środowiskowy v3.0

Kompleksowy skaner do analizy gotowości komputera przed instalacją POS Karczma.

## Co sprawdza skaner v3.0

### System
- Szczegółowa wersja Windows (edycja, build)
- Architektura procesora
- **Uprawnienia administratora** (NOWE)

### Sprzęt
- **Procesor** - nazwa, liczba rdzeni (NOWE)
- RAM - ilość całkowita i dostępna, procent użycia
- Dysk - wolne miejsce i procent zajęcia
- **Monitory** - rozdzielczość wyświetlaczy (NOWE)

### Oprogramowanie
- Node.js (wymaga v18+)
- npm
- **Git** (NOWE - opcjonalny)
- Python

### Bazy danych
- MySQL/MariaDB (WYMAGANY)
  - Sprawdza port 3306
  - **Sprawdza usługę Windows** (NOWE)
  - CLI dostępność
- Redis (opcjonalny)

### Sieć
- Hostname i IP lokalne
- **Brama domyślna** (NOWE)
- **Serwery DNS** (NOWE)
- **Stan firewalla Windows** (NOWE)
- Porty sieciowe z inteligentnym sprawdzaniem:
  - 3000, 3001 - powinny być wolne (dla Next.js)
  - 3306 - powinien być zajęty (MySQL)
  - 6379 - Redis
  - 9000 - Webhook
  - 9100 - Drukarka RAW

### Drukarki i czytniki
- **Porty COM z rejestru Windows** (ULEPSZONE)
- **Drukarki zainstalowane w Windows** (NOWE)
- Drukarki sieciowe (rozszerzony zakres skanowania)

### Bistro Simplex
- Wykrywanie instalacji na dyskach
- Odczyt z rejestru Windows
- Parsowanie plików konfiguracyjnych (.ini)
- Wykrywanie drukarek i operatorów
- Obliczanie rozmiaru bazy danych

## Uruchomienie

### Jako administrator (zalecane)
```
Kliknij prawym przyciskiem na uruchom_skaner.bat
Wybierz "Uruchom jako administrator"
```

### Z wiersza poleceń
```bash
python pos_env_scanner.py
```

## Wymagania

- **Windows 10 lub nowszy**
- **Python 3.8+** (https://www.python.org/downloads/)
  - WAŻNE: Zaznacz "Add Python to PATH" podczas instalacji!
- Uprawnienia administratora (dla pełnych wyników)

## Pliki wyjściowe

- `pos_scan_<hostname>_<timestamp>.json` - pełny raport

## Wysyłanie do serwera

Po zakończeniu skanowania możesz wysłać raport do serwera POS Karczma.
Raport będzie widoczny w: **Ustawienia > Narzędzia instalacyjne**

## Legenda wyników

| Symbol | Znaczenie |
|--------|-----------|
| `[OK]` | Wymaganie spełnione |
| `[!]` | Ostrzeżenie (system może działać) |
| `[X]` | Problem krytyczny do naprawienia |
| `[i]` | Informacja |
| `[*]` | Znaleziono (np. Bistro) |

## Zmiany w v3.0

### Nowe funkcje
- Sprawdzanie uprawnień administratora
- Szczegółowe informacje o procesorze
- Wykrywanie monitorów i rozdzielczości
- Sprawdzanie Git
- Sprawdzanie usługi MySQL/MariaDB jako Windows Service
- Sprawdzanie bramy domyślnej i DNS
- **Sprawdzanie firewalla Windows**
- Wykrywanie drukarek zainstalowanych w Windows
- Inteligentne sprawdzanie portów (wolne vs zajęte)
- Porty COM z rejestru Windows

### Poprawki
- Import winreg z obsługą błędów (działa na Linux/Mac)
- Rozszerzony zakres skanowania drukarek sieciowych
- Lepsze parsowanie plików INI (więcej kodowań)
- Ulepszona obsługa błędów Unicode
- Czytelniejsze komunikaty błędów
- Raport zawiera więcej szczegółów

### Struktura raportu
- `meta` - informacje o skanerze
- `platform` - szczegóły systemu operacyjnego
- `hardware` - CPU, RAM, dysk, monitory
- `software` - Node.js, npm, Git, Python
- `databases` - MySQL, Redis
- `network` - IP, brama, DNS, firewall
- `ports` - status portów sieciowych
- `printers` - COM, Windows, sieciowe
- `bistro` - wykryte instalacje Bistro Simplex
- `checks` - status wszystkich sprawdzeń
- `recommendations` - zalecenia
