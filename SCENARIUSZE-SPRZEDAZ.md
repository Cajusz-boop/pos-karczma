# Scenariusze sprzedaży — POS Karczma Łabędź

> Kompletne scenariusze testowe i operacyjne: od otwarcia stolika do wydruku paragonu/faktury.
> Format: `SC-XX-YY` gdzie XX = kategoria, YY = numer scenariusza

---

## 1. LOGOWANIE I ROZPOCZĘCIE PRACY

### SC-01-01: Logowanie kelner PIN
**Aktorzy:** Kelner
**Warunki wstępne:** System uruchomiony, brak zalogowanego użytkownika
**Kroki:**
1. Kelner widzi ekran logowania z pinpadem
2. Wprowadza 4-cyfrowy PIN (np. 1234)
3. System weryfikuje PIN (bcrypt)
4. System otwiera sesję z JWT httpOnly cookie
5. Przekierowanie na mapę stolików `/pos`

**Oczekiwany wynik:** Kelner zalogowany, widzi mapę sali z wolnymi/zajętymi stolikami

---

### SC-01-02: Logowanie kapsułką Dallas iButton
**Aktorzy:** Kelner z kapsułką
**Warunki wstępne:** Czytnik Dallas USB podłączony, kapsułka sparowana z kontem
**Kroki:**
1. Kelner widzi ekran "Przyłóż kapsułkę"
2. Przykłada kapsułkę Dallas do czytnika
3. System odczytuje tokenId przez WebHID/keyboard wedge
4. `POST /api/auth/token-login` z tokenId
5. System weryfikuje i otwiera sesję

**Oczekiwany wynik:** Natychmiastowe logowanie bez wpisywania PIN

---

### SC-01-03: Logowanie NFC na telefonie Android
**Aktorzy:** Kelner z kartą NFC
**Warunki wstępne:** Chrome Android, NFC włączone, karta sparowana
**Kroki:**
1. Kelner widzi ekran "Przyłóż kartę NFC"
2. Przykłada kartę do telefonu
3. Web NFC API odczytuje UID karty
4. `POST /api/auth/token-login` z tokenId
5. Automatyczne logowanie

**Oczekiwany wynik:** Logowanie przez kartę zbliżeniową

---

### SC-01-04: Otwarcie zmiany kelnera
**Aktorzy:** Kelner po zalogowaniu
**Warunki wstępne:** Brak otwartej zmiany dla użytkownika
**Kroki:**
1. System wykrywa brak otwartej zmiany
2. Wyświetla prompt "Otwórz zmianę"
3. Kelner opcjonalnie wpisuje początkowy stan kasy
4. `POST /api/shifts` tworzy nową zmianę
5. Zmiana otwarta z timestampem

**Oczekiwany wynik:** Zmiana otwarta, kelner może przyjmować zamówienia

---

## 2. OTWIERANIE ZAMÓWIENIA

### SC-02-01: Otwarcie zamówienia przy stoliku (dine-in)
**Aktorzy:** Kelner
**Warunki wstępne:** Zalogowany, zmiana otwarta, stolik wolny (status FREE)
**Kroki:**
1. Kelner klika wolny stolik na mapie `/pos`
2. System sprawdza czy stolik jest FREE
3. `POST /api/orders` z `{ tableId, userId, guestCount: 2 }`
4. System:
   - Tworzy zamówienie z kolejnym `orderNumber`
   - Ustawia stolik na OCCUPIED
   - Przypisuje kelnera do stolika
5. Przekierowanie na `/pos/order/[orderId]`

**Oczekiwany wynik:** Nowe zamówienie, stolik zmienia kolor na zajęty

---

### SC-02-02: Otwarcie zamówienia na wynos (takeaway)
**Aktorzy:** Kelner
**Warunki wstępne:** Zalogowany
**Kroki:**
1. Kelner klika przycisk "Na wynos" na mapie
2. `POST /api/orders` z `{ userId, type: "TAKEAWAY" }` (bez tableId)
3. System tworzy zamówienie bez przypisania stolika
4. Przekierowanie na ekran zamówienia

**Oczekiwany wynik:** Zamówienie typu TAKEAWAY bez blokowania stolika

---

### SC-02-03: Szybki paragon (quick sale)
**Aktorzy:** Kelner przy barze
**Warunki wstępne:** Zalogowany
**Kroki:**
1. Kelner klika "Szybki paragon"
2. System tworzy tymczasowe zamówienie TAKEAWAY
3. Kelner dodaje produkty
4. Bezpośrednie przejście do płatności
5. Paragon fiskalny bez numerowania stolika

**Oczekiwany wynik:** Sprzedaż barowa w < 30 sekund

---

### SC-02-04: Dołączenie do istniejącego zamówienia
**Aktorzy:** Kelner
**Warunki wstępne:** Stolik ma otwarte zamówienie
**Kroki:**
1. Kelner klika zajęty stolik (status OCCUPIED)
2. System pobiera `GET /api/orders?tableId=xxx&status=open`
3. Wyświetla listę otwartych zamówień na stoliku
4. Kelner wybiera zamówienie do kontynuacji
5. Przekierowanie na `/pos/order/[orderId]`

**Oczekiwany wynik:** Kontynuacja istniejącego zamówienia

---

### SC-02-05: Pytanie o liczbę gości
**Aktorzy:** Kelner
**Warunki wstępne:** Konfiguracja `askGuestCount: true`
**Kroki:**
1. Kelner otwiera stolik
2. System wyświetla popup "Ile osób?"
3. Kelner wybiera 1-12+ lub wpisuje ręcznie
4. `POST /api/orders` z `guestCount: N`
5. guestCount zapisany do statystyk (średnia/gość)

**Oczekiwany wynik:** Zamówienie z poprawną liczbą gości

