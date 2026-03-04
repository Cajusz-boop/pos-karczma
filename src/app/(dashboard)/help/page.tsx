"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  UtensilsCrossed,
  ChefHat,
  Crown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type Section = {
  id: string;
  title: string;
  content: string;
};

const WAITER_DOCS: Section[] = [
  {
    id: "w-login",
    title: "Logowanie",
    content: `1. Na ekranie logowania wpisz swój 4-cyfrowy PIN lub przyłóż kapsułkę/kartę NFC.
2. Po zalogowaniu zobaczysz mapę stolików.
3. Jeśli nie masz otwartej zmiany, system poprosi o jej otwarcie.
4. Aby się wylogować, kliknij swoje imię w prawym górnym rogu → Wyloguj.
⚠️ Przed wylogowaniem musisz zamknąć zmianę (rozliczyć gotówkę).`,
  },
  {
    id: "w-order",
    title: "Przyjmowanie zamówienia",
    content: `1. Kliknij wolny stolik (zielony) na mapie.
2. Wybierz produkty z menu po prawej stronie — kliknij = dodaj 1 szt.
3. Długie naciśnięcie produktu → popup z wyborem ilości (1-9).
4. Kliknięcie pozycji na rachunku → +1 ilość.
5. Aby usunąć pozycję, przesuń w lewo lub kliknij minus.
6. Modyfikatory (np. stopień wysmażenia) pojawią się automatycznie.
7. Kliknij "Wyślij do kuchni" — zamówienie trafi na KDS.`,
  },
  {
    id: "w-payment",
    title: "Płatność",
    content: `1. Kliknij przycisk "Rachunek" lub długo naciśnij stolik → Rachunek.
2. Wybierz formę płatności: Gotówka, Karta, BLIK, Mix, Voucher, Na pokój.
3. Gotówka: wpisz kwotę od klienta, system pokaże resztę.
4. Karta/BLIK: potwierdź akceptację po transakcji na terminalu.
5. Mix: dodaj kilka form płatności (np. część gotówką, część kartą).
6. Voucher: wpisz kod z karty podarunkowej.
7. Na pokój: wybierz pokój hotelowy z listy.
8. Kliknij "Paragon" lub "Faktura" — zamówienie zostanie zamknięte.`,
  },
  {
    id: "w-split",
    title: "Podział rachunku",
    content: `1. W oknie płatności kliknij "Podziel rachunek".
2. Wybierz liczbę osób (2-20).
3. System podzieli rachunek równo — każda osoba dostanie osobne zamówienie.
4. Wróć do mapy stolików i opłać każde zamówienie osobno.`,
  },
  {
    id: "w-discount",
    title: "Rabat",
    content: `1. W oknie płatności kliknij "Rabat".
2. Wybierz typ: procentowy (%) lub kwotowy (zł).
3. Wpisz wartość i kliknij "Zastosuj".
4. Rabat zostanie naliczony na cały rachunek.`,
  },
  {
    id: "w-ereceipt",
    title: "E-paragon",
    content: `Po zamknięciu rachunku system automatycznie generuje e-paragon.
Gość może go odebrać na 2 sposoby:
1. QR kod — gość skanuje telefonem.
2. SMS — wpisz numer telefonu gościa, system wyśle link.
E-paragon jest opcjonalny — możesz go pominąć.`,
  },
];

const COOK_DOCS: Section[] = [
  {
    id: "c-kds",
    title: "Ekran KDS (Kitchen Display)",
    content: `1. KDS pokazuje zamówienia w kolejności przyjęcia.
2. Kolory: zielony = nowe, żółty = w trakcie, czerwony = przekroczony czas.
3. Kliknij zamówienie → "Zaczynam" → "Gotowe".
4. Tryby widoku: Kafelkowy (domyślny), All-Day (lista), Expo (wydawka).
5. Przełączaj tryby przyciskami na górze ekranu.`,
  },
  {
    id: "c-86",
    title: "Tablica 86 (niedostępne)",
    content: `1. Wejdź w Tablica 86 z menu kuchni.
2. Aby oznaczyć produkt jako niedostępny: znajdź go na liście i kliknij.
3. Produkt zniknie z menu kelnerów natychmiast.
4. Aby przywrócić: kliknij produkt w sekcji "Niedostępne".`,
  },
  {
    id: "c-sounds",
    title: "Dźwięki i czcionki",
    content: `1. Ikona głośnika na górze → włącz/wyłącz dźwięki.
2. Nowe zamówienie = dźwięk powiadomienia.
3. Przekroczony czas = alarm.
4. Rozmiar czcionki: SM / MD / LG / XL — przycisk na górze.`,
  },
  {
    id: "c-breakfast",
    title: "Widok śniadaniowy",
    content: `1. Wejdź w Śniadania z menu kuchni.
2. Lista gości hotelowych ze śniadaniem na dziś.
3. Kliknij gościa = oznacz jako obsłużony.
4. Widoczne: numer pokoju, imię, liczba osób, alergeny, preferencje.`,
  },
];

