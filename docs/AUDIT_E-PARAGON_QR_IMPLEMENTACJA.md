# Audyt implementacji E-Paragon + Płatności QR (Pay-at-Table)

> Dokument dla weryfikacji przez inną AI. Opisuje dokładnie co zostało zaimplementowane w każdym sprincie, z lokacjami plików i fragmentami kodu.

**Data:** 2026-03-03  
**Dokument odniesienia:** `docs/CURSOR_IMPLEMENTATION_E-PARAGON_QR_V3.md`

---

## Sprint 1: Schemat Prisma + migracja + API read (receipt, SSE, confirm)

### 1.1 Schemat Prisma

**Plik:** `prisma/schema.prisma`

**Zmiany w modelu `Table` (linia ~161):**
- `qrId String? @unique` — UUID v4 identyfikator kodu QR (null = brak QR)

**Zmiany w modelu `Order` (linia ~415):**
- `onlinePaymentStatus OnlinePaymentStatus @default(UNPAID)` — status płatności QR (UNPAID, PARTIAL, PENDING, PAID)

**Nowy enum `OnlinePaymentStatus` (linie 439–444):**
```prisma
enum OnlinePaymentStatus {
  UNPAID
  PARTIAL
  PENDING
  PAID
}
```

**Zmiany w modelu `OrderItem` (linie 510–511):**
- `paidQuantity Decimal @db.Decimal(10, 3) @default(0)` — ile już opłacono online
- `lockedQuantity Decimal @db.Decimal(10, 3) @default(0)` — ile jest w trakcie płatności (lock)

**Nowy model `OnlinePayment` (linie 565–587):**
- `id`, `orderId`, `provider`, `transactionId`, `amount`, `tipAmount`, `totalCharged`, `currency`, `status`
- `itemsJson`, `customerEmail`, `customerPhone`, `receiptToken`, `providerResponse`, `errorMessage`
- `createdAt`, `completedAt`, `expiresAt` — timeout na lock (np. 15 min)

**Istniejący model `Receipt`** (676–691) — używany z `deliveryMethod: "QR"`, `token`, `htmlContent`, `expiresAt`, `viewedAt`.

**Istniejący model `FiscalEvent`** (1591–1607) — używany z `type: "RECEIPT_PRINTED"`, `payloadJson` zawiera `source: "ONLINE_PAYMENT"`.

### 1.2 API publiczne (bez autoryzacji)

**Middleware:** `src/middleware.ts` (linie 25–29)
- Prefix `/api/public/` dodany do `PUBLIC_API_PREFIXES` — trasy publiczne pomijają JWT.
- Prefix `/api/webhooks/` również publiczny.

**Endpointy:**

| Endpoint | Plik | Opis |
|----------|------|------|
| `GET /api/public/table/[qrId]/receipt` | `src/app/api/public/table/[qrId]/receipt/route.ts` | Rachunek dla stolika — zwraca orderId, items (z paidQuantity, lockedQuantity, availableQuantity), totalGross, totalPaidOnline, totalLocked, totalRemaining, onlinePaymentStatus. 404 gdy brak stolika, 204 gdy brak aktywnego zamówienia. |
| `GET /api/public/table/[qrId]/sse` | `src/app/api/public/table/[qrId]/sse/route.ts` | Server-Sent Events — strumień eventów dla qrId. Subskrypcja przez `onTableEvent(qrId, handler)`, heartbeat co 30 s. |
| `GET /api/public/receipt/confirm/[token]` | `src/app/api/public/receipt/confirm/[token]/route.ts` | Trwały link potwierdzenia — zwraca htmlContent, fiscalNumber, paidAt, orderNumber, items, total. Receipt pobierany po `token`, 404 gdy brak, 410 gdy wygasł. Aktualizuje `viewedAt`. |
| `GET /api/public/fallback` | `src/app/api/public/fallback/route.ts` | Fallback dla uszkodzonego QR: `?tableNumber=5&roomId=xxx` → zwraca redirectUrl do `/receipt/{qrId}`. |

### 1.3 SSE event bus

