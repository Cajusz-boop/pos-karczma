# Webhook Deployment - Konfiguracja

Automatyczny deploy przez GitHub webhook: push → webhook → deploy.

## Schemat działania

```
[git push] → [GitHub] --POST--> [pos.karczma-labedz.pl/webhook] → [deploy.sh] → [pm2 restart]
```

## 1. Konfiguracja serwera (jednorazowo)

### SSH na serwer

```bash
ssh -i ~/.ssh/hetzner_key root@65.108.245.25
```

### Skopiuj pliki webhook (z Windows)

```powershell
scp -i ~/.ssh/hetzner_key -r webhook/ root@65.108.245.25:/var/www/pos/
```

### Na serwerze - ustaw uprawnienia i uruchom

```bash
cd /var/www/pos/webhook
chmod +x deploy.sh

# Uruchom webhook z secretem
WEBHOOK_SECRET="3048fc1f8506a1176411482719ee26796db05586a9543cbff4331090f6be0993" pm2 start ecosystem.config.js

# Zapisz konfigurację PM2
pm2 save
```

### Sprawdź czy działa

```bash
pm2 status
curl http://localhost:9000/health
# Powinno zwrócić: {"status":"ok","timestamp":"..."}
```

## 2. Nginx - dodaj endpoint /webhook

```bash
nano /etc/nginx/sites-available/pos.karczma-labedz.pl
```

Dodaj location block (wewnątrz `server {}`):

```nginx
location /webhook {
    proxy_pass http://127.0.0.1:9000/webhook;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Hub-Signature-256 $http_x_hub_signature_256;
    proxy_set_header X-GitHub-Event $http_x_github_event;
}
```

```bash
nginx -t && systemctl reload nginx
```

## 3. Konfiguracja GitHub Webhook

Wejdź na: **https://github.com/Cajusz-boop/pos-karczma/settings/hooks/new**

Wypełnij:
- **Payload URL**: `https://pos.karczma-labedz.pl/webhook`
- **Content type**: `application/json`
- **Secret**: `3048fc1f8506a1176411482719ee26796db05586a9543cbff4331090f6be0993`
- **Events**: "Just the push event"

Kliknij **Add webhook**

## 4. Testowanie

```bash
# Na Windows
git add .
git commit -m "test webhook"
git push origin master
```

Sprawdź logi na serwerze:
```bash
pm2 logs pos-webhook --lines 50
tail -f /var/www/pos/webhook/deploy.log
```

## Struktura plików

```
/var/www/pos/
├── webhook/
│   ├── server.js           # Webhook listener
│   ├── deploy.sh           # Skrypt deploy
│   ├── ecosystem.config.js # Konfiguracja PM2 dla webhook
│   ├── webhook.log         # Logi webhook
│   └── deploy.log          # Logi deploy
├── .env                    # DATABASE_URL, WEBHOOK_SECRET
└── ...
```

## Komendy PM2

```bash
# Status wszystkich aplikacji
pm2 status

# Logi webhook
pm2 logs pos-webhook

# Logi aplikacji
pm2 logs pos-karczma

# Restart webhook
pm2 restart pos-webhook

# Restart aplikacji
pm2 restart pos-karczma
```

## Troubleshooting

### Webhook nie odpowiada
```bash
pm2 status              # Czy pos-webhook działa?
pm2 logs pos-webhook    # Błędy?
curl http://localhost:9000/health
```

### Deploy nie działa
```bash
tail -f /var/www/pos/webhook/deploy.log
# Sprawdź błędy w logu
```

### GitHub pokazuje błąd 401
- Sprawdź czy WEBHOOK_SECRET jest taki sam na serwerze i w GitHub
- Zrestartuj webhook po zmianie secretu: `pm2 restart pos-webhook`

### Port 9000 niedostępny z zewnątrz
```bash
# Sprawdź firewall
ufw status
# lub
iptables -L -n | grep 9000
```