const OWNER_DOCS: Section[] = [
  {
    id: "o-reports",
    title: "Raporty",
    content: `Dostępne raporty w sekcji Raporty:
• Dzienny — obroty, paragony, płatności per forma
• Zmianowy — rozliczenie kelnera
• Food Cost — koszt składników vs cena sprzedaży
• Menu Engineering — macierz BCG (gwiazdy, konie, zagadki, psy)
• Napiwki — podział per kelner z poolingiem
• Eksport — CSV/XML do Optima, Symfonia, wFirma`,
  },
  {
    id: "o-settings",
    title: "Ustawienia",
    content: `W sekcji Ustawienia znajdziesz:
• Kategorie menu — tworzenie, edycja, kolejność, sezonowe
• Modyfikatory — grupy opcji (np. stopień wysmażenia)
• Stawki VAT — symbole fiskalne
• Sale i stoliki — dodawanie, edycja, układ drag-and-drop
• Drukarki — fiskalna, kuchnia, bar
• KDS — progi czasowe, dźwięki, tryb domyślny
• Grafik pracy — planowanie zmian, dostępność
• Vouchery — karty podarunkowe
• Program lojalnościowy — punkty, nagrody
• Import/eksport menu — CSV`,
  },
  {
    id: "o-dayclose",
    title: "Zamknięcie dnia",
    content: `1. Upewnij się, że wszystkie rachunki są zamknięte.
2. Wejdź w Operacje → Zamknięcie dnia.
3. System wygeneruje raport dobowy.
4. Raport fiskalny zostanie wydrukowany (jeśli drukarka podłączona).
5. Wszystkie otwarte zmiany zostaną zamknięte.`,
  },
  {
    id: "o-users",
    title: "Zarządzanie pracownikami",
    content: `1. Wejdź w Ustawienia → Użytkownicy.
2. Dodaj nowego pracownika: imię, PIN, rola (Kelner/Kucharz/Admin).
3. Zmień PIN: edytuj użytkownika.
4. Dezaktywuj: pracownik nie może się zalogować, ale historia zostaje.
5. Kapsułka NFC: sparuj w ustawieniach użytkownika.`,
  },
  {
    id: "o-hotel",
    title: "Integracja hotelowa",
    content: `1. Konfiguracja w Ustawienia → Hotel.
2. Wpisz adres API hotelu i klucz API.
3. Po włączeniu: płatność "Na pokój" w kasie, widok śniadaniowy w kuchni.
4. Goście hotelowi są automatycznie synchronizowani jako klienci POS.`,
  },
];

function DocSection({ sections }: { sections: Section[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {sections.map((s) => (
        <div key={s.id} className="rounded-lg border">
          <button
            type="button"
            className="flex w-full items-center gap-2 p-3 text-left font-medium"
            onClick={() => toggle(s.id)}
          >
            {expanded.has(s.id) ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            {s.title}
          </button>
          {expanded.has(s.id) && (
            <div className="border-t px-4 pb-3 pt-2 text-sm whitespace-pre-wrap text-muted-foreground">
              {s.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HelpPage() {
  const [tab, setTab] = useState<"waiter" | "cook" | "owner">("waiter");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold">Pomoc</h1>
          <p className="text-sm text-muted-foreground">Instrukcja obsługi systemu POS</p>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === "waiter" ? "default" : "outline"}
          className="flex-1 gap-1.5"
          onClick={() => setTab("waiter")}
        >
          <UtensilsCrossed className="h-4 w-4" />
          Kelner
        </Button>
        <Button
          variant={tab === "cook" ? "default" : "outline"}
          className="flex-1 gap-1.5"
          onClick={() => setTab("cook")}
        >
          <ChefHat className="h-4 w-4" />
          Kucharz
        </Button>
        <Button
          variant={tab === "owner" ? "default" : "outline"}
          className="flex-1 gap-1.5"
          onClick={() => setTab("owner")}
        >
          <Crown className="h-4 w-4" />
          Właściciel
        </Button>
      </div>

      {tab === "waiter" && <DocSection sections={WAITER_DOCS} />}
      {tab === "cook" && <DocSection sections={COOK_DOCS} />}
      {tab === "owner" && <DocSection sections={OWNER_DOCS} />}
    </div>
  );
}
