# Ręczne pobranie bazy z produkcji

Jeśli skrypt `db-pull-from-prod.ps1` nie może utworzyć backupu (np. `docker: command not found` przy SSH), wykonaj kroki ręcznie.

## Krok 1: SSH na serwer

```powershell
ssh -i C:\Users\hp\.ssh\hetzner_key root@65.108.245.25
```

## Krok 2: Utwórz backup na serwerze

```bash
cd /var/www/pos
mkdir -p backups

# Opcja A: Docker (jeśli masz go w PATH po zalogowaniu)
docker compose exec -T db sh -c 'mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" --single-transaction pos_karczma' | gzip > backups/backup_$(date +%Y-%m-%d_%H%M%S).sql.gz

# Opcja B: Bez Dockera (baza dostępna na localhost:3306)
./scripts/backup-db.sh

# Sprawdź czy plik ma sensowny rozmiar (> 1 KB)
ls -la backups/
```

## Krok 3: Pobierz plik na Windows

W **nowym** terminalu na swoim komputerze:

```powershell
cd c:\pos-karczma
scp -i C:\Users\hp\.ssh\hetzner_key root@65.108.245.25:/var/www/pos/backups/backup_YYYY-MM-DD_HHMMSS.sql.gz backups/
```

(Zastąp `backup_YYYY-MM-DD_HHMMSS.sql.gz` faktyczną nazwą z kroku 2.)

## Krok 4: Restore lokalnie

```powershell
cd c:\pos-karczma
npx tsx scripts/restore-from-backup.ts backups/backup_YYYY-MM-DD_HHMMSS.sql.gz
```

## Krok 5: Uruchom aplikację

```powershell
npx prisma generate
npm run dev
```
