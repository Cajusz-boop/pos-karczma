# Import receptur na produkcję (Hetzner) — krok po kroku

## Opcja: deploy z importem

Najszybszy sposób — deploy z flagą `-ImportReceptury` (wymaga `-FullZip` przy pierwszym razie, żeby skopiować `scripts/`):

```powershell
.\scripts\deploy-to-hetzner.ps1 -FullZip -ImportReceptury
```

Skrypt wyśle `scripts/`, na serwerze uruchomi import receptur, a potem weryfikację.

---

## Ręcznie (krok po kroku)

### 1. SSH na serwer

Otwórz plik `.env.deploy.hetzner` i odczytaj wartości:
- `DEPLOY_SSH_HOST` — adres IP lub hostname
- `DEPLOY_SSH_USER` — użytkownik (zwykle `root`)
- `DEPLOY_SSH_KEY` — ścieżka do klucza (np. `~/.ssh/hetzner_key`)

**Polecenie SSH** (w PowerShell lub cmd):

```
ssh -i %USERPROFILE%\.ssh\hetzner_key root@[IP]
```

Zastąp `[IP]` wartością `DEPLOY_SSH_HOST` z `.env.deploy.hetzner`.  
Na Windows `~` rozwijane jest inaczej — lepiej użyć pełnej ścieżki, np.:
`C:\Users\hp\.ssh\hetzner_key`

**Przykład:**
```
ssh -i C:\Users\hp\.ssh\hetzner_key root@95.217.xxx.xxx
```

---

## 2. Katalog projektu na serwerze

Po zalogowaniu na serwer katalog projektu to:

```
/var/www/pos/
```

Sprawdź zawartość:
```bash
cd /var/www/pos && ls -la
```

Deploy z `-FullZip` wysyła też `scripts/` i `package.json`. Przy delta (domyślny) `scripts/` jest wysyłany, jeśli był zmieniony. Przy pierwszym deployu użyj `-FullZip` albo ręcznie wgraj `scripts/`.

---

## 3. Wgranie skryptów importu na serwer (z lokalnego PC)

**W nowym terminalu na swoim PC** (w katalogu projektu `c:\pos-karczma`), używając danych z `.env.deploy.hetzner`:

Skopiuj `scripts/` na serwer (zastąp `[IP]` i ścieżkę do klucza):

```powershell
scp -i C:\Users\hp\.ssh\hetzner_key -r scripts root@[IP]:/var/www/pos/
```

Jeśli używasz `DEPLOY_SSH_KEY` z `.env.deploy.hetzner`, podstaw tę ścieżkę zamiast powyższej.

---

## 4. Ustawienie DATABASE_URL na serwerze

Po połączeniu SSH (`cd /var/www/pos`) sprawdź `.env`:

```bash
cat .env
```

Jeśli jest tam `DATABASE_URL=...`, jest już ustawiona. Jeśli nie:

```bash
# Otwórz .env w edytorze
nano .env
```

Dodaj (lub uzupełnij) linię z `DATABASE_URL` z `.env.deploy.hetzner` (`DEPLOY_DATABASE_URL`), np.:

```
DATABASE_URL=mysql://user:haslo@localhost:3306/pos_karczma
```

Zapisz (`Ctrl+O`, Enter, `Ctrl+X`).

Alternatywnie — jednorazowo w bieżącej sesji:

```bash
export DATABASE_URL="mysql://user:haslo@localhost:3306/pos_karczma"
```

Zastąp danymi z `DEPLOY_DATABASE_URL` w `.env.deploy.hetzner`.

---

## 5. Uruchomienie importu receptur

Na serwerze (w katalogu `/var/www/pos`):

```bash
cd /var/www/pos
export DATABASE_URL="..."   # jeśli nie ma w .env — wklej wartość z DEPLOY_DATABASE_URL
npx tsx scripts/import-receptury.ts scripts/receptury_import_v2.sql
```

Albo, jeśli `DATABASE_URL` jest w `.env`:

```bash
cd /var/www/pos
npx tsx scripts/import-receptury.ts scripts/receptury_import_v2.sql
```

Skrypt domyślnie używa `scripts/receptury_import_v2.sql`, więc można też:

```bash
npx tsx scripts/import-receptury.ts
```

Sprawdź, czy `tsx` i `mariadb` są dostępne — jeśli brakuje:

```bash
cd /var/www/pos
npm install
npx tsx scripts/import-receptury.ts
```

---

## 6. Weryfikacja

Po imporcie:

1. Uruchom diagnostykę receptur:
   ```bash
   cd /var/www/pos
   export DATABASE_URL="mysql://USER:PASS@localhost:3306/pos_karczma"
   npm run receptury:check
   ```
   (albo `npx tsx scripts/check-receptury-prod.ts` — DATABASE_URL z .env)

2. Wejdź na https://pos.karczma-labedz.pl/receptury  
3. Sprawdź, czy lista receptur się pojawiła. Kliknij recepturę — edycja powinna działać.

---

## Podsumowanie — szybki skrót

**Opcja A — deploy z importem (zalecane):**
```powershell
.\scripts\deploy-to-hetzner.ps1 -FullZip -ImportReceptury
```

**Opcja B — ręcznie:**

Na **swoim PC** (PowerShell w `c:\pos-karczma`):
```
scp -i C:\Users\hp\.ssh\hetzner_key -r scripts root@[IP]:/var/www/pos/
ssh -i C:\Users\hp\.ssh\hetzner_key root@[IP]
```

Na **serwerze**:
```
cd /var/www/pos
export DATABASE_URL="mysql://USER:PASS@localhost:3306/pos_karczma"
npx tsx scripts/import-receptury.ts
npm run receptury:check
```

(`USER`, `PASS`, nazwa bazy — z `.env.deploy.hetzner`, `DEPLOY_DATABASE_URL`)