---

## 3. DODAWANIE PRODUKTÓW

### SC-03-01: Dodanie produktu przez dotyk
**Aktorzy:** Kelner
**Warunki wstępne:** Zamówienie otwarte, na ekranie `/pos/order/[orderId]`
**Kroki:**
1. Kelner widzi menu z kategoriami (zakładki)
2. Wybiera kategorię (np. "Dania główne")
3. Klika produkt (np. "Schabowy")
4. `POST /api/orders/[id]/items` z `{ productId, quantity: 1 }`
5. Produkt pojawia się na rachunku po lewej
6. Wibracja 50ms jako potwierdzenie

**Oczekiwany wynik:** Produkt dodany do zamówienia, suma zaktualizowana

---

### SC-03-02: Zmiana ilości przez kliknięcie pozycji
**Aktorzy:** Kelner
**Warunki wstępne:** Produkt już na rachunku
**Kroki:**
1. Kelner klika pozycję na rachunku
2. Ilość automatycznie +1
3. `PATCH /api/orders/[id]/items/[itemId]` z `{ quantity: N+1 }`
4. Suma przeliczona

**Oczekiwany wynik:** Szybkie zwiększanie ilości jednym kliknięciem

---

### SC-03-03: Długie naciśnięcie — popup "Ile?"
**Aktorzy:** Kelner
**Warunki wstępne:** Na ekranie menu produktów
**Kroki:**
1. Kelner przytrzymuje produkt > 500ms
2. Pojawia się popup z przyciskami 1-9
3. Kelner wybiera ilość (np. 4)
4. `POST /api/orders/[id]/items` z `{ productId, quantity: 4 }`
5. Produkt dodany z wybraną ilością

**Oczekiwany wynik:** Dodanie wielu sztuk jednym gestem

---

### SC-03-04: Wyszukiwanie produktu
**Aktorzy:** Kelner
**Warunki wstępne:** Zamówienie otwarte
**Kroki:**
1. Kelner klika pole wyszukiwania
2. Wpisuje fragment nazwy (np. "żur")
3. `GET /api/products/search?q=żur`
4. System filtruje produkty w czasie rzeczywistym
5. Kelner wybiera z wyników

**Oczekiwany wynik:** Szybkie znalezienie produktu bez przewijania kategorii

---

### SC-03-05: Szybkie wprowadzanie ILOŚĆ*KOD*CENA
**Aktorzy:** Kelner z klawiaturą numeryczną
**Warunki wstępne:** Tryb klawiatury numerycznej włączony
**Kroki:**
1. Kelner wpisuje: `3*1005*12.50`
2. `POST /api/products/quick-entry` z `{ input: "3*1005*12.50" }`
3. System parsuje: ilość=3, kod=1005, cena=12.50
4. Dodaje produkt o kodzie 1005 w ilości 3 po cenie 12.50

**Oczekiwany wynik:** Błyskawiczne dodanie bez dotykania ekranu

---

### SC-03-06: Wyszukiwanie T9 (jak SMS)
**Aktorzy:** Kelner
**Warunki wstępne:** Tryb T9 włączony
**Kroki:**
1. Kelner wpisuje cyfry: 5,2,5,5,6 (odpowiada "jałło"?)
2. `GET /api/products/search?t9=52556`
3. System konwertuje T9 na możliwe ciągi znaków
4. Wyświetla pasujące produkty

**Oczekiwany wynik:** Wyszukiwanie dla starszych terminali

---

### SC-03-07: Dodanie modyfikatora do produktu
**Aktorzy:** Kelner
**Warunki wstępne:** Produkt ma przypisane grupy modyfikatorów
**Kroki:**
1. Kelner dodaje "Stek wołowy"
2. Popup: "Jak wysmażony?" (RARE/MEDIUM/WELL)
3. Kelner wybiera "MEDIUM RARE"
4. `POST /api/orders/[id]/items/[itemId]/modifiers`
5. Modyfikator zapisany, widoczny na rachunku

**Oczekiwany wynik:** Produkt z wybranym modyfikatorem

---

### SC-03-08: Dodanie produktu z notatką (alergia)
**Aktorzy:** Kelner
**Warunki wstępne:** Gość zgłosił alergię
**Kroki:**
1. Kelner dodaje produkt
2. Klika ikonę notatki przy pozycji
3. Wpisuje: "BEZ ORZECHÓW - ALERGIA"
4. `PUT /api/orders/[id]/items/[itemId]/note` z `{ note, type: "ALLERGY" }`
5. Notatka widoczna na rachunku i bonie kuchennym

**Oczekiwany wynik:** Krytyczna informacja przekazana do kuchni

---

### SC-03-09: Dodanie zestawu z wymianą składnika
**Aktorzy:** Kelner
**Warunki wstępne:** Produkt typu SET
**Kroki:**
1. Kelner dodaje "Zestaw obiadowy" (zupa + drugie + napój)
2. Popup wyboru składników
3. Kelner zmienia "Pomidorowa" na "Żurek"
4. `POST /api/orders/[id]/items/[itemId]/swap-component`
5. Zestaw z wymienioną zupą

**Oczekiwany wynik:** Zestaw z customowymi składnikami

---

### SC-03-10: Dodanie "BRAK" składnika
**Aktorzy:** Kelner
**Warunki wstępne:** Gość nie chce jakiegoś składnika
**Kroki:**
1. Kelner dodaje "Burger klasyczny"
2. 2× klika składnik "Cebula"
3. `PUT /api/orders/[id]/items/[itemId]/subtract` — toggle BRAK
4. Na rachunku: "BRAK Cebula"
5. Na bonie: "-Cebula" lub "BRAK Cebula"

