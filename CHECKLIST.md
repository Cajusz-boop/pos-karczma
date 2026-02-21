# POS Karczma Łabędź — CHECKLIST IMPLEMENTACJI

> Zarządzane przez `python task_manager.py` (next / done / stats)
> Format: `- [ ] ID Opis` — ID jest wymagane!

---

## ✅ ZREALIZOWANE

- [x] F1.1 Przebudowa mapy stolików — styl Bistro Simplex
- [x] F1.2 Panel zamówienia — układ 35/65
- [x] F1.3 Ekran płatności — pełnoekranowy, duże przyciski
- [x] F1.4 Responsywność — telefon/tablet/desktop
- [x] F1.5 Nawigacja kontekstowa — POS vs Admin
- [x] F1.6 PWA — manifest.json, Service Worker, meta tagi
- [x] F2.1 Zdjęcia produktów — upload, API
- [x] F2.2 Sprzedaż sugerowana — model, API, popup
- [x] F2.3 Filtrowanie alergenów — komponent
- [x] F2.4 Historia klientów — model Customer, API
- [x] F2.5 Tryb offline — Service Worker cache
- [x] F2.6 Promocje/Happy Hour — API
- [x] F2.7 Rejestr czasu pracy — strona, API
- [x] F2.8 Automatyczna lista zakupów — API
- [x] F3.1 E-paragon — model Receipt, generator HTML
- [x] F3.2 E-paragon API — publiczny endpoint, strona
- [x] F3.3 Bramka SMS — SMSAPI.pl
- [x] F3.4 E-paragon w płatności — QR + SMS
- [x] F4.1 Mobilny POS UX — touch, animacje
- [x] F5.1 Polerowanie — skróty klawiszowe, CSS
- [x] K1.1 KDS ciemne tło — duże czcionki, kolory statusu
- [x] K1.2 KDS 3 tryby — Kafelkowy, All-Day Count, Expo
- [x] K1.3 KDS bon 80mm — ilość przed nazwą, alergeny, storno
- [x] K1.4 KDS dźwięki — nowe zamówienie, alarm
- [x] K1.5 KDS czcionki — SM/MD/LG/XL, wł/wył dźwięków

---

## 1. BLOKERY PRODUKCJI

- [x] B1 Naprawić auth.ts — użyć bcrypt zamiast plaintext (hashPin/verifyPin to stub)
- [x] B2 Dodać middleware.ts — weryfikacja JWT na wszystkich API routes
- [x] B3 Dodać sesje po logowaniu — httpOnly cookie z JWT
- [x] B4 Dodać Zod do walidacji inputów we wszystkich API routes
- [x] B5 Walidacja płatności — suma payments musi równać się sumie zamówienia
- [x] B6 Blokada podwójnej płatności za to samo zamówienie
- [x] B7 Anulowanie zamówienia — sprawdzić czy nie ma płatności
- [x] B8 orders/close — zwracać receiptToken i generować htmlContent
- [x] B9 Strona zarządzania produktami — CRUD (tworzenie, edycja cen, dostępność)
- [x] B10 Strona zarządzania użytkownikami — CRUD (tworzenie, zmiana PIN, role)
- [x] B11 Ikony PWA — stworzyć icon-192.png i icon-512.png

---

## 2. LOGOWANIE KAPSUŁKĄ

- [x] C1 Dodać tokenId i tokenType do User w schema Prisma
- [x] C2 Endpoint /api/auth/token-login — logowanie kapsułką
- [x] C3 Obsługa czytnika Dallas iButton USB — WebHID lub keyboard wedge
- [x] C4 Obsługa NFC na telefonie — Web NFC API Chrome Android
- [x] C5 UI logowania — ekran Przyłóż kapsułkę, animacja, fallback PIN
- [x] C6 Parowanie kapsułki z kelnerem w ustawieniach

---

## 3. OPERACJE DZIENNE

- [x] O1 Zamknięcie dnia — raport dobowy fiskalny, zamknięcie zmian, rozliczenie kasy
- [x] O2 Zamknięcie zmiany kelnera — deklaracja gotówki, niedobór/nadwyżka, raport
- [x] O3 Obsługa szuflady kasowej — wpłata, wypłata, otwarcie, logowanie
- [x] O4 Drukarka fiskalna — konfiguracja prawdziwej drukarki, raporty dobowe/okresowe
- [x] O5 Korekty i zwroty — korekta paragonu, zwrot pieniędzy, korekta faktury

---

## 4. COMPLIANCE

