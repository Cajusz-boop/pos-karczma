# Deploy POS Karczma na Hetzner VPS

Aplikacja działa na tym samym serwerze co HotelSystem (`65.108.245.25`).

## Metody deploy

### 1. Webhook (automatyczny) - ZALECANE

Po konfiguracji wystarczy:
```bash
git push origin master
```

GitHub webhook automatycznie uruchomi deploy na serwerze.

**Konfiguracja:** Zobacz [WEBHOOK-SETUP.md](./WEBHOOK-SETUP.md)

### 2. Ręczny deploy (PowerShell)

```powershell
.\scripts\deploy-to-hetzner.ps1
```

### 3. GitHub Actions (alternatywa)

Push na `master` uruchamia workflow w `.github/workflows/deploy.yml`.
Wymaga `HETZNER_SSH_KEY` w GitHub Secrets.

---

Pierwszy deploy wymaga jednorazowej konfiguracji serwera (poniżej).

---

## Jednorazowa konfiguracja serwera

### 1. DNS - dodaj rekord A

W panelu domeny `karczma-labedz.pl` dodaj:

| Typ | Nazwa | Wartość |
|-----|-------|---------|
| A | pos | 65.108.245.25 |

Poczekaj na propagację DNS (zwykle 5-30 min).

### 2. SSH na serwer i utwórz bazę MySQL

```bash
ssh -i ~/.ssh/hetzner_key root@65.108.245.25
```

```bash
mysql -u root -p
```

```sql
CREATE DATABASE pos_karczma CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pos'@'localhost' IDENTIFIED BY 'PosPMS2024#Secure';
GRANT ALL PRIVILEGES ON pos_karczma.* TO 'pos'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Utwórz katalog aplikacji

```bash
mkdir -p /var/www/pos
```

### 4. Nginx - dodaj konfigurację

```bash
nano /etc/nginx/sites-available/pos.karczma-labedz.pl
```

Wklej:

```nginx
server {
    listen 80;
    server_name pos.karczma-labedz.pl;

    # Next.js static — serwuj z dysku (standalone)
    location /_next/static/ {
        alias /var/www/pos/standalone/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Public (manifest, favicon, icons, sw.js)
    location ~ ^/(manifest\.json|favicon\.ico|icon-192\.png|icon-512\.png|sw\.js) {
        root /var/www/pos/standalone/public;
        expires 7d;
    }

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Aktywuj:

```bash
ln -s /etc/nginx/sites-available/pos.karczma-labedz.pl /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. Certyfikat SSL (Let's Encrypt)

```bash
certbot --nginx -d pos.karczma-labedz.pl
```

Certbot automatycznie zaktualizuje konfigurację nginx na HTTPS.

### 6. Pierwszy deploy

Z Windows:

```powershell
.\scripts\deploy-to-hetzner.ps1 -FullZip
```

Flaga `-FullZip` przy pierwszym deployu (potem nie trzeba).

---

## Struktura na serwerze

```
/var/www/pos/
├── .env                    # DATABASE_URL, PORT=3001
├── .next/
│   └── standalone/         # Next.js standalone build
│       └── server.js       # Punkt wejścia
├── prisma/
│   └── schema.prisma       # Schemat bazy
└── ecosystem.config.js     # Konfiguracja PM2
```

## Porty

| Aplikacja | Port |
|-----------|------|
| hotel-pms | 3000 |
| pos-karczma | 3001 |

## Auto-start po restarcie serwera (PM2 startup)

**Ważne:** Bez tego aplikacja nie uruchomi się po rebootcie VPS.

```bash
# Jednorazowo - wygeneruj i uruchom komendę startup
pm2 startup

# Zapisz aktualną konfigurację (uruchom po każdym pm2 start/restart)
pm2 save
```

## Logi i diagnostyka

```bash
# Logi PM2
pm2 logs pos-karczma

# Status
pm2 status

# Restart
pm2 restart pos-karczma

# Logi nginx
tail -f /var/log/nginx/error.log
```

## Troubleshooting

### 502 Bad Gateway
Aplikacja nie odpowiada. Szybka naprawa z Windows:

```powershell
# Wklej klucz i host z .env.deploy.hetzner
scp -i $key scripts/fix-502-hetzner.sh root@65.108.245.25:/tmp/
ssh -i $key root@65.108.245.25 "bash /tmp/fix-502-hetzner.sh"
```

Lub po SSH na serwer:

```bash
# 1. Sprawdź status
pm2 status

# 2. Restart
pm2 restart pos-karczma
pm2 save

# 3. Sprawdź czy odpowiada (powinno zwrócić JSON)
curl http://127.0.0.1:3001/api/health

# 4. Jeśli nadal 502 - sprawdź logi
pm2 logs pos-karczma --lines 100

# 5. Sprawdź .env (DATABASE_URL, PORT)
cat /var/www/pos/.env | grep -v PASSWORD
```

Typowe przyczyny: błąd bazy danych, brak .env, port 3001 zajęty.

### Błąd bazy danych
```bash
mysql -u pos -p pos_karczma -e "SHOW TABLES;"
```

### Ręczna migracja SQL (z Windows PowerShell)

Gdy trzeba wykonać SQL na produkcyjnej bazie (np. dodać wartość do ENUM):

```powershell
# Credentials z .env.deploy.hetzner
$keyPath = "$env:USERPROFILE\.ssh\hetzner_key"
$cmd = @'
echo "TWOJE_SQL_TUTAJ" | mysql -u $DB_USER -p'$DB_PASS' $DB_NAME && echo "MIGRATION_OK"
'@
$cmd | ssh -i $keyPath $SSH_USER@$SSH_HOST "bash -s"
```

Weryfikacja:
```powershell
$cmd = @'
mysql -u $DB_USER -p'$DB_PASS' $DB_NAME -e "DESCRIBE NazwaTabeli;"
'@
$cmd | ssh -i $keyPath $SSH_USER@$SSH_HOST "bash -s"
```

**Uwaga:** Rzeczywiste wartości ($SSH_HOST, $DB_USER, $DB_PASS itp.) znajdują się w `.env.deploy.hetzner`

### Restart wszystkiego
```bash
pm2 restart all
pm2 save
systemctl reload nginx
```

---
*Ostatni test webhook: 2026-02-23*
