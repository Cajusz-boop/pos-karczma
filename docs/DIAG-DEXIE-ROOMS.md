# Diagnostyka: Brak sal mimo rooms: 5 w Dexie

## Automatyczna (dev)

Po sync DexieProvider loguje w konsoli:
- `[DexieProvider] DIAG: rooms count: X`
- `[DexieProvider] DIAG: sample isActive: ...`
- `[DexieProvider] DIAG: tables count: X`
- `[DexieProvider] DIAG: sample isAvailable: ...`

Oraz jedną z diagnoz:
- `rooms.length === 0` → dane NIE trafiły do Dexie (problem w sync)
- `isActive === 0/false` → filtr `active()` może odrzucać
- `rooms.length > 0` i isActive OK → problem w useLiveQuery / useMemo

## Ręczny test w DevTools Console

Wklej po zobaczeniu "Brak sal" (db musi być gotowy — po sync):

```javascript
const db = window.__POS_DB__;
if (!db) {
  console.log("DB niegotowy — odśwież stronę, poczekaj na sync");
} else {
  const rooms = await db.rooms.toArray();
  const tables = await db.posTables.toArray();
  console.log("rooms count:", rooms.length);
  console.log("sample isActive:", rooms[0]?.isActive, typeof rooms[0]?.isActive);
  console.log("tables count:", tables.length);
  console.log("sample isAvailable:", tables[0]?.isAvailable, typeof tables[0]?.isAvailable);
}
```

Interpretacja:
- `rooms.length === 0` → problem w DexieProvider / sync
- `rooms.length === 5` ale `isActive: 0` (number) → filter `active()` działa źle
- `rooms.length === 5` i `isActive: true` → problem w useLiveQuery / useMemo

## Baza z 0 tabel (uszkodzony schemat)

Jeśli w DevTools → Application → IndexedDB widzisz `PosKarczma` z wersją 20 ale **Length: 0** tabel:

1. **Auto-repair** – DexieProvider przy starcie sprawdza: jeśli baza ma v20 i 0 tabel, usuwa ją i przeładowuje stronę. Baza zostanie utworzona od zera z v21.
2. **Ręczne usunięcie** – DevTools → Application → IndexedDB → „PosKarczma” → Delete database, potem odśwież stronę.

**Ręczny reset w konsoli:**
```javascript
indexedDB.deleteDatabase('PosKarczma');
location.reload();
```

---

## Wnioski — dlaczego rozwiązanie zajęło tak długo

1. **Logi Dexie wprowadzały w błąd** — komunikat `Initial sync complete: rooms: 5, tables: 33` sugerował, że dane są już w Dexie. To były liczby z odpowiedzi API, nie weryfikacja faktycznego zapisu w IndexedDB.

2. **Szukaliśmy na złym poziomie** — skupialiśmy się na hookach (useLiveQuery, useMemo, syncReady), filtrach (isActive), reaktywności. Tymczasem problem był w warstwie storage: **IndexedDB nie miała object stores** (0 tabel).

3. **Diagnostyka schematu była za późno** — dopiero sprawdzenie w DevTools, że `Tabele: Length: 0`, ujawniło przyczynę. To powinno być pierwszym krokiem: „Czy tabele w ogóle istnieją?”.

4. **Abstrakcja Dexie ukryła błąd** — Dexie nie rzuca oczywistego błędu przy otwarciu bazy; `object store not found` pojawia się dopiero przy konkretnych operacjach.

5. **Niewyjaśniona wersja v20** — baza miała v20 (kod miał v1, v2), źródło v20 niejasne. Dopiero świadome sprawdzenie schematu ujawniło uszkodzoną bazę.

**Lekcja na przyszłość:** przy „brak danych mimo sukcesu sync” — najpierw sprawdzić: **czy IndexedDB ma wymagane tabele?** i **czy zapis faktycznie się powiódł?**
