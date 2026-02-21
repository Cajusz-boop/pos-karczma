import Link from "next/link";

export default function EReceiptNotFound() {
  return (
    <div className="min-h-dvh bg-stone-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-stone-200 p-4">
            <svg
              className="h-12 w-12 text-stone-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-stone-800 mb-2">
          Paragon nie znaleziony
        </h1>
        <p className="text-stone-600 text-sm mb-6">
          Link do paragonu jest nieprawidłowy lub wygasł. Skontaktuj się z obsługą
          lokalu, jeśli potrzebujesz kopii paragonu.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