**Oczekiwany wynik:** Składnik oznaczony do usunięcia

---

### SC-03-11: Panel "Popularne" — TOP 8 produktów
**Aktorzy:** Kelner
**Warunki wstępne:** Zamówienie otwarte
**Kroki:**
1. Na górze menu widoczny panel "Popularne"
2. System wyświetla TOP 8 produktów z ostatnich 7 dni
3. Kelner klika popularny produkt
4. Dodanie bez zmiany kategorii

**Oczekiwany wynik:** Najczęściej zamawiane produkty w zasięgu ręki

---

### SC-03-12: Pasek ostatnio dodanych
**Aktorzy:** Kelner
**Warunki wstępne:** Dodano już produkty
**Kroki:**
1. Pod wyszukiwarką widać pasek z ostatnimi 5 produktami
2. Kelner klika produkt z paska
3. Natychmiastowe dodanie do zamówienia

**Oczekiwany wynik:** Szybkie ponowne dodanie tych samych produktów

---

### SC-03-13: Sugestie sprzedażowe (upselling)
**Aktorzy:** Kelner
**Warunki wstępne:** Produkt ma skonfigurowane sugestie
**Kroki:**
1. Kelner dodaje "Stek"
2. Popup SuggestionPopup: "Polecamy do tego:"
3. Wyświetla: "Wino Merlot", "Sos pieprzowy"
4. Kelner klika sugestię lub pomija
5. Sugestia dodana do zamówienia

**Oczekiwany wynik:** Zwiększenie wartości zamówienia

---

### SC-03-14: Filtr alergenów
**Aktorzy:** Kelner
**Warunki wstępne:** Gość ma alergie
**Kroki:**
1. Kelner klika "Filtr alergenów"
2. Zaznacza: "Gluten", "Laktoza"
3. `GET /api/products?excludeAllergens=gluten,lactose`
4. Menu pokazuje tylko bezpieczne produkty
5. Produkty z alergenami wyszarzone/ukryte

**Oczekiwany wynik:** Bezpieczne menu dla alergika

---

## 4. WYSYŁKA DO KUCHNI

### SC-04-01: Wysłanie zamówienia do KDS
**Aktorzy:** Kelner
**Warunki wstępne:** Produkty dodane do zamówienia
**Kroki:**
1. Kelner klika "Wyślij do kuchni"
2. `POST /api/orders/[id]/send`
3. System:
   - Ustawia `sentAt` na wszystkich nowych pozycjach
   - Wysyła do odpowiednich stacji KDS wg kategorii
   - Drukuje bon na drukarce kuchennej (jeśli skonfigurowana)
4. Pozycje zmieniają status na PENDING

**Oczekiwany wynik:** Zamówienie widoczne na KDS, bon wydrukowany

---

### SC-04-02: Automatyczne wysłanie przy wyjściu
**Aktorzy:** Kelner
**Warunki wstępne:** Konfiguracja `autoSendKitchen: true`
**Kroki:**
1. Kelner dodaje produkty
2. Klika "Wstecz" do mapy stolików
3. System automatycznie wysyła niewysłane pozycje
4. `POST /api/orders/[id]/send` wywołane w tle

**Oczekiwany wynik:** Nie można zapomnieć o wysłaniu

---

### SC-04-03: Wysłanie "Ogień" (FIRE) — priorytet
**Aktorzy:** Kelner
**Warunki wstępne:** Gość się spieszy
**Kroki:**
1. Kelner długo naciska pozycję na rachunku
2. Menu kontekstowe → "Ogień"
3. `PUT /api/orders/[id]/items/[itemId]/fire`
4. Pozycja oznaczona `isFire: true`, `firedAt: now()`
5. Push notification do kuchni
6. Na KDS pozycja migająca/czerwona

**Oczekiwany wynik:** Kuchnia wie o priorytecie

---

### SC-04-04: Opóźnione wysłanie (minutnik)
**Aktorzy:** Kelner
**Warunki wstępne:** Gość chce przystawki za 15 minut
**Kroki:**
1. Kelner dodaje "Carpaccio"
2. Menu kontekstowe → "Opóźnij"
3. Wpisuje: 15 minut
4. `PUT /api/orders/[id]/items/[itemId]/delay` z `{ delayMinutes: 15 }`
5. Pozycja ma `fireAt: now() + 15min`
6. Wysłanie do kuchni po upływie czasu

**Oczekiwany wynik:** Fire timing dla kursów

---

### SC-04-05: Zwolnienie kursu (release course)
**Aktorzy:** Kelner
**Warunki wstępne:** Zamówienie ma kursy 1/2/3
**Kroki:**
1. Goście kończą przystawki
2. Kelner klika "Zwolnij kurs 2"
3. `POST /api/orders/[id]/release-course` z `{ courseNumber: 2 }`
4. Dania główne wysłane do kuchni
5. KDS pokazuje tylko kurs 2

**Oczekiwany wynik:** Kontrola tempa serwowania

---

### SC-04-06: Storno pozycji przed wysłaniem
**Aktorzy:** Kelner
**Warunki wstępne:** Pozycja niewysłana (status null)
**Kroki:**
1. Gość rezygnuje z dania
2. Kelner klika pozycję → "Usuń"
3. `DELETE /api/orders/[id]/items/[itemId]`
4. Pozycja usunięta bez śladu

**Oczekiwany wynik:** Czyste usunięcie przed wysłaniem

---

### SC-04-07: Storno pozycji po wysłaniu
**Aktorzy:** Kelner + Manager
**Warunki wstępne:** Pozycja wysłana (status PENDING/PREPARING)
**Kroki:**
1. Gość rezygnuje z dania
2. Kelner klika pozycję → "Stornuj"
3. System wymaga autoryzacji managera (PIN)
4. `PUT /api/orders/[id]/items/[itemId]/cancel` z `{ reason, authorizedBy }`
5. Pozycja status = CANCELLED
6. Bon STORNO drukowany w kuchni
7. Audit log zapisany

