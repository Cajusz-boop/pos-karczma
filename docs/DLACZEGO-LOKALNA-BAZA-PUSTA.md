# Dlaczego lokalna baza była pusta?

## Sytuacja

- **Produkcja** (pos.karczma-labedz.pl) — baza z danymi (sale, stoliki, zamówienia)
- **Lokalnie** (localhost:3000) — 0 sal, 0 stolików

## Przyczyna: dwie różne bazy

Aplikacja łączy się z bazą przez `DATABASE_URL` w pliku `.env`:

```
# Lokalnie (.env)
DATABASE_URL="mysql://root@localhost:3306/pos_karczma"

# Produkcja (serwer)
DATABASE_URL="mysql://user:pass@db:3306/pos_karczma"  # kontener Docker
```

Każde środowisko ma własną bazę:

| Środowisko | Gdzie jest baza          | Zawartość          |
|------------|--------------------------|--------------------|
| Produkcja  | Serwer (np. Hetzner VPS) | Pełne dane         |
| Lokalne    | localhost (Twój komputer)| Pusta lub inna     |

## Jak mogło dojść do pustej bazy lokalnie?

1. **Nowa instalacja** — `prisma migrate deploy` na nowej bazie tworzy schemat, ale bez danych.
2. **Ręczny reset** — np. `prisma migrate reset`, który czyści bazę i uruchamia seed (jeśli jest).
3. **Inna baza** — zmiana `DATABASE_URL` na inną bazę (np. testową).
4. **Ręczne wyczyszczenie** — przypadkowe usunięcie danych.
5. **Brak synchronizacji** — baza produkcyjna była rozwijana osobno, lokalna nigdy nie dostała kopii danych.

## Co zrobić na przyszłość?

### 1. Regularne kopie produkcyjnej bazy

Upewnij się, że na serwerze działa backup, np.:

```bash
# Cron codziennie o 3:00
0 3 * * * /var/www/pos/scripts/backup-db.sh >> /var/log/pos-backup.log 2>&1
```

### 2. Pobieranie bazy z produkcji (lokalnie)

Skrypt `scripts/db-pull-from-prod.ps1`:

- łączy się z serwerem produkcyjnym (SSH),
- tworzy dump bazy na serwerze,
- pobiera go lokalnie,
- przywraca do lokalnej bazy.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\db-pull-from-prod.ps1
```

### 3. Kopie konfiguracji (sale, stoliki, drukarki)

W **Menadżer → Kopie zapasowe** możesz utworzyć kopię konfiguracji (sale, stoliki itd.).  
Obecnie można ją **pobrać** (JSON), brakuje natomiast przycisku „Restore” do wgrania takiej kopii z powrotem do bazy.

### 4. Dokumentacja środowisk

Dobrze mieć notatkę, np. w `README` lub w tym pliku:

- produkcja: `pos.karczma-labedz.pl` → baza na Hetzner,
- lokal: `localhost:3000` → baza `pos_karczma` na localhost.

I informację, że lokalnie używana jest inna baza niż na produkcji.
