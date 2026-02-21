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