- [x] L1 JPK_VAT — generowanie JPK_V7M XML zgodnego ze schematem MF
- [x] L2 KSeF pełny — auto-wysyłanie faktur, polling statusu, retry, UPO
- [x] L3 RODO/GDPR — zgoda na przetwarzanie, prawo do usunięcia, eksport danych

---

## 5. NAPRAWY

- [x] N1 Podłączyć SuggestionPopup do OrderPageClient
- [x] N2 Podłączyć AllergenFilter do OrderPageView
- [x] N3 Stworzyć useOfflineStore.ts i offline/sync.ts
- [x] N4 Zaimplementować flow Na wynos i Szybki paragon
- [x] N5 Uruchomić prisma generate i usunąć ts-nocheck z 7 plików

---

## 6. SZYBKOŚĆ SPRZEDAŻY

- [x] S1 Panel Popularne — TOP 8 produktów na górze menu
- [x] S2 Kliknięcie pozycji na rachunku równa się plus jeden ilość
- [x] S3 Prefetch danych zamówienia przy kliknięciu stolika
- [x] S4 Kategorie jako zakładki tabs zamiast nawigacji w głąb
- [x] S5 Długie naciśnięcie produktu równa się popup Ile z przyciskami 1-9
- [x] S6 Długie naciśnięcie stolika równa się menu kontekstowe Rachunek Przenieś
- [x] S7 Gotówka domyślnie Odliczone — kwota wpisana automatycznie
- [x] S8 E-paragon opcjonalny — po płatności od razu wróć do mapy
- [x] S9 Pasek ostatnio dodanych produktów pod wyszukiwarką
- [x] S10 Automatyczne domyślne modyfikatory
- [x] S11 Wibracja 50ms przy dodaniu produktu jako potwierdzenie

---

## 7. INFRASTRUKTURA

- [x] I1 Automatyczny backup bazy danych cron i procedura restore
- [x] I2 Health check endpoint /api/health
- [x] I3 Strategia deployment — Docker, SSL/HTTPS, rollback
- [x] I4 Logowanie błędów — integracja Sentry
- [x] I5 Rate limiting na API

---

## 8. ANALITYKA KUCHNI

- [x] A1 Dodać startedAt do OrderItem — kiedy kucharz kliknął Zaczynam
- [x] A2 Dodać preparedByUserId do OrderItem — który kucharz przygotował
- [x] A3 Dodać kdsStationId do OrderItem — na której stacji
- [x] A4 Dodać estimatedPrepMinutes do Product — norma czasowa
- [x] A5 Implementować ustawianie servedAt — kelner potwierdza odbiór
- [x] A6 Dashboard szefa kuchni — metryki real-time i dzienne
- [x] A7 Raporty wydajności — czasy per danie, stacja, kucharz
- [x] A8 Inteligentne priorytety KDS — sortowanie po czasie do normy
- [x] A9 Fire timing — opóźnianie wysłania przystawki
- [x] A10 Auto-uczenie normatywów — mediana po 50 zamówieniach
- [x] A11 Predykcja obłożenia — alert przed szczytem
- [x] A12 Analiza strat — koszt anulowanych dań
- [x] A13 Raport wąskiego gardła per stolik
- [x] A14 Rejestracja obłożenia — ile zamówień jednocześnie na KDS

---

## 9. SOFTPOS

- [x] P1 API integracji z Stripe Terminal lub PolCard Go
- [x] P2 Ekran płatności NFC na telefonie kelnera
- [x] P3 Fallback na zewnętrzny terminal i tryb demo

---

## 10. WEB PUSH

- [x] W1 Subskrypcja kelnerów — VAPID keys, endpoint subscribe
- [x] W2 KDS wysyła push gdy danie gotowe
- [x] W3 UI powiadomień na telefonie — dźwięk, wibracja, banner
- [x] W4 Historia powiadomień, oznaczanie jako przeczytane

---

## 11. INTEGRACJA HOTEL

- [x] H1 Klient API hotelu — getOccupiedRooms, postRoomCharge
- [x] H2 Nowa forma płatności Na pokój w PaymentDialog
- [x] H3 Proxy API endpoints hotel/rooms i hotel/charge
- [x] H4 Widok śniadaniowy /kitchen/breakfast
- [x] H5 Synchronizacja gości hotel i POS

---

## 12. BIZNES