**Plik:** `src/lib/sse/event-bus.ts`
- `emitTableEvent(qrId, event)` — wysyła event do kanału `table:{qrId}`
- `onTableEvent(qrId, handler)` — subskrybuje, zwraca funkcję `unsubscribe`

---

## Sprint 2: Płatności Stripe (pay, webhook, cron locków)

### 2.1 POST /api/public/table/[qrId]/pay

**Plik:** `src/app/api/public/table/[qrId]/pay/route.ts`

- Walidacja body (zod): `items: [{orderItemId, quantity}], tipPercent?, tipAmount?, provider: "STRIPE", customerEmail?, wantInvoice?, invoiceNip?`
- Sprawdza dostępność ilości (quantity - paidQuantity - lockedQuantity >= requested)
- W transakcji: `lockedQuantity += quantity` dla każdej pozycji, tworzy `OnlinePayment` (status PENDING, expiresAt +15 min), tworzy Stripe PaymentIntent, `order.onlinePaymentStatus = PENDING`
- Zwraca: `paymentId`, `clientSecret`, `totalAmount`, `tipAmount`, `totalCharged`, `confirmationUrl` (np. `{base}/receipt/confirm/{token}`)
- Konflikt 409 gdy ITEMS_UNAVAILABLE

### 2.2 Webhook Stripe

**Plik:** `src/app/api/webhooks/stripe/route.ts`

- `payment_intent.succeeded`:
  - Aktualizacja OnlinePayment (status SUCCESS, completedAt, providerResponse)
  - `lockedQuantity -= qty`, `paidQuantity += qty` dla items z itemsJson
  - Tworzy Payment (method CARD/BLIK), Tip jeśli tipAmount > 0
  - `order.onlinePaymentStatus = PAID` lub `PARTIAL` (gdy nie wszystko opłacone)
  - Tworzy FiscalEvent (type RECEIPT_PRINTED, payloadJson z source: ONLINE_PAYMENT)
  - Tworzy Receipt (deliveryMethod: "QR", token, htmlContent, expiresAt 30 dni)
  - Jeśli `wantInvoice=true` i `invoiceNip` — wywołuje `createKsefInvoiceFromPayment`
  - `emitTableEvent(qrId, { type: "PAYMENT_CONFIRMED" })`

- `payment_intent.payment_failed`:
  - Zwolnienie lockedQuantity, OnlinePayment status FAILED
  - `emitTableEvent(qrId, { type: "PAYMENT_FAILED" })`

**Zależności:** `@/lib/payment/stripe` (getStripe, getStripeWebhookSecret), `@/lib/audit`, `@/lib/sse/event-bus`

### 2.3 Cron expire-qr-locks

**Plik:** `src/app/api/cron/expire-qr-locks/route.ts`
- GET, opcjonalna autoryzacja `Authorization: Bearer {CRON_SECRET}`
- Wywołuje `processExpiredLocks(prisma)` z `src/lib/payment/expire-locks.ts`

**Plik:** `src/lib/payment/expire-locks.ts`
- Znajduje OnlinePayment gdzie status=PENDING i expiresAt < now
- W transakcji: `lockedQuantity -= qty`, OnlinePayment status=EXPIRED
- `emitTableEvent(qrId, { type: "ITEM_UNLOCKED" })`

---

## Sprint 3: Frontend (ReceiptPage, komponenty, i18n, fallback)

### 3.1 Strony

| Ścieżka | Plik | Opis |
|---------|------|------|
| `/receipt/[qrId]` | `src/app/receipt/[qrId]/page.tsx` | Server component renderujący `<ReceiptPage qrId={qrId} />` |
| `/receipt/confirm/[token]` | `src/app/receipt/confirm/[token]/page.tsx` | Strona potwierdzenia — fetch `/api/public/receipt/confirm/${token}` |
| `/receipt/fallback` | `src/app/receipt/fallback/page.tsx` | Fallback — formularz tableNumber + roomId, redirect do `/receipt/{qrId}` po fetch `/api/public/fallback?tableNumber=...&roomId=...` |

### 3.2 Komponenty

**Folder:** `src/components/receipt/`

