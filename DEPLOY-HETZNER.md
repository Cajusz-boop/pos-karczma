# Deploy POS Karczma na Hetzner VPS

Aplikacja działa na tym samym serwerze co HotelSystem (`65.108.245.25`).

## Szybki deploy (po konfiguracji)

```powershell
.\scripts\deploy-to-hetzner.ps1
```

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
Aplikacja nie działa. Sprawdź:
```bash
pm2 status
pm2 logs pos-karczma --lines 50
```

### Błąd bazy danych
```bash
mysql -u pos -p pos_karczma -e "SHOW TABLES;"
```

### Restart wszystkiego
```bash
pm2 restart all
systemctl reload nginx
```
