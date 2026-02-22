# Serwer Lokalny pos-karczma

Backup/failover serwer POS na wypadek braku internetu.

## Dane dostępowe

| Co | Wartość |
|----|---------|
| **IP serwera** | `10.119.169.20` |
| **URL aplikacji** | `http://10.119.169.20:3001` lub `http://localhost:3001` |
| **MySQL user** | `root` |
| **MySQL pass** | `root123` |
| **Baza danych** | `pos_karczma` |
| **Lokalizacja kodu** | `E:\pos-karczma` |

## Zarządzanie aplikacją

### Sprawdzenie statusu
```cmd
pm2 list
```

### Logi aplikacji
```cmd
pm2 logs pos-karczma
```

### Restart aplikacji
```cmd
pm2 restart pos-karczma
```

## Aktualizacja kodu

```cmd
E:\pos-karczma\scripts\aktualizuj-serwer-lokalny.bat
```

## Synchronizacja bazy danych

### Kierunek: Hetzner (produkcja) → Lokalny

```cmd
E:\pos-karczma\scripts\sync-db-from-hetzner.bat
```

## Kiedy używać serwera lokalnego

1. **Brak internetu** - wejdź na `http://10.119.169.20:3001`
2. **Awaria głównego serwera** - serwer lokalny ma kopię danych

## Porty

| Aplikacja | Port |
|-----------|------|
| HotelSystem | 3000 |
| pos-karczma | 3001 |

## Troubleshooting

### Aplikacja nie działa
```cmd
pm2 list
pm2 logs pos-karczma --lines 50
```

### Port 3001 zajęty
```cmd
netstat -ano | findstr :3001
taskkill /PID <numer_pid> /F
pm2 restart pos-karczma
```