**Oczekiwany wynik:** Storno z pełnym śladem audytowym

---

## 5. PRZENOSZENIE I DZIELENIE

### SC-05-01: Przeniesienie zamówienia na inny stolik
**Aktorzy:** Kelner
**Warunki wstępne:** Zamówienie otwarte, stolik docelowy wolny
**Kroki:**
1. Kelner długo naciska stolik → "Przenieś"
2. Wybiera stolik docelowy (musi być FREE)
3. `PUT /api/orders/[id]/move` z `{ targetTableId }`
4. System:
   - Ustawia stary stolik na FREE
   - Przypisuje zamówienie do nowego stolika
   - Ustawia nowy stolik na OCCUPIED

**Oczekiwany wynik:** Zamówienie przeniesione, stoliki zaktualizowane

---

### SC-05-02: Łączenie stolików (merge orders)
**Aktorzy:** Kelner
**Warunki wstępne:** Dwa stoliki z zamówieniami, goście chcą wspólny rachunek
**Kroki:**
1. Kelner wybiera stolik A → "Połącz z..."
2. Wybiera stolik B
3. `POST /api/orders/merge` z `{ sourceOrderId, targetOrderId }`
4. Pozycje z A przeniesione do B
5. Zamówienie A zamknięte/anulowane
6. Stolik A = FREE

**Oczekiwany wynik:** Jeden wspólny rachunek

---

### SC-05-03: Podział zamówienia (split order)
**Aktorzy:** Kelner
**Warunki wstępne:** Stolik z wieloma pozycjami
**Kroki:**
1. Kelner klika "Podziel zamówienie"
2. Zaznacza pozycje do nowego rachunku
3. `POST /api/orders/[id]/split` z `{ itemIds }`
4. System tworzy nowe zamówienie z wybranymi pozycjami
5. Oryginalne zamówienie ma pozostałe pozycje

**Oczekiwany wynik:** Dwa osobne zamówienia

---

### SC-05-04: Podział rachunku równo na N osób
**Aktorzy:** Kelner
**Warunki wstępne:** Goście chcą płacić po równo
**Kroki:**
1. W PaymentDialog kelner klika "Podziel rachunek"
2. Wybiera liczbę osób (np. 4)
3. `POST /api/orders/[id]/split-bill` z `{ numberOfPeople: 4 }`
4. System tworzy 4 nowe zamówienia, każde = total/4
5. Każda część może być opłacona osobno

**Oczekiwany wynik:** 4 osobne paragony na równe kwoty

---

### SC-05-05: Oznaczenie pozycji "na wynos"
**Aktorzy:** Kelner
**Warunki wstępne:** Gość chce część na wynos
**Kroki:**
1. Kelner klika pozycję → "Na wynos"
2. `PUT /api/orders/[id]/items/[itemId]/takeaway` z `{ isTakeaway: true }`
3. Pozycja oznaczona ikoną torebki
4. Na bonie: "** NA WYNOS **"

**Oczekiwany wynik:** Kuchnia pakuje do pudełka

---

## 6. RABATY I PROMOCJE

### SC-06-01: Rabat procentowy na zamówienie
**Aktorzy:** Kelner + Manager
**Warunki wstępne:** Manager autoryzuje rabat
**Kroki:**
1. W PaymentDialog kelner klika "Rabat"
2. Wybiera "Procentowy"
3. Wpisuje: 10%
4. System wymaga autoryzacji managera
5. `PATCH /api/orders/[id]` z `{ discountJson: { type: "PERCENT", value: 10 } }`
6. Suma przeliczona z rabatem

**Oczekiwany wynik:** 10% rabatu na cały rachunek

---

### SC-06-02: Rabat kwotowy na zamówienie
**Aktorzy:** Kelner + Manager
**Warunki wstępne:** Jak wyżej
**Kroki:**
1. Kelner klika "Rabat" → "Kwotowy"
2. Wpisuje: 50 zł
3. Autoryzacja managera
4. `{ discountJson: { type: "AMOUNT", value: 50 } }`

**Oczekiwany wynik:** 50 zł rabatu

---

### SC-06-03: Automatyczna promocja Happy Hour
**Aktorzy:** System
**Warunki wstępne:** Godzina 16:00-18:00, promocja aktywna
**Kroki:**
1. System sprawdza aktywne promocje
2. `GET /api/promotions?active=true`
3. Promocja "Happy Hour -20% na piwo" pasuje
4. Przy dodaniu produktu "Piwo" cena automatycznie -20%
5. Na rachunku widoczny rabat promocyjny

**Oczekiwany wynik:** Automatyczny rabat bez interwencji

---

### SC-06-04: Kod rabatowy
**Aktorzy:** Kelner
**Warunki wstępne:** Gość ma kod z newslettera
**Kroki:**
1. Kelner wpisuje kod "LATO2026"
2. `GET /api/promotions/validate?code=LATO2026`
3. System weryfikuje ważność i warunki
4. Rabat zastosowany automatycznie

**Oczekiwany wynik:** Rabat z kampanii marketingowej

---

### SC-06-05: Walidacja limitu rabatu per kelner
**Aktorzy:** Kelner z limitem 15%
**Warunki wstępne:** Kelner ma `discountMax: 15` w uprawnieniach
**Kroki:**
1. Kelner próbuje dać 20% rabatu
2. `POST /api/orders/[id]/discount/validate`
3. System sprawdza `permissionsJson.operations.discountMax`
4. Odmowa: "Maksymalny rabat to 15%"
5. Kelner musi wezwać managera

