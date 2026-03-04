# Integracja hotelowa — przywrócenie na produkcji

Gdy na https://pos.karczma-labedz.pl/hotel-orders pojawia się „Integracja hotelowa wyłączona”:

## Szybka naprawa (SQL)

1. Odczytaj credentials z `.env.deploy.hetzner`
2. SSH: `ssh -i ~/.ssh/hetzner_key root@65.108.245.25`
3. Na serwerze:
```bash
cd /var/www/pos
mysql -u pos -p'[HASŁO_Z_ENV]' pos_karczma < scripts/setup-hotel-production.sql
```

## Alternatywa — skrypt Node

```bash
cd /var/www/pos
# Załaduj DATABASE_URL z .env
export $(grep -v '^#' .env | xargs)
npx tsx scripts/setup-hotel-config-production.ts
```

## Weryfikacja

Po wykonaniu odśwież stronę https://pos.karczma-labedz.pl/hotel-orders — powinna wyświetlać się lista pokoi.

## Konfiguracja

| Parametr | Wartość produkcji |
|----------|-------------------|
| baseUrl  | http://127.0.0.1:3000 (hotel-pms na tym samym VPS) |
| apiKey   | a89f3281-8ae4-4c06-a351-987b35caa4f (musi być zgodny z EXTERNAL_API_KEY w HotelSystem) |
| enabled  | true |

Jeśli HotelSystem ma inny klucz, ustaw przed uruchomieniem skryptu:
```bash
export HOTEL_EXTERNAL_API_KEY="twój-klucz-z-hotelsystem-env"
```
