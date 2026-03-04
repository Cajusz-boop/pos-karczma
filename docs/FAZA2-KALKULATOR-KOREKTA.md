# Korekta specyfikacji — Faza 2 Kalkulator Zapotrzebowania

> Poprawki do `faza2-kalkulator-zapotrzebowania.md` (2024)

---

## 1. Źródło danych o imprezach

**Poprzednio:** HotelSystem, model `Reservation`

**KOREKTA:** Rezerwacje wesel/chrzcin/komunii są wyłącznie w **Google Calendar**. POS-Karczma nie korzysta z HotelSystem ani modelu Reservation w tym kontekście.

---

## 2. Model Event zamiast Reservation

Kalkulator używa modelu **Event** z fazy integracji Google Calendar (faza2a-google-calendar-integracja.md).

### 2.1 Pełna definicja Event (faza2a)

```prisma
model Event {
  id              Int       @id @default(autoincrement())
  googleEventId   String    @unique @db.VarChar(255)
  googleCalendarId String   @db.VarChar(255)
  calendarName    String?   @db.VarChar(200)
  eventType       EventType
  title           String    @db.VarChar(500)
  description     String?   @db.Text
  googleEventUrl  String?   @db.VarChar(500)
  startDate       DateTime
  endDate         DateTime
  roomName        String?   @db.VarChar(200)
  guestCount      Int?
  guestCountSource GuestCountSource?
  packageId       Int?
  notes           String?   @db.Text
  status          EventStatus
  syncedAt        DateTime  @default(now())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  package         EventPackage? @relation(...)
}

enum EventStatus { DRAFT | CONFIRMED | CANCELLED }
enum GuestCountSource { PARSED | MANUAL | PARSED_STRUCTURED }
```

**Uwaga implementacyjna:** Migracja tabeli `events` zostanie uruchomiona jako część fazy 2A. Na razie można budować kalkulator z założeniem, że tabela `events` istnieje z powyższymi polami. Schema Prisma zostanie uzupełniona przy implementacji fazy 2A.

### 2.2 Zapytanie kalkulatora
```sql
SELECT * FROM events WHERE status = 'CONFIRMED'
  AND startDate >= :weekStart AND endDate <= :weekEnd
  AND packageId IS NOT NULL AND guestCount IS NOT NULL
```

Logika: tylko imprezy potwierdzone (`status='CONFIRMED'`), z przypisanym pakietem i liczbą gości, mieszczące się w wybranym tygodniu.

---

## 3. Modele EventPackage i EventPackageItem

Budować zgodnie ze specyfikacją, z jedną istotną zmianą nazewnictwa:

| W specyfikacji | W schema.prisma (poprawna nazwa) |
|----------------|----------------------------------|
| Recipe         | **RecipeDish**                   |
| Product (receptury) | **RecipeProduct**          |

### EventPackageItem — relacje

```prisma
model EventPackageItem {
  id              Int           @id @default(autoincrement())
  packageId       Int
  recipeDishId    Int           // FK do RecipeDish (NIE Recipe!)
  portionsPerPerson Float       @default(1)
  notes           String?       @db.VarChar(200)
  sortOrder       Int           @default(0)

  package         EventPackage  @relation(...)
  recipeDish      RecipeDish    @relation(fields: [recipeDishId], references: [id])  // RecipeDish!
  @@map("event_package_items")
}
```

### EventPackage — relacja do Event

```prisma
model EventPackage {
  // ...
  items       EventPackageItem[]
  events      Event[]           // NIE Reservation[]
}
```

### Event — relacja do pakietu

Model Event (pełna definicja w sekcji 2.1) zawiera m.in. `packageId`, `guestCount`, `status`. Relacja: `package EventPackage?`.

---

## 4. Algorytm kalkulatora — zmiana źródła

**Zamiast:**
```typescript
const reservations = await prisma.reservation.findMany({...})
```

**Używać:**
```typescript
const events = await prisma.event.findMany({
  where: {
    status: 'CONFIRMED',
    startDate: { gte: weekStart },
    endDate:   { lte: weekEnd },
    packageId: { not: null },
    guestCount: { not: null }
  },
  include: {
    package: {
      include: {
        items: {
          include: {
            recipeDish: {   // NIE recipe!
              include: {
                ingredients: {
                  include: { product: true, subRecipe: true }  // product = RecipeProduct
                }
              }
            }
          }
        }
      }
    }
  }
})
```

Dalej: `aggregateIngredients(events, ...)` zamiast `aggregateIngredients(reservations, ...)`.

---

## 5. StockMinimum — relacja do RecipeProduct

```prisma
model StockMinimum {
  id          Int      @id @default(autoincrement())
  productId   Int      @unique   // FK do RecipeProduct (produkty recepturowe)
  minimum     Float
  unit        String   @db.VarChar(20)
  updatedAt   DateTime @updatedAt

  product     RecipeProduct @relation(fields: [productId], references: [id])
  @@map("stock_minimums")
}
```

---

## 6. Schemat przepływu danych (zaktualizowany)

```
┌─────────────────────┐
│   Google Calendar   │  imprezy: data, status, liczba gości, pakiet menu
│   (API + sync)      │
└────────┬────────────┘
         │ tabela events (status='CONFIRMED')
         ▼
┌─────────────────────┐
│   POS-Karczma       │  pakiet × goście = suma składników
│   Kalkulator        │  events → EventPackage → EventPackageItem → RecipeDish → RecipeDishIngredient → RecipeProduct
└────────┬────────────┘
         │
         ▼
  (Google Sheets / stany magazynowe — bez zmian)
```

---

## 7. Alert przy nowej imprezie

**Poprzednio:** „Trigger: nowa rezerwacja dodana do HotelSystem z packageId != null”

**KOREKTA:** Trigger: nowy event w Google Calendar (status=CONFIRMED) zsynchronizowany do tabeli `events` z `packageId != null` i `guestCount != null`.

---

## 8. Checklist implementacji

- [ ] Model Event z fazy2a (lub jego ekwiwalent) istnieje w schema.prisma
- [ ] EventPackage ma relację `events Event[]` (nie `reservations`)
- [ ] EventPackageItem używa `recipeDishId` → RecipeDish (nie `recipeId` → Recipe)
- [ ] StockMinimum używa `productId` → RecipeProduct
- [ ] Kalkulator pobiera `events` WHERE `status='CONFIRMED'`
- [ ] Dokumentacja i prompty używają nazw RecipeDish i RecipeProduct