**Oczekiwany wynik:** Kontrola nadużyć rabatowych

---

## 7. PŁATNOŚCI

### SC-07-01: Płatność gotówką — odliczone
**Aktorzy:** Kelner
**Warunki wstępne:** Zamówienie gotowe do płatności, total = 87.50 zł
**Kroki:**
1. Kelner klika "Płatność"
2. PaymentDialog otwiera się z sumą 87.50 zł
3. Kelner klika "Gotówka"
4. Klika "Odliczone (87.50 zł)" — kwota automatycznie wpisana
5. Reszta = 0.00 zł

**Oczekiwany wynik:** Szybka płatność bez przeliczania

---

### SC-07-02: Płatność gotówką z resztą
**Aktorzy:** Kelner
**Warunki wstępne:** Total = 87.50 zł, gość daje 100 zł
**Kroki:**
1. Kelner wybiera "Gotówka"
2. Wpisuje 100 lub klika przycisk "100 zł"
3. System oblicza resztę: 100 - 87.50 = 12.50 zł
4. Wyświetla dużym fontem: "Reszta: 12.50 zł"
5. Kelner potwierdza i wydaje resztę

**Oczekiwany wynik:** Jasna informacja o reszcie

---

### SC-07-03: Płatność gotówką w walucie obcej
**Aktorzy:** Kelner
**Warunki wstępne:** Total = 100 zł, gość płaci EUR
**Kroki:**
1. Kelner wybiera "Gotówka"
2. Zaznacza "Waluta obca"
3. Wybiera EUR (kurs 4.30 PLN)
4. System przelicza: 100 / 4.30 = 23.26 EUR
5. Gość daje 25 EUR
6. Reszta: (25 * 4.30) - 100 = 7.50 PLN

**Oczekiwany wynik:** Obsługa turystów zagranicznych

---

### SC-07-04: Płatność kartą — terminal zewnętrzny
**Aktorzy:** Kelner
**Warunki wstępne:** Terminal bankowy podłączony
**Kroki:**
1. Kelner wybiera "Karta"
2. System wyświetla "Przyłóż kartę do terminala"
3. Gość płaci na terminalu
4. Kelner klika "Potwierdź akceptację karty"
5. `POST /api/payments` z `{ method: "CARD", amount: 87.50 }`

**Oczekiwany wynik:** Płatność kartą zarejestrowana

---

### SC-07-05: Płatność kartą — PolCard Go (SoftPOS)
**Aktorzy:** Kelner z telefonem Android NFC
**Warunki wstępne:** PolCard Go skonfigurowany, telefon z NFC
**Kroki:**
1. Kelner wybiera "Karta" → tryb "PolCard Go"
2. Klika "Uruchom PolCard Go"
3. Aplikacja PolCard otwiera się przez intent
4. Gość przykłada kartę do telefonu
5. System polluje `/api/payment/polcard-status`
6. Po sukcesie: płatność automatycznie potwierdzona

**Oczekiwany wynik:** Płatność NFC bez dodatkowego terminala

---

### SC-07-06: Płatność BLIK
**Aktorzy:** Kelner
**Warunki wstępne:** Gość ma aplikację bankową
**Kroki:**
1. Kelner wybiera "BLIK"
2. System wyświetla "Oczekiwanie na BLIK"
3. Gość wpisuje kod BLIK na terminalu
4. Kelner klika "Potwierdź akceptację BLIK"
5. Płatność zarejestrowana jako BLIK

**Oczekiwany wynik:** Obsługa BLIK

---

### SC-07-07: Płatność mieszana (MIX)
**Aktorzy:** Kelner
**Warunki wstępne:** Total = 150 zł, gość chce część gotówką, część kartą
**Kroki:**
1. Kelner wybiera "Mix"
2. Dodaje: Gotówka 50 zł + Karta 100 zł
3. System sprawdza: 50 + 100 = 150 ≥ 150 ✓
4. Gość płaci osobno każdą część
5. `POST /api/payments` z tablicą płatności

**Oczekiwany wynik:** Elastyczna płatność

---

### SC-07-08: Płatność voucherem
**Aktorzy:** Kelner
**Warunki wstępne:** Gość ma kartę podarunkową
**Kroki:**
1. Kelner wybiera "Voucher"
2. Wpisuje kod: GV-ABCD-1234
3. `GET /api/vouchers?code=GV-ABCD-1234` sprawdza saldo
4. System: saldo = 200 zł, wystarczy na 87.50 zł
5. `POST /api/vouchers/redeem` z kwotą
6. Saldo pomniejszone o 87.50 zł

**Oczekiwany wynik:** Płatność kartą podarunkową

---

### SC-07-09: Płatność na pokój hotelowy
**Aktorzy:** Kelner
**Warunki wstępne:** Integracja z systemem hotelowym
**Kroki:**
1. Kelner wybiera "Na pokój"
2. `GET /api/hotel/rooms` pobiera zajęte pokoje
3. Lista: Pokój 201 — Jan Kowalski
4. Kelner wybiera pokój
5. `POST /api/hotel/charge` obciąża konto gościa
6. Płatność zarejestrowana jako ROOM_CHARGE

**Oczekiwany wynik:** Rachunek dopisany do pokoju

---

### SC-07-10: Napiwek przy płatności
**Aktorzy:** Kelner
**Warunki wstępne:** Gość chce zostawić napiwek
**Kroki:**
1. W dowolnym trybie płatności kelner wpisuje napiwek: 10 zł
2. `POST /api/payments` z `{ tipAmount: 10, tipUserId: "kelner-id" }`
3. Napiwek zapisany do Tip model
4. Przypisany do kelnera obsługującego

**Oczekiwany wynik:** Napiwek zarejestrowany, widoczny w raporcie

