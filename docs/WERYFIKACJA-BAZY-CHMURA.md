# Weryfikacja bazy danych na produkcji (chmura / Hetzner)

## Kolejność migracji do wykonania na produkcji

Na serwerze migracje **nie wykonują się automatycznie**. Trzeba je zastosować ręcznie w tej kolejności:

| Kolejność | Migracja | Co robi |
|-----------|----------|--------|
| 1 | `20260213100148_init` | Tabele startowe (User, Role, Room, Table, Category, Product, Order, itd.) |
| 2 | `20260302120000_add_order_type_values` | Rozszerza `Order.type` o PHONE, DELIVERY, HOTEL_ROOM |
| 3 | `20260304120000_add_faza2_kalkulator_tables` | **event_packages**, **event_package_items**, **procurement_calculations**, **stock_minimums** (wymaga: `recipes`, `products`) |
| 4 | `20260304130000_add_faza2a_google_calendar` | **events**, **calendar_sync_log**, **calendar_config** |
| 5 | `20260305120000_recipe_status_aktywna_archiwalna` | Kolumna `recipes.status` tylko AKTYWNA, ARCHIWALNA |

**Uwaga:** Migracje 3–5 zakładają, że w bazie są już tabele **receptur/zaopatrzenia**: `products`, `recipes`, `recipe_ingredients`, `tags`, `recipe_tags`, `recipe_history`, `unit_conversions`. Jeśli ich nie ma, trzeba je wcześniej utworzyć (np. z pełnego schematu Prisma lub z brakujących migracji).

---

## Tabele wymagane przez aplikację (Faza 2)

Poniższe tabele muszą istnieć, żeby Receptury, Imprezy i Zaopatrzenie działały poprawnie:

### Receptury i zaopatrzenie (kalkulator)
- `products` – słownik produktów (RecipeProduct)
- `unit_conversions` – przeliczniki jednostek
- `recipes` – dania/receptury (RecipeDish)
- `recipe_ingredients` – składniki receptur
- `tags` – tagi receptur (RecipeTag)
- `recipe_tags` – przypisanie tagów do receptur
- `recipe_history` – historia zmian receptur
- `event_packages` – pakiety imprez (np. Wesele)
- `event_package_items` – pozycje w pakiecie (receptura + porcje na osobę)
- `procurement_calculations` – zapisane kalkulacje zaopatrzenia
- `stock_minimums` – minimalne stany produktów

### Imprezy i kalendarz
- `events` – imprezy z Google Calendar
- `calendar_sync_log` – log synchronizacji
- `calendar_config` – konfiguracja kalendarzy

### Kolumna do sprawdzenia
- `recipes.status` – typ ENUM: tylko `'AKTYWNA'`, `'ARCHIWALNA'` (migracja 5 ustawia to i konwertuje stare SEZONOWA/TESTOWA na AKTYWNA).

---

## Skrypt weryfikacyjny (MySQL)

Uruchom na bazie produkcyjnej (np. po SSH na Hetzner, z credentials z `.env.deploy.hetzner`):

```bash
mysql -u [user] -p'[pass]' pos_karczma < scripts/verify-db-tables.sql
```

Albo wklej zapytania z `scripts/verify-db-tables.sql` do klienta MySQL.

Skrypt wypisze brakujące tabele (jeśli jakieś są) oraz listę wszystkich tabel w bazie.
