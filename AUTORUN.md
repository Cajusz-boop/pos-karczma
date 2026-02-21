# AUTORUN — Nieskończona pętla implementacji

## Jak uruchomić

1. Otwórz Cursor w folderze `c:\pos-karczma`
2. Otwórz nowy czat (Ctrl+L)
3. Wklej prompt z sekcji poniżej
4. Cursor zacznie robić zadania jedno po drugim
5. **NIE MUSISZ NIC ROBIĆ** — Cursor sam pobiera, implementuje, oznacza, i bierze następne

## PROMPT DO WKLEJENIA (skopiuj CAŁY blok)

```
Jesteś w trybie **INFINITE EXECUTION LOOP**. Twoim celem NIE JEST "zrobienie planu", tylko **wykonywanie zadań z task_manager.py**.

ZASADA "ZERO MYŚLENIA O PRZYSZŁOŚCI":
1. Nie analizuj listy zadań na przód.
2. Interesuje Cię tylko **TERAZ**.

KONTEKST PROJEKTU:
- POS gastronomiczny "Karczma Łabędź" w c:\pos-karczma
- Stack: Next.js 14 + TypeScript + Tailwind + shadcn/ui + Prisma + MariaDB
- Język UI: Polski, język kodu: Angielski
- Schema: prisma/schema.prisma
- Szczegółowy plan: c:\Users\hp\.cursor\plans\pos_bistro_simplex_rebuild_cd630ca9.plan.md
- HotelSystem do integracji: C:\HotelSystem (ten sam stack)

INSTRUKCJA PĘTLI (Wykonuj w nieskończoność):

KROK A: Pobranie
- Uruchom: python task_manager.py next
- Pobierz z outputu ID zadania (np. B1, S2) oraz jego opis.
- Jeśli skrypt zwróci zadanie -> NATYCHMIAST przejdź do kroku B.
- Jeśli "KONIEC" -> napisz "Wszystkie zadania wykonane!" i zatrzymaj się.

KROK B: Implementacja (Deep Focus)
- Przeczytaj szczegóły zadania w planie (plan.md) — szukaj po ID lub opisie.
- Zaimplementuj zadanie w kodzie — twórz/edytuj pliki.
- Jeśli potrzebny nowy pakiet npm — zainstaluj.
- Jeśli potrzebna zmiana schema Prisma — zrób.
- Sprawdź linter (ReadLints) na zmienionych plikach i napraw błędy.
- Nie pytaj o decyzje — podejmij najlepszą sam.
- Jeśli kod jest gotowy -> przejdź do kroku C.

KROK C: Zamknięcie
- Uruchom: python task_manager.py done <ID> --status=PASS --details="Krótki opis co zrobiłeś"
- (Zastąp <ID> faktycznym ID pobranym w kroku A).
- **KRYTYCZNE:** Zaraz po tym, jak zobaczysz sukces komendy done, **AUTOMATYCZNIE, BEZ PYTANIA, BEZ PODSUMOWANIA** wróć do KROKU A.

ZABRANIAM CI:
- Zatrzymywania się po kilku zadaniach.
- Pytania "Czy kontynuować?".
- Robienia list "To-Do" w czacie.
- Analizowania CHECKLIST.md ręcznie (używaj TYLKO python task_manager.py).
- Podsumowywania postępu (od tego jest python task_manager.py stats).

Twój jedyny cel to pętla: Next -> Code -> Done -> Next -> Code -> Done...

START.
```

## Komendy kontrolne

Jeśli musisz interweniować:
- `python task_manager.py stats` — sprawdź postęp
- `python task_manager.py skip <ID> --details="powód"` — pomiń zadanie
- `python task_manager.py reset` — wyzeruj stan (po restarcie Cursora)

## Uwagi

- Cursor ma limit kontekstu (~30 zadań). Gdy się "zgubi" — otwórz NOWY czat i wklej prompt ponownie
- task_manager.py sam wie gdzie skończył (pierwsze `[ ]` w CHECKLIST.md)
- Safety stop: jeśli to samo zadanie pobierane 3x bez sukcesu — manager się zatrzyma
- Wyniki logowane w TASK-RESULTS.md
- Batch limit domyślnie WYŁĄCZONY (nieskończona pętla)

## Szacowany czas

| Sekcja | Zadań | ~Czas |
|--------|-------|-------|
| 1. Blokery | 11 | 2-3h |
| 2. Kapsułka | 6 | 1-2h |
| 3. Operacje | 5 | 1-2h |
| 4. Compliance | 3 | 1h |
| 5. Naprawy | 5 | 1h |
| 6. Szybkość | 11 | 2-3h |
| 7. Infra | 5 | 1-2h |
| 8. Kuchnia | 14 | 3-4h |
| 9. SoftPOS | 3 | 1h |
| 10. Web Push | 4 | 1-2h |
| 11. Hotel | 5 | 1-2h |
| 12. Biznes | 3 | 1h |
| 13. UX | 3 | 1h |
| 14. Testy | 56 | 4-6h |
| **RAZEM** | **134** | **~20-30h** |