- [x] V1 Vouchery karty podarunkowe — sprzedaż, płatność, saldo
- [x] V2 Program lojalnościowy — punkty, progi, karta stałego klienta
- [x] V3 Obsługa walut obcych — przelicznik EUR/USD
- [x] V4 Split bill per osoba — podział równo na N osób, każda część osobna płatność i paragon
- [x] V5 Podział i pooling napiwków — raport per kelner, pula wspólna, konfiguracja podziału
- [x] V6 Zamówienia telefoniczne i dostawy — numer telefonu/pokoju, adres, status dostawy
- [x] V7 Food cost i marża — koszt składników per danie, raport food cost, alert gdy powyżej progu
- [x] V8 Menu engineering — macierz BCG menu (gwiazdy, konie, zagadki, psy), raport z rekomendacjami
- [x] V9 Eksport do systemów księgowych — Optima, Symfonia, wFirma format CSV/XML

---

## 12B. ZARZĄDZANIE DANYMI W USTAWIENIACH

- [x] D1 CRUD kategorii — tworzenie, edycja, kolejność, kolor, ikona, sezonowe menu
- [x] D2 CRUD modyfikatorów — grupy, opcje, ceny, wymagane/opcjonalne
- [x] D3 CRUD stawek VAT — dodawanie, edycja symboli fiskalnych
- [x] D4 Import/eksport menu CSV — import produktów z pliku, eksport do pliku
- [x] D5 CRUD sal i stolików — dodaj/edytuj salę, stoliki, liczba miejsc, sezonowe
- [x] D6 Edytor układu stolików — drag-and-drop na mapie sali, łączenie stolików
- [x] D7 CRUD drukarek — dodaj/edytuj drukarkę, przypisz kategorie, test wydruku
- [x] D8 Konfiguracja KDS w ustawieniach — progi czasowe, dźwięki, stacje, tryb domyślny

---

## 12C. HR I ZESPÓŁ

- [x] G1 Grafik pracy — planowanie kto pracuje kiedy, widok tygodniowy/miesięczny
- [x] G2 Dostępność kelnerów — kto może w danym dniu, zamiana zmian
- [x] G3 Tablica ogłoszeń — komunikaty managera dla zespołu, notatki dzienne
- [x] G4 Tablica 86 — kucharz oznacza produkt niedostępny, auto-aktualizacja w POS, push do kelnerów

---

## 13. UX I DOKUMENTACJA

- [x] U1 Dokumentacja użytkownika — instrukcja kelnera, kucharza, właściciela
- [x] U2 Ekran pierwszego startu — kreator konfiguracji
- [x] U3 Tryb szkoleniowy demo — ćwiczenie bez wpływu na dane

---

## 14. TESTY

