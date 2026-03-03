export const translations = {
  pl: {
    title: "Rachunek online",
    empty:
      "Brak aktywnego zamówienia. Poproś kelnera o otwarcie rachunku.",
    payButton: "Zapłać",
    splitBill: "Podziel rachunek",
    tip: "Napiwek",
    tipCustom: "Inna kwota",
    paid: "Opłacone",
    locked: "W trakcie płatności",
    invoiceToggle: "Chcę fakturę VAT na firmę",
    nip: "NIP",
    success: "Płatność zakończona!",
    confirmationSaved:
      "Link do potwierdzenia został zapisany.",
    offline: "Brak połączenia z internetem. Sprawdź zasięg.",
    fallbackTitle: "Wpisz numer stolika",
    fallbackButton: "Szukaj",
    googleReview: "Jak oceniasz wizytę? Zostaw opinię!",
  },
  en: {
    title: "Online receipt",
    empty: "No active order. Ask your waiter to open a tab.",
    payButton: "Pay",
    splitBill: "Split the bill",
    tip: "Tip",
    tipCustom: "Custom amount",
    paid: "Paid",
    locked: "Payment in progress",
    invoiceToggle: "I want a VAT invoice",
    nip: "Tax ID",
    success: "Payment complete!",
    confirmationSaved: "Confirmation link has been saved.",
    offline: "No internet connection. Check your signal.",
    fallbackTitle: "Enter table number",
    fallbackButton: "Search",
    googleReview: "How was your visit? Leave a review!",
  },
} as const;

export type Locale = keyof typeof translations;
