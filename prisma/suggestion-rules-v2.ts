/**
 * Reguły sugestii cross-sell v2 — Karczma Łabędź
 * Schemat 4 slotów: max 1 alkohol/drink (Slot 1), reszta napoje bezalkoholowe
 * Matchowanie: product.name.toLowerCase().includes(klucz)
 */

export type SuggestionType = "CROSS_SELL" | "UPSELL" | "ADDON";

export interface SuggestionRule {
  suggested: string; // nazwa lub fraza do szukania (contains)
  type: SuggestionType;
  priority: number; // 1000=slot1, 900=slot2, 800=slot3, 700=slot4
}

/** Danie (contains) -> sugestie */
export const SUGGESTION_RULES: Record<string, SuggestionRule[]> = {
  // ========== PRZYSTAWKI ==========
  Tatar: [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  Carpaccio: [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Śledzik w oleju": [
    { suggested: "Żywiec z Nalewaka", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Śledzik w śmietanie": [
    { suggested: "Żywiec z Nalewaka", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 800 },
  ],
  "Deska serów": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Deska wędlin": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  Krewetki: [
    { suggested: "Surfer", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  Bruschetta: [
    { suggested: "Blue Dream", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Sałatka Cezar": [
    { suggested: "Hugo Spritz", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 700 },
  ],
  "Sałatka grecka": [
    { suggested: "Hugo Spritz", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Krokiety z kapustą": [
    { suggested: "Barszcz czerwony", type: "ADDON", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Żywiec z Nalewaka", type: "CROSS_SELL", priority: 700 },
  ],
  "Krokiety z mięsem": [
    { suggested: "Barszcz czerwony", type: "ADDON", priority: 1000 },
    { suggested: "Żurek tradycyjny", type: "ADDON", priority: 900 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],

  // ========== CIĘŻKIE MIĘSA ==========
  Golonka: [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Żeberka BBQ": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Żeberka w miodzie": [
    { suggested: "Śliwka w Piwie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Polędwica wołowa": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Stek z antrykotu": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Placek po zbójnicku": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Bitki wołowe": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 800 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 700 },
  ],
  "Rolada wołowa": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],

  // ========== LEKKIE MIĘSA / DRÓB ==========
  "Kotlet schabowy": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Kotlet de volaille": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 900 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Kaczka z jabłkami": [
    { suggested: "Cydr Bursztynowy", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Filet z kurczaka": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Kurczak w sosie grzybowym": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 700 },
  ],
  "Schabowy po cygańsku": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Schab pieczony": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Gulasz wieprzowy": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 700 },
  ],
  "Gulasz wołowy": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 800 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 700 },
  ],
  "Pierogi z mięsem": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Żurek tradycyjny", type: "UPSELL", priority: 700 },
  ],
  "Kiełbasa z grilla": [
    { suggested: "Żurek tradycyjny", type: "UPSELL", priority: 1000 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 900 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],

  // ========== RYBY ==========
  "Filet z łososia": [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Łosoś": [
    { suggested: "Hugo Spritz", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  Pstrąg: [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  Dorsz: [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  Sandacz: [
    { suggested: "Kormoran Jasny", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Ryba dnia": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Fish & Chips": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 900 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  Karp: [
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],

  // ========== ZUPY ==========
  Żurek: [
    { suggested: "Kotlet schabowy", type: "UPSELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Krokiety z mięsem", type: "ADDON", priority: 700 },
  ],
  Rosół: [
    { suggested: "Kotlet schabowy", type: "UPSELL", priority: 1000 },
    { suggested: "Schab pieczony", type: "UPSELL", priority: 900 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Barszcz czerwony": [
    { suggested: "Krokiety z kapustą", type: "ADDON", priority: 1000 },
    { suggested: "Krokiety z mięsem", type: "ADDON", priority: 900 },
    { suggested: "Pierogi ruskie", type: "UPSELL", priority: 800 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 700 },
  ],
  "Barszcz z uszkami": [
    { suggested: "Karp", type: "UPSELL", priority: 1000 },
    { suggested: "Łosoś", type: "UPSELL", priority: 900 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 800 },
  ],
  "Krem z pomidorów": [
    { suggested: "Filet z kurczaka", type: "UPSELL", priority: 1000 },
    { suggested: "Bruschetta", type: "ADDON", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 700 },
  ],
  "Krem z pieczarek": [
    { suggested: "Kurczak w sosie grzybowym", type: "UPSELL", priority: 1000 },
    { suggested: "Risotto grzybowe", type: "UPSELL", priority: 900 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 800 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 700 },
  ],
  Flaki: [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 700 },
  ],
  Ogórkowa: [
    { suggested: "Kotlet schabowy", type: "UPSELL", priority: 1000 },
    { suggested: "Gulasz wieprzowy", type: "UPSELL", priority: 900 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 800 },
  ],
  Kapuśniak: [
    { suggested: "Gulasz wieprzowy", type: "UPSELL", priority: 1000 },
    { suggested: "Kiełbasa z grilla", type: "UPSELL", priority: 900 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 800 },
  ],
  "Zupa dnia": [
    { suggested: "Kotlet schabowy", type: "UPSELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],

  // ========== WEGE ==========
  "Pierogi ruskie": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Pierogi z kapustą": [
    { suggested: "Barszcz czerwony", type: "UPSELL", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Pierogi z jagodami": [
    { suggested: "Latte - Macchiato", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 900 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Naleśniki z serem": [
    { suggested: "Cappuccino", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 900 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 800 },
  ],
  "Naleśniki ze szpinakiem": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Placki ziemniaczane": [
    { suggested: "Gulasz wieprzowy", type: "ADDON", priority: 1000 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 700 },
  ],
  "Kopytka ze szpinakiem": [
    { suggested: "Łabędzie", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Burger wegetariański": [
    { suggested: "Cydr Bursztynowy", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Coca Cola", type: "CROSS_SELL", priority: 900 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Risotto grzybowe": [
    { suggested: "Hugo Spritz", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata z Rozmarynem", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 700 },
  ],
  "Makaron z warzywami": [
    { suggested: "Hugo Spritz", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Sałatka z halloumi": [
    { suggested: "Hugo Spritz", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Fuzetea", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],

  // ========== DESERY ==========
  "Szarlotka z lodami": [
    { suggested: "Cappuccino", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Latte - Macchiato", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 800 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 700 },
  ],
  "Szarlotka": [
    { suggested: "Szarlotka z lodami", type: "UPSELL", priority: 1000 },
    { suggested: "Cappuccino", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 800 },
  ],
  Sernik: [
    { suggested: "Latte - Macchiato", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Cappuccino", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata z Rozmarynem", type: "CROSS_SELL", priority: 800 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 700 },
  ],
  "Brownie z lodami": [
    { suggested: "Espresso", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Cappuccino", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 800 },
  ],
  "Lody gałka": [
    { suggested: "Lody 3 gałki", type: "UPSELL", priority: 1000 },
    { suggested: "Deser lodowy", type: "UPSELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
  ],
  "Lody 3 gałki": [
    { suggested: "Iced Coffee", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Espresso", type: "CROSS_SELL", priority: 900 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 800 },
  ],
  Tiramisu: [
    { suggested: "Espresso", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Cappuccino", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 800 },
  ],
  "Crème brûlée": [
    { suggested: "Espresso", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Herbata z Rozmarynem", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 800 },
  ],
  "Racuchy z jabłkami": [
    { suggested: "Herbata Zimowa", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Cappuccino", type: "CROSS_SELL", priority: 900 },
    { suggested: "Latte z Syropem", type: "CROSS_SELL", priority: 800 },
    { suggested: "Kompotu", type: "CROSS_SELL", priority: 700 },
  ],
  Makowiec: [
    { suggested: "Kawa z Ekspresu", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata z Naszej Spiżarni", type: "CROSS_SELL", priority: 800 },
  ],
  "Deser lodowy": [
    { suggested: "Iced Coffee", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Sok 330ml", type: "CROSS_SELL", priority: 900 },
    { suggested: "Cappy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karafka Wody", type: "CROSS_SELL", priority: 700 },
  ],
  "Panna cotta": [
    { suggested: "Espresso", type: "CROSS_SELL", priority: 1000 },
    { suggested: "Herbata z Rozmarynem", type: "CROSS_SELL", priority: 900 },
    { suggested: "Herbata Eilles", type: "CROSS_SELL", priority: 800 },
  ],

  // ========== NAPOJE → JEDZENIE ==========
  "Kormoran Jasny": [
    { suggested: "Tatar", type: "CROSS_SELL", priority: 800 },
    { suggested: "Deska wędlin", type: "CROSS_SELL", priority: 700 },
    { suggested: "Żeberka BBQ", type: "CROSS_SELL", priority: 600 },
  ],
  Łabędzie: [
    { suggested: "Tatar", type: "CROSS_SELL", priority: 800 },
    { suggested: "Deska wędlin", type: "CROSS_SELL", priority: 700 },
    { suggested: "Golonka", type: "CROSS_SELL", priority: 600 },
  ],
  "Żywiec z Nalewaka 0.5L": [
    { suggested: "Deska wędlin", type: "CROSS_SELL", priority: 800 },
    { suggested: "Śledzik w oleju", type: "CROSS_SELL", priority: 700 },
    { suggested: "Kiełbasa z grilla", type: "CROSS_SELL", priority: 600 },
  ],
  "Hugo Spritz": [
    { suggested: "Sałatka grecka", type: "CROSS_SELL", priority: 800 },
    { suggested: "Deska serów", type: "CROSS_SELL", priority: 700 },
    { suggested: "Risotto grzybowe", type: "CROSS_SELL", priority: 600 },
  ],
  "Blue Dream": [
    { suggested: "Sałatka Cezar", type: "CROSS_SELL", priority: 800 },
    { suggested: "Bruschetta", type: "CROSS_SELL", priority: 700 },
    { suggested: "Deser lodowy", type: "CROSS_SELL", priority: 600 },
  ],
  "Iced Coffee": [
    { suggested: "Brownie z lodami", type: "CROSS_SELL", priority: 800 },
    { suggested: "Tiramisu", type: "CROSS_SELL", priority: 700 },
  ],
  Pinacolada: [
    { suggested: "Deser lodowy", type: "CROSS_SELL", priority: 800 },
    { suggested: "Sałatka z halloumi", type: "CROSS_SELL", priority: 700 },
  ],
  Żubrówka: [
    { suggested: "Śledzik w oleju", type: "CROSS_SELL", priority: 800 },
    { suggested: "Śledzik w śmietanie", type: "CROSS_SELL", priority: 700 },
  ],
  "Coca Cola": [
    { suggested: "Żeberka BBQ", type: "CROSS_SELL", priority: 800 },
    { suggested: "Fish & Chips", type: "CROSS_SELL", priority: 700 },
    { suggested: "Burger wegetariański", type: "CROSS_SELL", priority: 600 },
  ],
  "Coca Cola Zero": [
    { suggested: "Żeberka BBQ", type: "CROSS_SELL", priority: 800 },
    { suggested: "Fish & Chips", type: "CROSS_SELL", priority: 700 },
    { suggested: "Burger wegetariański", type: "CROSS_SELL", priority: 600 },
  ],
  "Sok 330ml": [
    { suggested: "Sałatka Cezar", type: "CROSS_SELL", priority: 800 },
    { suggested: "Tatar", type: "CROSS_SELL", priority: 700 },
    { suggested: "Filet z łososia", type: "CROSS_SELL", priority: 600 },
  ],
  "Karafka Wody": [
    { suggested: "Stek z antrykotu", type: "CROSS_SELL", priority: 800 },
    { suggested: "Polędwica wołowa", type: "CROSS_SELL", priority: 700 },
    { suggested: "Filet z łososia", type: "CROSS_SELL", priority: 600 },
  ],
  Kompotu: [
    { suggested: "Pierogi z jagodami", type: "CROSS_SELL", priority: 800 },
    { suggested: "Karp", type: "CROSS_SELL", priority: 700 },
    { suggested: "Kotlet schabowy", type: "CROSS_SELL", priority: 600 },
  ],

  // ========== UPSELL POJEMNOŚCI ==========
  "Żywiec z Nalewaka 0.3L": [
    { suggested: "Żywiec z Nalewaka 0.5L", type: "UPSELL", priority: 1000 },
  ],
  "Johnnie Walker Red Label": [
    { suggested: "Johnnie Walker Black Label", type: "UPSELL", priority: 1000 },
  ],
  "Kawa z Ekspresu": [
    { suggested: "Latte z Syropem", type: "UPSELL", priority: 900 },
    { suggested: "Cappuccino", type: "UPSELL", priority: 800 },
  ],
  "Herbata Eilles": [
    { suggested: "Herbata Zimowa", type: "UPSELL", priority: 800 },
  ],
  "Heineken 0%": [
    { suggested: "Hugo Spritz", type: "UPSELL", priority: 800 },
  ],

  // ========== ROZGRZEWAJĄCE → DESERY ==========
  "Herbata Zimowa": [
    { suggested: "Racuchy z jabłkami", type: "CROSS_SELL", priority: 900 },
    { suggested: "Szarlotka z lodami", type: "CROSS_SELL", priority: 800 },
  ],
  "Grzaniec Czerwony": [
    { suggested: "Szarlotka z lodami", type: "CROSS_SELL", priority: 800 },
  ],
  "Grzaniec Biały": [
    { suggested: "Sernik", type: "CROSS_SELL", priority: 800 },
  ],
};

/**
 * Znajduje produkt po fragmencie nazwy (contains, case-insensitive).
 * Dłuższe dopasowanie ma priorytet (np. "Śledzik w oleju" przed "Śledzik").
 */
export function findProductByName(
  products: Array<{ id: string; name: string }>,
  search: string
): string | null {
  const q = search.toLowerCase().trim();
  const matches = products.filter((p) => p.name.toLowerCase().includes(q));
  if (matches.length === 0) return null;
  // prefer exact match, then shortest (most specific)
  const exact = matches.find((p) => p.name.toLowerCase() === q);
  if (exact) return exact.id;
  matches.sort((a, b) => a.name.length - b.name.length);
  return matches[0].id;
}
