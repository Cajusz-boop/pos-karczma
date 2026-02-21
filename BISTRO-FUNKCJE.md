# Brakujące funkcje z Bistro Simplex — DO IMPLEMENTACJI

> Porównanie z dokumentacją: https://symplex.eu/download/bistro.pdf
> Format: `- [ ] ID Opis` — gotowe do przeniesienia do CHECKLIST.md

---

## 15. DOSTAWY I KIEROWCY

- [ ] DK1 Strefy dostaw — definiowanie numerów, nazw, granic obszarów
- [ ] DK2 Prowizja kierowcy per strefa — kwota za dostawę w danej strefie
- [ ] DK3 Koszt dostawy per strefa — doliczany do zamówień poniżej progu
- [ ] DK4 Towar jako koszt dostawy — wskazanie produktu "Dostawa" w magazynie
- [ ] DK5 Baza ulic z przypisaniem do stref — auto-wybór strefy po adresie
- [ ] DK6 Przypisanie kierowcy do zamówienia — wybór z listy kierowców
- [ ] DK7 Lista adresów dostaw — F11 podział zamówień na kierowców
- [ ] DK8 Zmień kierowcę — reassign zamówienia do innego kierowcy
- [ ] DK9 Oznacz "w drodze" — status z blokadą zmian
- [ ] DK10 Drukuj adresy — bon z adresami dla kierowcy
- [ ] DK11 Rozliczenie kierowców — F9 filtrowanie, zaznaczanie, raport
- [ ] DK12 Raport kierowców — dostawy, prowizje, wartości per kierowca
- [ ] DK13 Etykiety na wynos — druk nalepek na opakowania (osobna drukarka)
- [ ] DK14 Drukuj adres przed fiskalizacją — opcja dla dostaw

---

## 16. PRODUKTY WAGOWE

- [ ] PW1 Wymagane potwierdzenie wagi po przygotowaniu — flaga produktu (ryby, mięsa)
- [ ] PW2 "zatw. wagę" status — wizualny w zamówieniu, blokuje rachunek
- [ ] PW3 Waga przez kod kreskowy — skan etykiety z wagi metkującej
- [ ] PW4 Seryjne zatwierdzanie wagi — skanowanie wielu etykiet naraz
- [ ] PW5 Odczyt masy z wagi elektronicznej — przez COM/USB
- [ ] PW6 Auto odczyt masy przy wyborze produktu — z wagi kalkulacyjnej
- [ ] PW7 Pytaj o masę w KDS — kucharz wpisuje wagę po przygotowaniu
- [ ] PW8 Odczytaj masę z wagi w KDS — dla kucharza
- [ ] PW9 Tara — waga opakowania przy ważeniu
- [ ] PW10 Zeruj wagę — reset tary

---

## 17. ZESTAWY ZAAWANSOWANE

- [ ] ZA1 Nadgrupy towarowe (1-10) — zbiory grup dla dodatków o ograniczonym zakresie
- [ ] ZA2 Dodatek w nadgrupie X — typ produktu, dostępny tylko w wybranych grupach
- [ ] ZA3 Zestaw z ceną wyliczaną (składniki na paragonie) — cena = suma składników
- [ ] ZA4 Zestaw z ceną wyliczaną (zestaw na paragonie) — suma, ale 1 pozycja na paragonie
- [ ] ZA5 Zestaw pomocniczy — nie pobiera się jako pozycja, auto-dodaje składniki
- [ ] ZA6 Max ilość składników na zamówieniu — limit dla zestawu (np. max 4 dodatki do pizzy)
- [ ] ZA7 Ilość składników bezpłatnych — pierwsze N gratis, kolejne płatne
- [ ] ZA8 Gdy przekroczona suma podstawowych — zwiększ cenę o składnik opcjonalny
- [ ] ZA9 Składnik ukryty i niewidoczny — tylko do rozchodu (np. ciasto do pizzy)
- [ ] ZA10 Składnik nie drukowany w kuchni — bo kucharz zna skład
- [ ] ZA11 Składnik drukowany z "BRAK" — gdy usunięty
- [ ] ZA12 Składnik może wystąpić wielokrotnie — powtarzalny
- [ ] ZA13 Składnik drukowany gdy kilkukrotnie — warunkowy wydruk
- [ ] ZA14 Składnik pobrany z info "BRAK" — domyślnie wyłączony
- [ ] ZA15 Składnik zawsze jedna porcja — niepodzielny (np. bułka)
- [ ] ZA16 Poziom cenowy zestawu pomocniczego — cena składników wg wybranego poziomu