- [x] T1 Logowanie PIN, otwarcie zmiany, wylogowanie
- [x] T2 Pełny flow zamówienia — stolik, produkty, kuchnia, płatność, e-paragon
- [x] T3 KDS flow — zamówienie, zaczynam, gotowe, push
- [x] T4 Mobilny POS — responsywność, touch, PWA install
- [x] T5 SoftPOS — płatność NFC tryb demo
- [x] T6 E-paragon — QR, SMS, strona publiczna
- [x] T7 Bezpieczeństwo — API bez tokena 401, PIN bcrypt
- [x] T8 Płatności — za mało, podwójnie, anulować opłacone
- [x] T9 CRUD produktów — dodaj, edytuj, dezaktywuj
- [x] T10 CRUD użytkowników — dodaj kelnera, zmień PIN
- [x] T11 Szybkość — 3 dania w max 10 kliknięć, rachunek w 4
- [x] T12 Kapsułka — Dallas USB, NFC, nieznana, parowanie
- [x] T13 Logowanie negatywne — błędny PIN, blokada, wygasłe konto
- [x] T14 Zamówienia negatywne — stolik reserved, 0 produktów, 99 pozycji
- [x] T15 Płatności graniczne — 0.01zł, 9999zł, MIX, rabat 100%
- [x] T16 Operacje negatywne — przenieś zajęty, podziel 0, storno SERVED
- [x] T17 KDS stress — 20 zamówień, 12h bez odświeżania, memory leak
- [x] T18 Bonownik — 1 poz, 10 poz, 40 znaków, alergeny, storno
- [x] T19 E-paragon negatywne — zły token, wygasły, zły numer SMS
- [x] T20 Rezerwacje — konflikt, przeszła data, no-show
- [x] T21 Magazyn — auto-odliczenie, brak składnika, inwentaryzacja
- [x] T22 Raporty — dzienny, zmianowy, produkty, VAT, Excel
- [x] T23 Bankiety — 5 kursów, zwolnienie, extra, faktura zaliczkowa
- [x] T24 Współbieżność — 2 kelnerów, 5 terminali, 50 zamówień
- [x] T25 Wydajność — 50 stolików 1s, 200 produktów 1s, 100k zamówień 5s
- [x] T26 Walidacja inputów — ujemne kwoty, SQL injection, null body
- [x] T27 Przeglądarki — Chrome, Safari, Samsung, TV, tablet
- [x] T28 Dostępność — Tab, kontrast WCAG, daltonizm, 44px
- [x] T29 Znaki specjalne — polskie, emoji, 40 znaków, NIP myślniki
- [x] T30 Odporność na awarie — baza offline, timeout, utrata WiFi
- [x] T31 Audit log — anulowanie, storno, rabat, zmiana ceny
- [x] T32 Zamknięcie dnia i zmiany
- [x] T33 Szuflada kasowa
- [x] T34 Korekty i zwroty
- [x] T35 Drukarka fiskalna pełny flow
- [x] T36 JPK i KSeF
- [x] T37 RODO GDPR
- [x] T38 Backup i restore
- [x] T39 Vouchery i lojalność
- [x] T40 Onboarding i tryb demo
- [x] T41 Hotel — płatność na pokój
- [x] T42 Hotel — śniadania
- [x] T43 Smoke test po deploy
- [x] T44 Regresja po zmianach
- [x] T45 Automatyczne testy API Playwright Jest
- [x] T46 Spójność bazy danych
- [x] T47 Migracja bazy
- [x] T48 Strefy czasowe
- [x] T49 Uprawnienia RBAC
- [x] T50 Promocje złożone
- [x] T51 Faktury pełny flow
- [x] T52 Wolna sieć 3G
- [x] T53 Memory leak 8h 12h
- [x] T54 Import eksport CSV Excel JPK
- [x] T55 Dane historyczne
- [x] T56 Scenariusze z życia restauracji
- [x] T57 Analityka kuchni — dashboard, normatywy, wąskie gardła
- [x] T58 Pełny flow zamówienia E2E — stolik, produkty, kuchnia, płatność, e-paragon
- [x] T59 Split bill per osoba — podział równo, per osoba, osobne paragony
- [x] T60 Napiwki — podział, pool, raport per kelner
- [x] T61 Zamówienia telefoniczne — z pokoju, z dostawą, status
- [x] T62 Food cost — koszt per danie, raport, alert powyżej progu
- [x] T63 Menu engineering — macierz BCG, rekomendacje
- [x] T64 CRUD kategorii i modyfikatorów — tworzenie, edycja, kolejność
- [x] T65 Edytor stolików drag-and-drop — przesuwanie, łączenie, zapisywanie
- [x] T66 Tablica 86 — oznacz niedostępny na KDS, aktualizacja POS, push
- [x] T67 Grafik pracy — planowanie, dostępność, zamiana zmian
- [x] T68 Integracja hotelowa E2E — obiad na pokój, śniadanie, checkout z rachunkiem
- [x] T69 Load test — 50 użytkowników, 200 zamówień/h, baza 500k rekordów
- [x] T70 Aktualizacja systemu — upgrade bez utraty danych, rollback

## 15. DOSTAWY I KIEROWCY

- [x] DK1 Strefy dostaw — CRUD, numer, nazwa, sortowanie
- [x] DK2 Prowizja kierowcy per strefa — kwota za każdą dostawę
- [x] DK3 Koszt dostawy per strefa — doliczany do zamówienia
- [x] DK4 Baza ulic → strefa — auto-rozpoznanie strefy z adresu
- [x] DK5 Kierowcy — lista, typ pojazdu, rejestracja, telefon, dostępność
- [x] DK6 Przypisanie kierowcy do zamówienia — API /api/delivery/assign
- [x] DK7 Panel dostaw — widok aktywnych zamówień, statusy, kierowcy
- [x] DK8 Rozliczenie kierowcy — generuj, gotówka, prowizja, zamknij
- [x] DK9 Min. zamówienie na darmową dostawę — per strefa
- [x] DK10 Import ulic — bulk import do strefy (format nazwa;od;do)
- [x] DK11 Widok dostawy w POS — /delivery z przypisaniem kierowców
- [x] DK12 Status dostawy push — powiadomienie kierowca, kelner, admin
- [x] DK13 Estymacja czasu dostawy — per strefa (estimatedMinutes)
- [x] DK14 Raport dostaw — dzienny, per kierowca, per strefa

