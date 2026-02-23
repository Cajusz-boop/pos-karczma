# Sprawdzenie bazy danych MariaDB po prisma db push

**Data:** 2026-02-23  
**Baza:** pos_karczma @ 127.0.0.1:3306

---

## 1. Lista wszystkich tabel

```
_banqueteventtoroom    allergen              announcement           auditlog
banquetevent           banquetmenu           banquetmenumodification cardreaderconfig
cashdrawer             cashoperation         category               customer
customerdisplay        dailyreport           deliverydriver         deliverystreet
deliveryzone           discount              driversettlement       exportbatch
fiscalevent            giftvoucher           ingredient             invoice
kdsloadsnapshot        kdsorderarchive       kdsstation             kdsstationcategory
kitchenmessage         loyaltyreward         loyaltytransaction     modifier
modifiergroup          notification          order                  orderitem
payment                pendingpayment        printer                printercategory
printlog               product               productallergen        productmodifiergroup
productsuggestion      promotion             pushsubscription       receipt
receipterrorlog        recipe                recipeitem             reservation
role                   room                  roommerge              setcomponent
shift                  shiftswaprequest      staffavailability      stockitem
stockmove              supergroup            synclog                systemconfig
table                  taxrate               timeentry              tip
user                   usermacro             userpospreference      warehouse
workschedule           workstationconfig
```

**Razem:** 68 tabel

---

## 2. Nowe tabele offline-first (SyncLog, ReceiptErrorLog, FiscalEvent)

| Tabela | Istnieje | Struktura |
|--------|----------|-----------|
| **synclog** | ✅ | id, operationId, table, localId, serverId, serverVersion, success, processedAt |
| **receipterrorlog** | ✅ | id, orderId, paymentId, errorMessage, retryCount, resolvedAt, createdAt |
| **fiscalevent** | ✅ | id, orderId, paymentId, type, status, payloadJson, fiscalNumber, errorMessage, retryCount, createdAt, updatedAt |

**Rekordy w nowych tabelach:** 0 (tabele puste — gotowe na użycie)

---

## 3. Liczba rekordów w kluczowych tabelach

| Tabela | Liczba | Uwagi |
|--------|--------|-------|
| **product** | 198 | Dane zachowane |
| **order** | 185 | Dane zachowane |
| **payment** | 55 | Dane zachowane |
| **user** | 8 | Dane zachowane |

---

## 4. Werdykt

**BAZA OK**

- Wszystkie istniejące tabele mają dane (Product, Order, Payment, User nie zostały skasowane).
- Nowe tabele offline-first (SyncLog, ReceiptErrorLog, FiscalEvent) istnieją i mają poprawną strukturę.
- Prisma db push nie spowodował utraty danych.

---

## Informacja techniczna

- Prisma Studio nie działa z obecną wersją MariaDB (brak `json_arrayagg`) — znany bug. Sprawdzanie bazy: `mysql` CLI.
- Zapytania wykonane przez: `C:\xampp\mysql\bin\mysql.exe` (użytkownik: bistro_sync)