---

### SC-07-11: Walidacja kwoty płatności
**Aktorzy:** System
**Warunki wstępne:** Total = 100 zł
**Kroki:**
1. Kelner próbuje zapłacić 90 zł
2. `POST /api/payments` sprawdza: 90 < 100
3. Błąd: "Suma płatności (90.00 zł) jest mniejsza niż kwota zamówienia (100.00 zł)"
4. Kelner musi uzupełnić kwotę

**Oczekiwany wynik:** Blokada niedopłaty

---

### SC-07-12: Blokada podwójnej płatności
**Aktorzy:** System
**Warunki wstępne:** Zamówienie ma już płatności
**Kroki:**
1. Kelner (przez błąd) próbuje dodać kolejną płatność
2. `POST /api/payments` sprawdza istniejące płatności
3. Błąd: "Zamówienie ma już zarejestrowane płatności"
4. Kelner musi najpierw usunąć poprzednie

**Oczekiwany wynik:** Ochrona przed duplikatami

---

## 8. ZAMKNIĘCIE I PARAGON

### SC-08-01: Wydruk paragonu fiskalnego
**Aktorzy:** Kelner
**Warunki wstępne:** Płatność zarejestrowana, drukarka fiskalna aktywna
**Kroki:**
1. Kelner klika "Paragon"
2. `POST /api/orders/[id]/close` z `{ receipt: true }`
3. System:
   - Buduje payload dla drukarki fiskalnej
   - Wywołuje `posnetDriver.printReceipt()`
   - Otrzymuje `fiscalNumber` z drukarki
   - Generuje HTML e-paragonu
   - Tworzy rekord Receipt z tokenem
   - Ustawia pozycje na SERVED
   - Zamówienie status = CLOSED
   - Stolik status = FREE
4. Drukarka drukuje paragon papierowy

**Oczekiwany wynik:** Paragon wydrukowany, zamówienie zamknięte

---

### SC-08-02: Paragon z NIP nabywcy
**Aktorzy:** Kelner
**Warunki wstępne:** Firma chce paragon z NIP (do 450 zł)
**Kroki:**
1. Kelner wpisuje NIP: 1234567890
2. `POST /api/orders/[id]/close` z `{ receipt: true, buyerNip: "1234567890" }`
3. System dodaje NIP do payload fiskalnego
4. Paragon zawiera NIP nabywcy

**Oczekiwany wynik:** Paragon z NIP dla małych zakupów firmowych

---

### SC-08-03: E-paragon — kod QR
**Aktorzy:** Kelner + Gość
**Warunki wstępne:** Paragon wydrukowany, receiptToken zwrócony
**Kroki:**
1. Po zamknięciu system generuje QR z URL
2. PaymentDialog wyświetla QR code
3. Gość skanuje telefonem
4. Otwiera `/e-receipt/[token]`
5. Widzi cyfrową wersję paragonu

**Oczekiwany wynik:** Ekologiczny paragon bez papieru

---

### SC-08-04: E-paragon — wysyłka SMS
**Aktorzy:** Kelner
**Warunki wstępne:** E-paragon wygenerowany
**Kroki:**
1. Kelner wpisuje numer telefonu gościa: 500600700
2. Klika "Wyślij SMS"
3. `POST /api/e-receipt/send-sms` z `{ receiptId, phone }`
4. SMS przez SMSAPI.pl z linkiem do e-paragonu
5. Gość otrzymuje SMS z URL

**Oczekiwany wynik:** E-paragon na telefon gościa

---

### SC-08-05: Wydruk faktury VAT
**Aktorzy:** Kelner
**Warunki wstępne:** Płatność zarejestrowana, dane firmy dostępne
**Kroki:**
1. Kelner klika "Faktura"
2. Wpisuje dane nabywcy:
   - NIP: 9876543210
   - Nazwa: ABC Sp. z o.o.
   - Adres: ul. Główna 1, 00-001 Warszawa
3. `POST /api/invoices` z danymi
4. System:
   - Generuje numer faktury (np. FV/2026/02/0042)
   - Tworzy pozycje z VAT
   - Zapisuje Invoice
5. `POST /api/orders/[id]/close` z `{ receipt: false }`
6. Faktura drukowana lub eksportowana

**Oczekiwany wynik:** Faktura VAT zamiast paragonu

---

### SC-08-06: Faktura do paragonu (błąd flow)
**Aktorzy:** Kelner
**Warunki wstępne:** Paragon już wydrukowany, klient chce fakturę
**Kroki:**
1. Kelner informuje: paragon już wydrukowany
2. Należy wystawić fakturę do paragonu
3. `POST /api/invoices` z `{ receiptId, buyerNip, ... }`
4. System tworzy fakturę powiązaną z paragonem
5. Paragon fiskalny załączony do faktury

**Oczekiwany wynik:** Faktura VAT do istniejącego paragonu

---

### SC-08-07: Auto-odliczenie magazynowe
**Aktorzy:** System
**Warunki wstępne:** Produkty mają receptury/składniki magazynowe
**Kroki:**
1. Przy `close` wywoływane `consumeStockForOrder()`
2. System iteruje pozycje zamówienia
3. Dla każdego produktu:
   - Pobiera recepturę (składniki)
   - Odlicza ilość z magazynu
   - Tworzy dokument RW (rozchód wewnętrzny)
4. Stany magazynowe zaktualizowane

**Oczekiwany wynik:** Automatyczna inwentaryzacja

---

### SC-08-08: Zamknięcie bez fiskalizacji (tryb demo)
**Aktorzy:** Kelner (szkolenie)
**Warunki wstępne:** Tryb demo aktywny
**Kroki:**
1. Kelner klika "Paragon"
2. System wykrywa brak drukarki fiskalnej lub tryb demo
3. `fiscalNumber` = `DEMO-${timestamp}`
4. Zamówienie zamknięte bez wydruku fiskalnego
5. Wpis do logu: "Paragon niefiskalny"