## 16. MINUTNIK I OGIEŃ

- [x] ZD1 Kursy/dania — już w OrderItem.courseNumber + release-course
- [x] ZD2 Minutnik per pozycja — delayMinutes, fireAt, API /items/[itemId]/delay
- [x] ZD3 Minutnik całe danie — API /orders/[id]/course-delay
- [x] ZD4 "Ogień" — isFire, firedAt, push notification, API /items/[itemId]/fire

## 17. PRODUKTY WAGOWE

- [x] PW1 Flagi produktu wagowego — isWeightBased, requiresWeightConfirm, unit, tareWeight
- [x] PW2 Status wagi w pozycji — weightConfirmed, confirmedWeight, weightConfirmedAt
- [x] PW3 Waga przez kod kreskowy — PUT /items/[itemId]/weight (parsowanie EAN-13)
- [x] PW4 Seryjne zatwierdzanie wagi — /api/orders/weight-scan (bulk scan)
- [x] PW5 Odczyt masy z wagi elektronicznej — lib/scale/scale-service.ts + API /api/scale
- [x] PW6 Auto odczyt masy przy wyborze produktu — parseScaleBarcode + getCurrentWeight()

## 18. ZESTAWY I NADGRUPY

- [x] ZA1 Nadgrupy towarowe — model SuperGroup (1-10), przypisanie kategorii
- [x] ZA2 API nadgrup — CRUD /api/super-groups
- [x] ZA3 Typy produktów — ProductType enum (REGULAR, SET, HELPER_SET, ADDON, ADDON_GLOBAL)
- [x] ZA4 Składniki zestawu — model SetComponent, relacje Set→Product
- [x] ZA5 API składników zestawu — CRUD /api/products/[id]/components
- [x] ZA6 Tryby ceny zestawu — SetPriceMode (OWN_PRICE, CALCULATED, CALCULATED_SINGLE)
- [x] ZA7 Flagi produktów — isAddonOnly, isHidden, noPrintKitchen, printWithMinus, canRepeat
- [x] ZA8 UI Ustawienia zestawów — /settings/sets, zarządzanie nadgrupami i składnikami
- [x] ZA9 Składniki w zamówieniu — API /orders/[id]/items/[itemId]/components
- [x] ZA10 Wymiana składnika — API /items/[itemId]/swap-component
- [x] ZA11 Zestaw helper — API /orders/[id]/add-helper-set
- [x] ZA12 Max składników — maxComponents w Product (już w modelu)
- [x] ZA13 Darmowe składniki — freeComponents w Product (już w modelu)

## 19. FUNKCJE ZAMÓWIEŃ DODATKOWE

- [x] ZD5 Na wynos per pozycja — API /items/[itemId]/takeaway
- [x] ZD6 Notatki z typem — NoteType enum (STANDARD, ALLERGY, MODIFICATION, RUSH)
- [x] ZD7 Priorytety pozycji — isRush, isPriority, printBold
- [x] ZD8 API notatek — PUT/GET/DELETE /items/[itemId]/note
- [x] ZD9 Dodatek odejmowany — API /items/[itemId]/subtract (toggle BRAK)
- [x] ZD10 Lista kursów 1/2/3 — API /orders/[id]/courses (GET/PATCH/POST)
- [x] ZD11 Ręczna kolejność pozycji — API /orders/[id]/reorder-items (PUT/PATCH)
- [x] ZD12 Łącz podobne pozycje — API /orders/[id]/merge-items
- [x] ZD13 Kopia zamówienia — API /orders/[id]/copy
- [x] ZD14 Limit zamówienia — API /orders/[id]/limit, maxTotal w Order
- [x] ZD15 Ilość osób przy stoliku — API /orders/[id]/guests, guestCount w Order

## 20. UPRAWNIENIA SZCZEGÓŁOWE

- [x] UP1 Dostęp do kategorii per user — allowedCategoryIds w User
- [x] UP2 Dostęp do stolików per user — allowedTableIds w User
- [x] UP3 Dostęp do poziomów cenowych — allowedPriceLevelIds w User
- [x] UP4 PIN BistroMo — pinBistroMo (osobny PIN na bonownik)
- [x] UP5 Uprawnienia szczegółowe JSON — permissionsJson w User
- [x] UP6 Zakładki uprawnień — access, hall, operations, prohibitions, reports, receipt, order, delivery, config
- [x] UP7 Konfiguracja przycisków F4 — uiButtonGroups w User
- [x] UP8 Kopiowanie uprawnień — POST /users/[id]/permissions/copy
- [x] UP9 Eksport użytkownika — GET /api/users/export?id=xxx
- [x] UP10 Import użytkownika — POST /api/users/import
- [x] UP11 Auto wylogowanie — autoLogoutSec (0/20/40/60s)
- [x] UP12 Limit rabatu per user — API /orders/[id]/discount/validate
- [x] UP13 UI uprawnień — strona /settings/users/[id]/permissions