| Komponent | Plik | Opis |
|-----------|------|------|
| ReceiptPage | ReceiptPage.tsx | Główny widok: fetch receipt, SSE subskrypcja, fazy view/split/pay/success. Wykorzystuje OrderSummary, ReceiptItem, SplitBillModal, TipSelector, PaymentForm, PaymentSuccess, OfflineNotice, ReceiptEmpty |
| OrderSummary | OrderSummary.tsx | Podsumowanie zamówienia |
| ReceiptItem | ReceiptItem.tsx | Pozycja rachunku |
| SplitBillModal | SplitBillModal.tsx | Podział rachunku na części |
| TipSelector | TipSelector.tsx | Wybór napiwku (%) |
| PaymentForm | PaymentForm.tsx | Formularz płatności — POST do `/api/public/table/${qrId}/pay`, Stripe Elements |
| PaymentSuccess | PaymentSuccess.tsx | Widok sukcesu z linkiem do potwierdzenia |
| InvoiceToggle | InvoiceToggle.tsx | Przełącznik faktury + NIP |
| OfflineNotice | OfflineNotice.tsx | Komunikat offline |
| ReceiptEmpty | ReceiptEmpty.tsx | Brak zamówienia |

**ReceiptPage flow:**
- fetch `/api/public/table/${qrId}/receipt`
- EventSource `/api/public/table/${qrId}/sse` — na PAYMENT_CONFIRMED / ORDER_UPDATED odświeża dane
- PaymentForm: POST `/api/public/table/${qrId}/pay`, Stripe.confirmCardPayment(clientSecret)

### 3.3 i18n

- `src/lib/i18n/use-locale.ts`, `translations` — ReceiptPage używa `useLocale()` i `translations[locale]` dla tekstów.

---

## Sprint 4: Badge QR przy stolikach, fiscal-worker ONLINE_PAYMENT, SSE emit z POS

### 4.1 Badge QR w ustawieniach sal

**Plik:** `src/app/(dashboard)/settings/rooms/page.tsx`

- Interfejs `TableData` zawiera `qrId?: string | null` (linia 36)
- API rooms zwraca `qrId` dla tabel (patrz 4.4)
- W widoku stolików (linie 234–242): badge `t.qrId ? "QR ✓" : "Brak QR"` z klasami emerald/muted
- Przyciski:
  - **Pobierz PNG** (Download) — GET `/api/tables/${t.id}/qr` → blob → download `stolik-${number}-qr.png` (tylko gdy qrId)
  - **Aktywuj / Regeneruj QR** (QrCode) — POST `/api/tables/${t.id}/qr` → fetchRooms()

### 4.2 API tables/[id]/qr

**Plik:** `src/app/api/tables/[id]/qr/route.ts`

- **GET** — zwraca PNG kodu QR (biblioteka qrcode) z URL `{RECEIPT_BASE_URL}/receipt/{qrId}`. Nagłówek `Content-Disposition: inline; filename="stolik-{number}-qr.png"`
- **POST** — generuje nowy qrId (crypto.randomUUID), aktualizuje Table, zwraca `qrId`, `url`, `message`

### 4.3 qrId w API rooms

**Plik:** `src/app/api/rooms/route.ts` (linia 78)
- W mapowaniu tabel: `qrId: t.qrId` — zwracane w odpowiedzi GET /api/rooms.

### 4.4 Fiscal worker — druk paragonów z płatności QR

**Plik:** `src/lib/fiscal/process-online-payment.ts`

- `processOnlinePaymentFiscalEvent(eventId)` — pobiera FiscalEvent, sprawdza type=RECEIPT_PRINTED, status=PENDING, payloadJson.source=ONLINE_PAYMENT
- Buduje `ReceiptPayload` i wywołuje `posnetDriver.printReceipt(receiptPayload)`
- Aktualizuje FiscalEvent (status OK/ERROR, fiscalNumber, errorMessage)
- Przy sukcesie: `receipt.updateMany` z fiscalNumber