**Oczekiwany wynik:** Testowanie bez drukarki

---

### SC-08-09: Błąd wydruku fiskalnego
**Aktorzy:** System
**Warunki wstępne:** Drukarka fiskalna offline/błąd
**Kroki:**
1. `posnetDriver.printReceipt()` zwraca `success: false`
2. Jeśli `fiscalErrorAllowContinue: true`:
   - Zamówienie zamknięte z `DEMO-xxx`
   - Ostrzeżenie w logu
3. Jeśli `fiscalErrorAllowContinue: false`:
   - Błąd: "Fiskalizacja nieudana, nie można zamknąć"
   - Kelner musi naprawić drukarkę

**Oczekiwany wynik:** Kontrolowane zachowanie przy awarii

---

### SC-08-10: Korekta paragonu (zwrot)
**Aktorzy:** Manager
**Warunki wstępne:** Paragon wydrukowany, gość zwraca produkt
**Kroki:**
1. Manager otwiera zamknięte zamówienie
2. Klika "Korekta" → wybiera pozycje do zwrotu
3. `POST /api/receipts/[id]/correction`
4. System:
   - Generuje korektę paragonu
   - Drukuje paragon korygujący
   - Zwraca pieniądze (CASH)
5. Audit log: korekta z powodem

**Oczekiwany wynik:** Prawidłowy zwrot fiskalny

---

## 9. SCENARIUSZE ZŁOŻONE

### SC-09-01: Pełny obiad z winem — 4 osoby
**Aktorzy:** Kelner
**Flow:**
1. Otwarcie stolika dla 4 osób
2. Dodanie: 4× Przystawka (kurs 1), 4× Danie główne (kurs 2), 4× Deser (kurs 3), 2× Wino
3. Wysłanie kursu 1 do kuchni
4. Oczekiwanie na gotowość (KDS → READY)
5. Kelner potwierdza odbiór (SERVED)
6. Zwolnienie kursu 2
7. Analogicznie dla deserów
8. Płatność kartą + napiwek 10%
9. Paragon + e-paragon QR
10. Stolik zwalnia się automatycznie

**Czas:** ~60 minut
**Wartość:** ~400-600 zł

---

### SC-09-02: Bankiet firmowy z fakturą zaliczkową
**Aktorzy:** Manager
**Flow:**
1. Rezerwacja bankietu na 20 osób
2. Faktura zaliczkowa 50% z góry
3. W dniu bankietu: otwarcie zamówienia zbiorczego
4. Obsługa przez wielu kelnerów
5. Dodatkowe zamówienia (extra)
6. Końcowe rozliczenie: faktura końcowa - zaliczka
7. Płatność przelewem (TRANSFER)
8. Zamknięcie z fakturą VAT

---

### SC-09-03: Dostawa z obciążeniem strefy
**Aktorzy:** Kelner + Kierowca
**Flow:**
1. Zamówienie telefoniczne: typ DELIVERY
2. Dodanie produktów + koszt dostawy wg strefy
3. Auto-rozpoznanie strefy z adresu
4. Przypisanie kierowcy
5. Wydruk bonu + adresu
6. Płatność przy odbiorze (COD) lub online
7. Kierowca dostarcza, oznacza "dostarczone"
8. Rozliczenie kierowcy: prowizja + gotówka

---

### SC-09-04: Śniadanie hotelowe (all-inclusive)
**Aktorzy:** Kelner śniadaniowy
**Flow:**
1. Gość pokazuje kartę pokoju
2. Kelner weryfikuje w `/kitchen/breakfast`
3. Zamówienie: typ BREAKFAST, linked to room
4. Gość wybiera z bufetu + zamawia jajka
5. Bez płatności (wliczone w cenę pokoju)
6. Zamknięcie: ROOM_CHARGE z kwotą 0 (info)

---

### SC-09-05: Split bill 50/50 między firmami
**Aktorzy:** Kelner
**Flow:**
1. Spotkanie biznesowe, 2 firmy
2. Podział rachunku 50/50
3. Osoba A: faktura na Firmę X, płatność kartą
4. Osoba B: faktura na Firmę Y, płatność kartą
5. Dwa osobne dokumenty, jeden stolik

---

### SC-09-06: Produkt wagowy z wagi elektronicznej
**Aktorzy:** Kelner
**Flow:**
1. Dodanie "Łosoś (waga)" — `isWeightBased: true`
2. Pozycja wymaga potwierdzenia wagi
3. Kucharz waży przygotowaną porcję
4. Skanuje etykietę z wagi lub wpisuje wagę
5. `PUT /api/orders/[id]/items/[itemId]/weight`
6. Cena przeliczona na faktyczną wagę
7. Dopiero teraz można zamknąć rachunek

---

### SC-09-07: Obsługa alergika (CRITICAL)
**Aktorzy:** Kelner + Kucharz
**Flow:**
1. Gość zgłasza alergię na orzechy
2. Kelner włącza filtr alergenów
3. Wybiera tylko bezpieczne produkty
4. Przy każdej pozycji notatka: "ALERGIA ORZECHY"
5. Na KDS: pozycja z czerwonym oznaczeniem
6. Kucharz widzi alert i przygotowuje osobno
7. Kelner dwukrotnie weryfikuje przed podaniem

---

### SC-09-08: Awaria sieci — tryb offline
**Aktorzy:** Kelner
**Flow:**
1. WiFi pada w środku serwisu
2. Service Worker aktywuje tryb offline
3. Zamówienia zapisywane lokalnie (IndexedDB)
4. Kelner kontynuuje pracę
5. Płatności gotówkowe możliwe
6. Po przywróceniu sieci: sync do serwera
7. Konflkty rozwiązywane automatycznie