## 21. INTERFEJS ZAMÓWIENIA

- [x] IZ1 Tryb klawiatury numerycznej — keyboardMode w UserPosPreference
- [x] IZ2 ILOŚĆ*KOD*CENA — API /api/products/quick-entry
- [x] IZ3 Szukaj T9 — API /api/products/search?t9=xxx
- [x] IZ4 Szukaj po kodzie w grupie — API /api/products/search?code=xxx&categoryId=xxx
- [x] IZ5 Konfiguracja rzędów przycisków — buttonRows (4-6) w UserPosPreference
- [x] IZ6 Makra użytkownika (1-5) — model UserMacro, API /users/[id]/macros
- [x] IZ7 Preferencje POS — model UserPosPreference, API /users/[id]/pos-preferences
- [x] IZ8 Szybkie ilości — quickAmounts [0.25, 0.5, 1, 2, 5]
- [x] IZ9 Ulubione produkty — favoriteProducts w UserPosPreference
- [x] IZ10 Ostatnio używane — recentProducts (auto-aktualizowane)
- [x] IZ11 Gotówka w kasie — API /api/cash/current
- [x] IZ12 UI integracja — API gotowe do integracji z komponentami POS

## 22. DRUKARKI KUCHENNE

- [x] DRK1 Rozszerzony model Printer — charsPerLine, codePage, cutAfterPrint, openDrawer
- [x] DRK2 Szablony wydruków — templatesJson (header, footer, item, storno, addon, set, component, course, timer, fire)
- [x] DRK3 Pseudozmienne — $[Nazwa,30,0]$, $[Ilosc,3,1]$, ~50 zmiennych
- [x] DRK4 API szablonów — GET/PUT /api/printers/[id]/templates
- [x] DRK5 Reset do domyślnych — POST /api/printers/[id]/templates/reset
- [x] DRK6 Log/dziennik wydruków — model PrintLog, API /api/printers/[id]/logs
- [x] DRK7 Statusy wydruku — PENDING, PRINTING, PRINTED, FAILED
- [x] DRK8 Zdalny serwer — remoteServer dla drukarki przez sieć
- [x] DRK9 Czyszczenie starych logów — DELETE /api/printers/[id]/logs?olderThanDays=100
- [x] DRK10 Sterownik ESC/POS — lib/printer/escpos.ts + print-service.ts
- [x] DRK11 UI konfiguracji szablonów — /settings/printers/[id]/templates

## 23. KONFIGURACJA GLOBALNA

- [x] OG1 Maksymalny nr zamówienia — maxOrderNumber w SystemConfig
- [x] OG2 Zerowanie licznika przy nowym dniu — resetOrderNumberDaily
- [x] OG3 Zerowanie po raporcie zmiany — resetOrderNumberAfterShift
- [x] OG4 Deklaracja gotówki per kelner — cashDeclarationPerUser
- [x] OG5 Raport zmiany per stanowisko — shiftReportPerWorkstation
- [x] OG6 Własna numeracja faktur — useOwnInvoiceNumbers
- [x] OG7 Utrzymuj datę przez zmianę — maintainDateAcrossShift
- [x] OG8 Czas od ostatniej modyfikacji — timeFromLastModification
- [x] OG9 Błąd wydruku fiskalnego — fiscalErrorAllowContinue
- [x] OG10 Powiadomienie przed rezerwacją — reservationAlertMinutes
- [x] OG11 Opisy rozchodów RW — rwDocumentTypes
- [x] OG12 Opisy VAT — vatDescriptions per stawka
- [x] OG13 API konfiguracji — GET/PUT/PATCH/DELETE /api/system-config

## 24. KONFIGURACJA STANOWISK