---

## 18. ZAMÓWIENIA — FUNKCJE DODATKOWE

- [ ] ZD1 Podział zamówienia na dania (kursy 1/2/3) — separacja "podsumowanie dania nr X"
- [ ] ZD2 Minutnik per pozycja — opóźnienie przygotowania (np. "za 15 min")
- [ ] ZD3 Minutnik całe danie — opóźnienie całego kursu
- [ ] ZD4 "Ogień" — priorytet natychmiastowy, ponaglenie kuchni
- [ ] ZD5 Dodatek odejmowany (2× klik) — z minusem i ujemną ceną
- [ ] ZD6 Na wynos per pozycja — tylko wskazana do zapakowania
- [ ] ZD7 Lista 1/2/3 — 3 przewijalne listy w zamówieniu
- [ ] ZD8 Ręczna kolejność pozycji — klawisz "Kolejność pozycji"
- [ ] ZD9 Łącz podobne — zbij te same produkty do jednej linii
- [ ] ZD10 Kopia zamówienia — ponowny wydruk całego do kuchni
- [ ] ZD11 Limit zamówienia — max kwota (np. dla poczęstunku firmowego)
- [ ] ZD12 Ilość osób przy stoliku — do statystyk średnia/gość
- [ ] ZD13 Pozostaw zakończone na stoliku — widoczne po zapłacie do podglądu

---

## 19. INTERFEJS ZAMÓWIENIA

- [ ] IZ1 Tryb klawiatury numerycznej — kod produktu ENTER
- [ ] IZ2 ILOŚĆ*KOD*CENA — szybkie wprowadzanie (np. 20*1003*1.23)
- [ ] IZ3 Szukaj po nazwie T9 — jak SMS (5,2,5,5,6 = jajko)
- [ ] IZ4 Szukaj po kodzie w grupie — w aktualnej grupie
- [ ] IZ5 6 rzędów przycisków — konfigurowalnych per operator
- [ ] IZ6 Przyciski — przewijanie rzędów (klawisz)
- [ ] IZ7 Makra nagrywane (1-5) — sekwencje akcji (klawisz ~)
- [ ] IZ8 Ilość 0.5 — szybki przycisk
- [ ] IZ9 Ilość 0.25 — szybki przycisk
- [ ] IZ10 Gotówka w kasie — podgląd stanu
- [ ] IZ11 Szczegóły produktu — info + zerowanie stanu magazynowego

---

## 20. UPRAWNIENIA SZCZEGÓŁOWE

- [ ] UP1 Dostęp do grup towarowych per operator — kelner widzi tylko wybrane grupy
- [ ] UP2 Dostęp do poziomów cenowych per operator — kelner używa tylko wybranych cen
- [ ] UP3 Przypisanie stolików do kelnera — kelner obsługuje tylko swoje stoliki
- [ ] UP4 PIN dla BistroMo — osobny PIN na bonownik (niezależny od głównego)
- [ ] UP5 Uprawnienia zakładka Dostęp — które opcje restauracji dostępne
- [ ] UP6 Uprawnienia zakładka Sala — funkcje na poziomie sali
- [ ] UP7 Uprawnienia zakładka Operacje — operacje w oknie sali
- [ ] UP8 Uprawnienia zakładka Zakazy — zakazy podczas wpisywania zamówienia
- [ ] UP9 Uprawnienia zakładka Raporty — które raporty dostępne
- [ ] UP10 Uprawnienia zakładka Rachunek — uprawnienia przy kończeniu zamówienia
- [ ] UP11 Uprawnienia zakładka Zamówienie — możliwości przy tworzeniu
- [ ] UP12 Uprawnienia zakładka Do domu — uprawnienia dla dostaw
- [ ] UP13 Uprawnienia zakładka Konfiguracja — możliwość zmian w ustawieniach
- [ ] UP14 F4 Przyciski per operator — definiowanie przycisków (6 grup)
- [ ] UP15 Kopiowanie uprawnień — kopiuj profil operatora
- [ ] UP16 Eksport/import operatora — do/z pliku
- [ ] UP17 Automatyczne wylogowanie — po 20s/40s/1min bezczynności

---

## 21. AUTORYZACJA ROZSZERZONA