**Cron:** `src/app/api/cron/process-fiscal-events/route.ts`
- GET, autoryzacja Bearer CRON_SECRET
- Pobiera FiscalEvent gdzie type=RECEIPT_PRINTED, status=PENDING, filtruje payloadJson.source=ONLINE_PAYMENT
- Dla każdego wywołuje `processOnlinePaymentFiscalEvent(ev.id)`
- Zwraca `{ ok, processed, total, errors }`

### 4.5 SSE emit z POS (sync/batch)

**Plik:** `src/app/api/sync/batch/route.ts`

- `emitOrderUpdatedForTable(orderId)` — znajduje Table po orderId, jeśli ma qrId emituje `emitTableEvent(qrId, { type: "ORDER_UPDATED", payload: {} })`
- Wywoływane po:
  - CREATE order (linia 388)
  - CANCEL orderItem (linia 446)
  - UPDATE_QUANTITY orderItem (linia 497)

---

## Sprint 5: KSeF w webhooku, offline-queue

### 5.1 KSeF w webhooku Stripe

**Plik:** `src/app/api/webhooks/stripe/route.ts` (linie 221–224)

```ts
if (intent.metadata?.wantInvoice === "true" && intent.metadata?.invoiceNip) {
  const { createKsefInvoiceFromPayment } = await import("@/lib/payment/create-ksef-invoice");
  await createKsefInvoiceFromPayment(tx as never, payment.orderId, intent.metadata.invoiceNip, itemsData, Number(payment.amount));
}
```

**Plik:** `src/lib/payment/create-ksef-invoice.ts`

- `createKsefInvoiceFromPayment(tx, orderId, buyerNip, items, amount)` — tworzy Invoice (STANDARD, ksefStatus: PENDING), mapuje fiscalSymbol → vatRate, oblicza net/vat/gross. Wywołuje `sendInvoiceToKsef(invoice.id)` asynchronicznie (setImmediate). KSeF client ma obsługę OFFLINE_QUEUED przy braku połączenia.

### 5.2 Offline-queue KSeF

**Istniejąca infrastruktura** (nie dodana w tym module, używana przez KSeF):
- `src/lib/ksef/client.ts` — `sendInvoiceToKsef` ustawia `ksefStatus: "OFFLINE_QUEUED"` przy błędzie połączenia
- `src/lib/ksef/index.ts` — eksportuje `retryOfflineQueue`
- `src/app/api/ksef/retry-queue/route.ts` — endpoint do ręcznego retry faktur w kolejce

**Uwaga:** Offline-queue w kontekście tego modułu oznacza, że faktury KSeF tworzone z webhooka korzystają z istniejącego klienta KSeF, który już ma obsługę OFFLINE_QUEUED i retry. Nowy kod nie dodaje osobnej kolejki — używa istniejącej.

---

## Zmienne środowiskowe

Do dodania w `.env`:
```env
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
RECEIPT_BASE_URL=https://pos.karczma-labedz.pl/receipt
CRON_SECRET=...  # opcjonalnie dla cron
```

---

## Sposób weryfikacji (dla AI)

1. **Sprint 1:** Sprawdź `prisma/schema.prisma` — Table.qrId, Order.onlinePaymentStatus, OrderItem.paidQuantity/lockedQuantity, model OnlinePayment, enum OnlinePaymentStatus. Sprawdź istnienie plików API pod `/api/public/`.
2. **Sprint 2:** Sprawdź `pay/route.ts` (POST z Stripe), `webhooks/stripe/route.ts` (payment_intent.succeeded/failed), `expire-qr-locks/route.ts`, `expire-locks.ts`.
3. **Sprint 3:** Sprawdź strony `/receipt/[qrId]`, `/receipt/confirm/[token]`, `/receipt/fallback` i komponenty w `src/components/receipt/`.
4. **Sprint 4:** Sprawdź `settings/rooms/page.tsx` (badge QR ✓, przyciski Download/QrCode), `tables/[id]/qr/route.ts`, `rooms/route.ts` (qrId), `process-online-payment.ts`, `process-fiscal-events/route.ts`, `sync/batch/route.ts` (emitOrderUpdatedForTable).
5. **Sprint 5:** Sprawdź wywołanie `createKsefInvoiceFromPayment` w webhooku Stripe oraz plik `create-ksef-invoice.ts`.