---

### SC-09-09: Storno + nowe zamówienie tego samego
**Aktorzy:** Kelner
**Flow:**
1. Gość zamawia "Stek medium"
2. Wysłane do kuchni
3. Gość zmienia zdanie: "Jednak rare"
4. Storno pozycji (autoryzacja managera)
5. Bon STORNO w kuchni
6. Nowa pozycja: "Stek rare"
7. Wysłane ponownie
8. Na rachunku: tylko "Stek rare"

---

### SC-09-10: Rezerwacja + brak gościa (no-show)
**Aktorzy:** System
**Flow:**
1. Rezerwacja na 19:00, stolik oznaczony
2. 19:15 — gość nie pojawił się
3. `GET /api/cron/no-shows` sprawdza
4. Stolik oznaczony jako no-show
5. Alert dla managera
6. Stolik zwolniony po 30 min
7. Ewentualnie: opłata za no-show

---

## 10. SCENARIUSZE NEGATYWNE

### SC-10-01: Błędny PIN — 3 próby → blokada
**Flow:**
1. Kelner wpisuje zły PIN 3×
2. Konto tymczasowo zablokowane
3. Manager musi odblokować

---

### SC-10-02: Stolik zajęty — odmowa otwarcia
**Flow:**
1. Kelner klika stolik OCCUPIED
2. System: "Stolik jest już zajęty"
3. Propozycja: dołącz do zamówienia

---

### SC-10-03: Zamówienie z 0 produktami — odmowa płatności
**Flow:**
1. Kelner otwiera stolik, nic nie dodaje
2. Próbuje zapłacić
3. System: "Dodaj produkty przed płatnością"

---

### SC-10-04: Płatność 0.01 zł — edge case
**Flow:**
1. Rachunek po rabatach = 0.01 zł
2. Płatność gotówką: 0.01 zł
3. System akceptuje (minimum transakcji)

---

### SC-10-05: Próba anulowania opłaconego zamówienia
**Flow:**
1. Zamówienie zamknięte (CLOSED)
2. Kelner próbuje anulować
3. System: "Zamówienie jest już zamknięte — użyj korekty"

---

### SC-10-06: Brak połączenia z drukarką fiskalną
**Flow:**
1. Kelner klika "Paragon"
2. Drukarka offline
3. Zależnie od konfiguracji:
   - Błąd i blokada, lub
   - Ostrzeżenie i zamknięcie bez fiskalizacji

---

### SC-10-07: Voucher z zerowym saldem
**Flow:**
1. Kelner wpisuje kod vouchera
2. Saldo = 0.00 zł
3. System: "Voucher ma zerowe saldo"
4. Kelner musi wybrać inną formę płatności

---

### SC-10-08: Hotel — pokój bez meldunku
**Flow:**
1. Kelner wybiera "Na pokój"
2. Lista pokoi pusta lub błąd API
3. System: "Brak zajętych pokoi" lub "Błąd połączenia z hotelem"

---

### SC-10-09: Rabat powyżej limitu kelnera
**Flow:**
1. Kelner ma limit 10%
2. Próbuje dać 15%
3. System: "Przekroczono limit rabatu (max 10%)"
4. Wymaga autoryzacji managera

---

### SC-10-10: Równoczesna edycja przez 2 kelnerów
**Flow:**
1. Kelner A i B otwierają to samo zamówienie
2. A dodaje produkt, B dodaje inny
3. System obsługuje optymistic locking
4. Obie zmiany zapisane (merge) lub konflikt do rozwiązania

---

## 11. RAPORTY I ROZLICZENIA

### SC-11-01: Zamknięcie zmiany kelnera
**Flow:**
1. Kelner kończy pracę
2. Klika "Zamknij zmianę"
3. Deklaracja gotówki: 1500 zł
4. System oblicza: powinno być 1480 zł
5. Nadwyżka: +20 zł
6. Raport zmiany: sprzedaż, napiwki, nadwyżka/niedobór

---

### SC-11-02: Raport dobowy fiskalny
**Flow:**
1. Manager kończy dzień
2. "Zamknięcie dnia"
3. System generuje raport dobowy
4. Drukarka fiskalna drukuje raport Z
5. Wszystkie zmiany zamknięte

---

### SC-11-03: Generowanie JPK_VAT
**Flow:**
1. Księgowa eksportuje za miesiąc
2. `GET /api/jpk/generate?month=2026-02`
3. System generuje JPK_V7M XML
4. Plik zgodny ze schematem MF

---

### SC-11-04: Wysyłka faktury do KSeF
**Flow:**
1. Faktura wystawiona
2. `POST /api/ksef/send` z invoiceId
3. System wysyła do KSeF
4. Polling statusu
5. UPO (Urzędowe Potwierdzenie Odbioru) zapisane

---

## PODSUMOWANIE

| Kategoria | Liczba scenariuszy |
|-----------|-------------------|
| 1. Logowanie | 4 |
| 2. Otwieranie zamówienia | 5 |
| 3. Dodawanie produktów | 14 |
| 4. Wysyłka do kuchni | 7 |
| 5. Przenoszenie/dzielenie | 5 |
| 6. Rabaty/promocje | 5 |
| 7. Płatności | 12 |
| 8. Zamknięcie/paragon | 10 |
| 9. Scenariusze złożone | 10 |
| 10. Scenariusze negatywne | 10 |
| 11. Raporty | 4 |
| **RAZEM** | **86** |

---

> Dokument: SCENARIUSZE-SPRZEDAZ.md
> Wersja: 1.0
> Data: 2026-02-21