- [ ] AR1 Czytnik kart magnetycznych COM — LongShine, dowolny szeregowy
- [ ] AR2 Czytnik kart magnetycznych USB wedge — symulacja klawiatury
- [ ] AR3 Czytnik RFID/Clamshell/Unique — karty zbliżeniowe 19200 8N1
- [ ] AR4 Różne typy Dallas — Dataprocess, demiurg.pl, Jarltech, MP00202
- [ ] AR5 Kod odczytany z pliku — auto-logowanie przez zewnętrzny program
- [ ] AR6 Ręcznie — wybór z listy kelnerów — bez hasła
- [ ] AR7 Skonfiguruj czytnik — funkcje konfiguracji per typ

---

## 22. DRUKARKI KUCHENNE ZAAWANSOWANE

- [ ] DRK1 Definiowalne sekwencje wydruków — Nagłówek, Stopka, Pozycja, Storno, Dodatek, Zestaw, Składnik, Danie, Minutnik, Ogień
- [ ] DRK2 Pseudozmienne w szablonach — $[Nazwa,12,0]$, $[Roznica,3,1]$ (~50 zmiennych)
- [ ] DRK3 Kody sterujące ESC/POS — |x1b!|x30 formatowanie
- [ ] DRK4 Log/dziennik wydruków — archiwum 100 dni
- [ ] DRK5 Pokaż zapisy z LOG-u — przeglądanie historii
- [ ] DRK6 Zdalny dostęp comserwer.exe — drukarka na innym komputerze w sieci
- [ ] DRK7 Max znaków w linii — konfiguracja per drukarka
- [ ] DRK8 Podsumowanie pod wydrukiem — łączne ilości produktów
- [ ] DRK9 Nie pokazuj stornowanych w podsumowaniu — filtrowanie
- [ ] DRK10 Testuj stan przed/po wydruku — status drukarki
- [ ] DRK11 Drukuj małymi porcjami (TCP) — dla wolnych połączeń
- [ ] DRK12 Podgląd przed wydrukiem — per typ dokumentu

---

## 23. KDS ROZSZERZENIA

- [ ] KDS1 Panel zamówień dla klientów (TV) — numery do odebrania
- [ ] KDS2 Wyślij na port UDP 3001 — dla innych programów
- [ ] KDS3 Web KDS MySQL — zewnętrzna baza danych
- [ ] KDS4 Archiwum zrealizowanych — historia z możliwością przeglądania
- [ ] KDS5 Zatwierdzenie usuwa z podglądu — opcja
- [ ] KDS6 Wymagaj zatwierdzenia wszystkich — przed całością dania
- [ ] KDS7 Pytaj o potwierdzenie — przed zmianą statusu
- [ ] KDS8 Cofnij zaznaczenie — możliwość cofnięcia statusu
- [ ] KDS9 Nie wrzucaj automatycznie nowych — ręczne przewijanie +/-
- [ ] KDS10 Opcje nagłówka — nr stolika/opis/zamówienia/kelner

---

## 24. OPCJE GLOBALNE BRAKUJĄCE

- [ ] OG1 Maksymalny nr zamówienia — limit przed resetem do 1
- [ ] OG2 Zerowanie licznika przy nowym dniu — auto-reset
- [ ] OG3 Zerowanie po raporcie zmiany — reset po zamknięciu
- [ ] OG4 Deklaracja gotówki per kelner — osobno dla każdego
- [ ] OG5 Raport zmiany per stanowisko — osobne rozliczenie per komputer
- [ ] OG6 Własna numeracja faktur Bistro — oddzielna od głównej
- [ ] OG7 Utrzymuj datę przez zmianę — dla pracy nocnej (po 24:00)
- [ ] OG8 Czas od ostatniej modyfikacji — na stoliku zamiast od złożenia
- [ ] OG9 Opisy ogólne faktur — 3 opisy wg stawki VAT + PKWIU
- [ ] OG10 Opisy rozchodów RW — typy: Straty/Surowce/Zużycie + uwagi
- [ ] OG11 Błąd wydruku fiskalnego — pozwól/zakaz dalszej pracy
- [ ] OG12 Zestawy — nie pokazuj zawartości po kliknięciu
- [ ] OG13 Powiadomienie przed rezerwacją — X minut wcześniej miganie
- [ ] OG14 Naliczanie wg czasu — sala zabaw, bilard (przedziały czasowe)

---

## 25. OPCJE LOKALNE BRAKUJĄCE

