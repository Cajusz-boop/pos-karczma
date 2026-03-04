/**
 * Parser liczby gości z tytułu/opisu wydarzenia z Google Calendar.
 * Wzorce oparte na rzeczywistych danych z kalendarza Karczmy Łabędź.
 */
export function parseGuestCount(title: string, description: string): number | null {
  const text = `${title ?? ""} ${description ?? ""}`.toLowerCase();

  const patterns = [
    /ok\s+(\d+)\s+os\b/,           // "ok 25 os"
    /(\d+)\s+os[oó]b\b/,           // "25 osób"
    /(\d+)\s+os\b/,                // "25 os"
    /(\d+)\s+pl\b/,                // "35 pl" (płatnych)
    /(\d+)\s+pla\b/,               // "35 pla"
    /(\d+)\s+go[sś]ci\b/,          // "25 gości"
    /(\d+)\s+stk[a]?\b/,           // "18 stka", "36 stk"
    /ok\s+(\d+)\b/,                // "ok 5" (na końcu/solo)
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > 0 && n < 2000) return n; // sanity check
    }
  }
  return null;
}
