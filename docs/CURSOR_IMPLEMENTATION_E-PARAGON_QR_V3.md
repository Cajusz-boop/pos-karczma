# Implementacja Modułu E-Paragon i Płatności QR — POS-Karczma

> Dokument implementacyjny dla Cursor AI. Zawiera pełny kontekst istniejącej schemy Prisma,
> konkretne zmiany w modelach, endpointy API, komponenty frontend, KSeF i kolejność tasków.
>
> **Wersja:** 3.0 (po audycie)
> **Data:** 2026-03-03

---

## 1. Kontekst projektu

**System:** POS-Karczma (system POS dla restauracji Karczma Łabędź)
**Stack:** Next.js 14, TypeScript, Prisma ORM (v7+), MySQL, TailwindCSS
**Deploy:** Hetzner Cloud, PM2, GitHub Actions CI/CD
**Istniejące integracje:** POSNET (drukarki fiskalne), Booking.com (HotelSystem), Bistro Siplex

### Co robimy

System rachunków online i płatności QR przy stolikach (Pay-at-Table). Gość skanuje kod QR → widzi rachunek w przeglądarce → może podzielić płatność → płaci online (BLIK/Apple Pay/Google Pay). System obsługuje napiwki, fiskalizację na POSNET, e-paragon z trwałym linkiem do potwierdzenia i KSeF (obowiązek B2B od 01.04.2026).

### Przepływ danych

```
Stolik (QR) → Frontend (strona rachunku) → Backend API → Bramka płatnicza → Webhook
                                                                              ↓
                                                          ┌─────────────────────────────────────┐
                                                          │ 1. Payment + Tip (istniejące modele)│
                                                          │ 2. FiscalEvent → POSNET (paragon)   │
                                                          │ 3. Receipt (e-paragon z tokenem)    │
                                                          │ 4. Invoice → KSeF (jeśli NIP)       │
                                                          │ 5. SSE event → frontend refresh     │
                                                          └─────────────────────────────────────┘
```

**Komunikacja real-time:** Server-Sent Events (SSE) — jednokierunkowa (serwer → klient). NIE WebSockets.

---

*(Pełna treść dokumentu — skrócona w repo. Pełna wersja w źródle.)*

---

## Stan implementacji (2026-03-03)

**Zaimplementowano:**
- Sprint 1: Schemat Prisma (qrId, paidQuantity/lockedQuantity, OnlinePayment), API receipt, SSE, confirm, fallback
- Sprint 2: POST /pay, webhook Stripe, cron expire-qr-locks
- Sprint 3: ReceiptPage, OrderSummary, ReceiptItem, SplitBillModal, TipSelector, PaymentForm, PaymentSuccess, InvoiceToggle, OfflineNotice, ReceiptEmpty, strony /receipt/[qrId], /receipt/confirm/[token], /receipt/fallback
- Sprint 4: GET/POST /api/tables/[id]/qr (generowanie QR PNG)

**Do zrobienia:**
- Sprint 4: badge QR w widoku stolików, rozszerzenie fiscal-worker o ONLINE_PAYMENT
- Sprint 5: KSeF (createKsefInvoice w webhook), offline-queue, testy E2E

---

## Zmienne środowiskowe do dodania

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# E-paragon / QR
RECEIPT_BASE_URL=https://pos.karczma-labedz.pl/receipt

# Cron (opcjonalnie)
CRON_SECRET=...
```

---

## 13. Kolejność implementacji

### Sprint 1: Fundament (DB + API read) — ~7h ✓
### Sprint 2: Płatności (API write + Stripe) — ~11h ✓
### Sprint 3: Frontend — ~17h ✓
### Sprint 4: Admin + POSNET + QR — ~8h (częściowo)
### Sprint 5: KSeF + monitoring — ~13h

**Łączna estymacja: ~56h (7 dni roboczych)**