- [ ] OL1 Zakres magazynów — które magazyny widoczne na stanowisku
- [ ] OL2 Zakres grup — które grupy widoczne
- [ ] OL3 Pytaj o ilość (niewagowe) — wymuszenie
- [ ] OL4 Pytaj o ilość (wagowe) — wymuszenie
- [ ] OL5 Pytaj o cenę (wszystkie) — wymuszenie wyboru poziomu
- [ ] OL6 Pytaj o cenę (ręczne) — dla produktów "cena ręczna"
- [ ] OL7 Nie twórz grupy "inne" — bez zbioru wszystkich produktów
- [ ] OL8 Odśwież bazę po wyjściu z zamówienia — sync produktów
- [ ] OL9 Nie aktualizuj stanów po wydruku — ręczne zatwierdzanie
- [ ] OL10 Produkcja na bieżąco — auto RW/PW z receptur
- [ ] OL11 Wtyczki — program po wejściu/wyjściu z zamówienia
- [ ] OL12 Kolejność rachunków — od najstarszego/najmłodszego
- [ ] OL13 Zamówienia zalogowanego na początku — filtrowanie listy
- [ ] OL14 Domyślny poziom cenowy — dla stanowiska
- [ ] OL15 Wyślij do kuchni bez pytania — przy wyjściu z zamówienia
- [ ] OL16 Zmiana operatora = wyjście — auto-wyjście z zamówienia
- [ ] OL17 Wyloguj po wyjściu z zamówienia — auto-wylogowanie
- [ ] OL18 Wymuszaj wybór kelnera — po wyjściu z zamówienia
- [ ] OL19 Nie sumuj podobnych pozycji — osobne linie
- [ ] OL20 Pytaj o ilość osób — po otwarciu zamówienia
- [ ] OL21 Drukuj w kuchni bez pytania (rachunek) — przy płatności
- [ ] OL22 Drukuj natychmiast po zmianie — każda modyfikacja
- [ ] OL23 Raport fiskalny z raportem zmiany — łącznie
- [ ] OL24 Faktury z opisem ogólnym — zawsze/pytaj
- [ ] OL25 Pytaj czy fiskalizować — przed wydrukiem
- [ ] OL26 Komunikaty o zatwierdzeniu — paragon/faktura/WZ/RW
- [ ] OL27 Komunikaty o wysłaniu do kuchni — info
- [ ] OL28 Nie drukuj zerowych w raportach — oszczędność papieru
- [ ] OL29 Pytaj czy drukować — faktura/WZ/paragon/RW
- [ ] OL30 Nie drukuj zerowych na paragonach — dla zestawów
- [ ] OL31 Paragony z opisem ogólnym — zamiana nazw produktów
- [ ] OL32 Sumuj pozycje przed fiskalizacją — optymalizacja wydruku
- [ ] OL33 Typ dok. magazynowego dla fak. ogólnej — Paragon/RW
- [ ] OL34 Co fiskalizować — wybór dokumentów
- [ ] OL35 Nr stanowiska — dla raportów per punkt sprzedaży

---

## 26. STOLIKI ROZSZERZENIA

- [ ] ST1 Własne tło sali — JPG/PNG/BMP import
- [ ] ST2 Elementy wystroju — szablony do układania tła
- [ ] ST3 Obracanie stolika — zgodnie/przeciwnie do zegara
- [ ] ST4 Warstwy wierzch/spód — Z-order elementów
- [ ] ST5 Opis stolika — np. "Przy kominku", "VIP"
- [ ] ST6 Kolory statusów stolików — pełna paleta Bistro (8 kombinacji)
- [ ] ST7 Dwa zamówienia na stoliku — naprzemienne wyświetlanie
- [ ] ST8 Kolor szary — wolny ale niedostępny dla kelnera

---

## 27. RAPORTY ROZSZERZENIA

- [ ] RP1 Raport stolików — sprzedaż per stolik z podziałem na kategorie
- [ ] RP2 Podział raportu zmiany na grupy/drukarki/towary — szczegóły
- [ ] RP3 Podział na rabaty — w raporcie zmiany
- [ ] RP4 Ilość zamówień/gości — statystyki w raporcie
- [ ] RP5 Ilość paragonów/faktur/WZ/RW — podział dokumentów
- [ ] RP6 Ilość pustych rachunków — anulowane całe
- [ ] RP7 Średnio zamówienie/gość — wskaźniki rentowności
- [ ] RP8 Produkuj i aktualizuj stany — auto-receptury przy raporcie zmiany
- [ ] RP9 W tym RW gotówkowe — wydzielone w raporcie
- [ ] RP10 Nie zafiskalizowano — kwota w raporcie