- [x] OL1 Model WorkstationConfig — konfiguracja per stanowisko POS
- [x] OL2 Zakres kategorii — allowedCategoryIds
- [x] OL3 Zakres sal — allowedRoomIds
- [x] OL4 Domyślny poziom cenowy — defaultPriceLevelId
- [x] OL5 Pytaj o ilość (niewagowe/wagowe) — askQuantityRegular, askQuantityWeighted
- [x] OL6 Pytaj o cenę — askPrice, askPriceManual
- [x] OL7 Wyślij do kuchni bez pytania — autoSendKitchen
- [x] OL8 Zmiana operatora = wyjście — autoLogoutOnChange
- [x] OL9 Odśwież bazę po wyjściu — refreshOnExit
- [x] OL10 Pokaż grupę "inne" — showOtherGroups
- [x] OL11 Kolejność rachunków — ordersOldestFirst
- [x] OL12 Tylko zamówienia zalogowanego — showOnlyOwn
- [x] OL13 Wtyczki — pluginOnEnter, pluginOnExit
- [x] OL14 API stanowisk — GET/POST/PATCH/DELETE /api/workstations

## 25. KDS ROZSZERZENIA

- [x] KDS1 Rozszerzony model KDSStation — showTableNumber, showOrderNumber, showWaiterName, showDescription
- [x] KDS2 Konfiguracja scrollowania — autoScrollNew, confirmBeforeStatus, requireAllConfirm, removeOnConfirm
- [x] KDS3 Broadcast UDP — udpBroadcast, udpHost, udpPort
- [x] KDS4 Archiwum zrealizowanych — model KDSOrderArchive
- [x] KDS5 API archiwum — GET/POST/DELETE /api/kds/archive
- [x] KDS6 Statystyki czasu przygotowania — avgPrepTime, minPrepTime, maxPrepTime
- [x] KDS7 API konfiguracji stacji — GET/PUT /api/kds/stations/[id]/config
- [x] KDS8 Panel dla klientów (TV) — model CustomerDisplay
- [x] KDS9 API panelu klientów — GET/POST/PATCH/DELETE /api/customer-display
- [x] KDS10 Dane do wyświetlenia — GET /api/customer-display/[id]/orders

## 26. RAPORTY ROZSZERZENIA

- [x] RP1 Raport stolików — GET /api/reports/tables (sprzedaż per stolik)
- [x] RP2 Podział na kategorie — categoryBreakdown per stolik
- [x] RP3 Średnie per gość/zamówienie — avgPerOrder, avgPerGuest
- [x] RP4 Raport zmiany rozszerzony — GET /api/reports/shift-extended
- [x] RP5 Podział na produkty — byProduct w raporcie
- [x] RP6 Podział na płatności — byPayment w raporcie
- [x] RP7 Rabaty w raporcie — discounts count/total
- [x] RP8 Statystyki dokumentów — receiptCount, invoiceCount, emptyOrderCount
- [x] RP9 Anulowane pozycje — cancelledItemCount

## 27. STOLIKI ROZSZERZENIA

- [x] ST1 Rozszerzony model Table — width, height, rotation, zIndex, description
- [x] ST2 Dostępność stolika — isAvailable (szary = niedostępny)
- [x] ST3 Dwa zamówienia — allowMultipleOrders
- [x] ST4 Własny kolor — customColor
- [x] ST5 API layout stolika — GET/PUT/POST /api/tables/[id]/layout
- [x] ST6 Obracanie stolika — POST z direction "cw"/"ccw"
- [x] ST7 Tło sali — backgroundImage, backgroundOpacity w Room
- [x] ST8 Elementy wystroju — decorElements JSON w Room
- [x] ST9 API tła sali — GET/PUT/PATCH/DELETE /api/rooms/[id]/background
- [x] ST10 Kolory statusów — GET/PUT/DELETE /api/settings/table-colors

## 28. FUNKCJE MENADŻERA

- [x] FM1 Fiskalizacja zbiorcza — GET/POST /api/manager/fiscalize-batch
- [x] FM2 Archiwum konfiguracji — GET/POST/DELETE /api/manager/config-backup
- [x] FM3 Tworzenie kopii zapasowej — systemConfigs, printers, rooms, tables
- [x] FM4 Pobieranie kopii — download jako JSON
- [x] FM5 Numerator zamówień — GET/POST/PUT /api/manager/order-counter
- [x] FM6 Reset numeratora — startFrom, confirm
- [x] FM7 Maksymalny numer — maxOrderNumber setting
- [x] FM8 Usuwanie starych rachunków — GET/DELETE /api/manager/cleanup-orders
- [x] FM9 Preview przed usunięciem — count, sample, cutoff

## 29. FLAGI PRODUKTÓW