---

## 28. FUNKCJE MENADŻERA BRAKUJĄCE

- [ ] FM1 Fiskalizacja zbiorcza — dla niezafiskalizowanych dostaw
- [ ] FM2 Aktualizuj stany magazynowe — zbiorcze zatwierdzenie dokumentów
- [ ] FM3 Usuwanie rachunków zamkniętych — czyszczenie starych
- [ ] FM4 Serwisowe odtworzenie rachunków — disaster recovery po awarii
- [ ] FM5 Archiwum konfiguracji — kopie zapasowe ustawień z datami
- [ ] FM6 Zeruj numerator zamówień — ręczny reset

---

## 29. PRODUKTY DODATKOWE FLAGI

- [ ] PF1 Po wyborze przejdź do grupy — auto-nawigacja (np. deser → napoje)
- [ ] PF2 Po wyborze wykonaj akcję — np. otwórz uwagi do produktu
- [ ] PF3 Artykuł i dodatek globalny — hybrydowy typ produktu
- [ ] PF4 Zakaz wydruku z opisem ogólnym — na fakturze
- [ ] PF5 Zakaz zmiany ilości — po dodaniu do zamówienia
- [ ] PF6 Może wystąpić jednokrotnie — dla stołówek (1 obiad/osoba)
- [ ] PF7 Pytaj o składniki zestawu — po pobraniu do zamówienia
- [ ] PF8 Jako dodatek zawsze 1 porcja — niepodzielny
- [ ] PF9 Domyślnie — ustawienia dla nowych produktów
- [ ] PF10 Domyślnie towar — zastosuj domyślne do wybranego
- [ ] PF11 Domyślnie grupa — zastosuj domyślne do całej grupy
- [ ] PF12 Kopiuj produkt — z zestawem i wszystkimi flagami

---

## PODSUMOWANIE

| Sekcja | Ilość zadań | Priorytet |
|--------|-------------|-----------|
| 15. Dostawy i kierowcy | 14 | 🔴 Wysoki |
| 16. Produkty wagowe | 10 | 🔴 Wysoki |
| 17. Zestawy zaawansowane | 16 | 🟡 Średni |
| 18. Zamówienia — funkcje | 13 | 🔴 Wysoki |
| 19. Interfejs zamówienia | 11 | 🟡 Średni |
| 20. Uprawnienia szczegółowe | 17 | 🟡 Średni |
| 21. Autoryzacja rozszerzona | 7 | 🟢 Niski |
| 22. Drukarki kuchenne | 12 | 🟡 Średni |
| 23. KDS rozszerzenia | 10 | 🟡 Średni |
| 24. Opcje globalne | 14 | 🟢 Niski |
| 25. Opcje lokalne | 35 | 🟢 Niski |
| 26. Stoliki rozszerzenia | 8 | 🟢 Niski |
| 27. Raporty rozszerzenia | 10 | 🟡 Średni |
| 28. Funkcje menadżera | 6 | 🟡 Średni |
| 29. Produkty flagi | 12 | 🟢 Niski |
| **RAZEM** | **185** | |

---

## REKOMENDOWANA KOLEJNOŚĆ IMPLEMENTACJI

### Faza 1 — Core Delivery (🔴)
- DK1-DK14 Strefy dostaw i kierowcy
- ZD1-ZD4 Minutnik i Ogień
- PW1-PW4 Zatwierdzanie wagi

### Faza 2 — Zestawy i Zamówienia (🟡)
- ZA1-ZA16 Zestawy zaawansowane
- ZD5-ZD13 Pozostałe funkcje zamówień

### Faza 3 — UX i Uprawnienia (🟡)
- IZ1-IZ11 Interfejs zamówienia
- UP1-UP17 Uprawnienia szczegółowe
- KDS1-KDS10 KDS rozszerzenia

### Faza 4 — Drukarki i Raporty (🟡)
- DRK1-DRK12 Drukarki kuchenne
- RP1-RP10 Raporty rozszerzenia
- FM1-FM6 Funkcje menadżera

### Faza 5 — Opcje i Konfiguracja (🟢)
- OG1-OG14 Opcje globalne
- OL1-OL35 Opcje lokalne
- ST1-ST8 Stoliki
- PF1-PF12 Flagi produktów
- AR1-AR7 Autoryzacja rozszerzona