- [x] PF1 Rozszerzone flagi — maxPerOrder, noGeneralDesc, isDefaultTemplate
- [x] PF2 Kopiowanie produktu — POST /api/products/[id]/copy
- [x] PF3 Kopiowanie z modyfikatorami — modifierGroups i modifiers
- [x] PF4 Kopiowanie z alergenami — productAllergens
- [x] PF5 Kopiowanie zestawów — setComponents
- [x] PF6 Domyślne ustawienia — GET/PUT/POST/DELETE /api/products/defaults
- [x] PF7 Szablon domyślny — isDefaultTemplate flag
- [x] PF8 Zastosuj do produktu — POST z productId
- [x] PF9 Zastosuj do kategorii — POST z categoryId

## 30. AUTORYZACJA ROZSZERZONA

- [x] AR1 Rozszerzony TokenType — MAGNETIC_COM, MAGNETIC_USB, RFID_CLAMSHELL, DALLAS_*
- [x] AR2 Model CardReaderConfig — comPort, baudRate, dataBits, parity
- [x] AR3 API czytników — GET/POST/PATCH/DELETE /api/card-readers
- [x] AR4 Domyślne ustawienia per typ — READER_TYPE_DEFAULTS
- [x] AR5 Autoryzacja tokenem — POST /api/auth/token
- [x] AR6 Przypisywanie tokenu — PUT /api/auth/token
- [x] AR7 Usuwanie tokenu — DELETE /api/auth/token
- [x] AR8 Ręczny wybór kelnera — GET/POST/PUT /api/auth/select-user
- [x] AR9 Włączanie/wyłączanie ręcznego wyboru — allowManualUserSelect

## 31. OPCJE LOKALNE ROZSZERZONE

- [x] OL15 Wyloguj po wyjściu z zamówienia — logoutOnOrderExit
- [x] OL16 Wymuszaj wybór kelnera — forceSelectWaiter
- [x] OL17 Nie sumuj podobnych — mergeSimilarItems
- [x] OL18 Pytaj o ilość osób — askGuestCount
- [x] OL19 Drukuj w kuchni przy płatności — printKitchenOnPay
- [x] OL20 Drukuj natychmiast — printOnEveryChange
- [x] OL21 Raport fiskalny z raportem zmiany — fiscalWithShift
- [x] OL22 Faktury z opisem ogólnym — invoiceWithGenDesc
- [x] OL23 Pytaj czy fiskalizować — askFiscalize
- [x] OL24 Komunikaty o zatwierdzeniu — confirmReceipt
- [x] OL25 Komunikaty o wysłaniu — confirmKitchen
- [x] OL26 Nie drukuj zerowych — skipZeroInReports, skipZeroOnReceipt
- [x] OL27 Pytaj czy drukować — askBeforePrint
- [x] OL28 Paragony z opisem ogólnym — receiptWithGenDesc
- [x] OL29 Sumuj przed fiskalizacją — mergeBeforeFiscal
- [x] OL30 Nie aktualizuj stanów — noStockUpdatePrint
- [x] OL31 Produkcja na bieżąco — autoProduction
- [x] OL32 Co fiskalizować — fiscalizeWhat JSON
- [x] OL33 Nr stanowiska — stationNumber
- [x] OL34 Zakres magazynów — allowedWarehouseIds

## 32. OPCJE GLOBALNE ROZSZERZONE

- [x] OG14 API opcji globalnych — GET/PUT/DELETE /api/settings/global-options
- [x] OG15 Domyślne wartości — GLOBAL_OPTIONS_DEFAULTS
- [x] OG16 Naliczanie wg czasu — timeBillingEnabled, timeBillingIntervals
- [x] OG17 Zestawy — hideSetContentsOnClick

## 33. STRONY UI

- [x] UI1 Panel klientów (TV) — /display/[id] (publiczna strona do wyświetlenia)
- [x] UI2 Konfiguracja paneli TV — /settings/displays
- [x] UI3 Funkcje menadżera — /manager (numerator, usuwanie, kopie, fiskalizacja)
- [x] UI4 Raporty rozszerzone — /reports/extended (stoliki, zmiana rozszerzona)
- [x] UI5 Archiwum KDS — /kds/archive (historia ze statystykami czasu)
- [x] UI6 Konfiguracja czytników — /settings/card-readers

## 34. NAWIGACJA

- [x] NAV1 Linki do nowych stron w /settings — displays, card-readers, manager, reports, kds/archive
- [x] NAV2 Dodano Dostawy i Menadżer do głównego menu bocznego
- [x] NAV3 Ikony dla nowych pozycji — Tv, CreditCard, Wrench, BarChart3, Archive, Truck
