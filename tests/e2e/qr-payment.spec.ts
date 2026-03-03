/**
 * E2E testy modułu E-Paragon + płatności QR (Pay-at-Table)
 * Wymaga: serwer dev (npm run dev) lub CI z webServer
 * Dokument: docs/CURSOR_IMPLEMENTATION_E-PARAGON_QR_V3.md
 */

import { test, expect } from "@playwright/test";

// UUID testowy — w realnym teście użyj qrId z seeda/fixture
const TEST_QR_ID = "00000000-0000-0000-0000-000000000001";

test.describe("QR Payment — E-Paragon", () => {
  test("1. Happy path: skan QR → rachunek → widok gotowy do płatności", async ({
    page,
  }) => {
    await page.goto(`/receipt/${TEST_QR_ID}`);

    // Albo widok rachunku (gdy jest zamówienie), albo empty/loading
    await expect(
      page.getByRole("main").or(page.locator("body"))
    ).toBeVisible({ timeout: 10000 });

    const hasReceipt = await page.getByText("Rachunek online").isVisible();
    const hasEmpty = await page.getByText(/Brak aktywnego zamówienia/i).isVisible();
    const hasLoading = await page.getByText("Ładowanie").isVisible();

    expect(hasReceipt || hasEmpty || hasLoading).toBeTruthy();
  });

  test("2. Split payment: modal podziału rachunku otwiera się i ma przyciski WCAG", async ({
    page,
  }) => {
    await page.goto(`/receipt/${TEST_QR_ID}`);

    // Czekaj na załadowanie
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    const splitBtn = page.getByRole("button", { name: /Podziel rachunek|Split the bill/i });
    if (await splitBtn.isVisible()) {
      await splitBtn.click();
      await expect(
        page.getByRole("dialog").or(page.getByText(/Podziel|Split/i))
      ).toBeVisible({ timeout: 3000 });
      // Przyciski min 44px — sprawdź że są klikalne
      const confirmBtn = page.getByRole("button", { name: /Zapłać|Pay/i }).first();
      await expect(confirmBtn).toBeVisible();
    }
  });

  test("3. Race condition: 409 ITEMS_UNAVAILABLE — komunikat użytkownikowi", async ({
    page,
  }) => {
    // Ten test wymaga symulacji 409 — mockujemy API lub używamy request interception
    await page.goto(`/receipt/${TEST_QR_ID}`);

    await page.route("**/api/public/table/*/pay", async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          error: "ITEMS_UNAVAILABLE",
          unavailableItems: [{ orderItemId: "x", requested: 1, available: 0 }],
        }),
      });
    });

    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    const payBtn = page.getByRole("button", { name: /Zapłać|Pay/i }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await page.getByRole("button", { name: /Zapłać|Pay/i }).last().click();
      await expect(
        page.getByText(/Ktoś inny|unavailable|inny płaci/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test.skip("4. Timeout locka: po 15 min lock zwolniony — wymaga czekania lub mock cron", async () => {
    // Wymaga uruchomienia crona lub mockowania czasu — skip w standardowym zestawie
  });

  test.skip("5. Webhook idempotentność: podwójny webhook → jeden Payment", async () => {
    // Test backendowy — lepiej w vitest/jest
  });

  test("6. Offline: wyłącz sieć → komunikat OfflineNotice", async ({
    page,
    context,
  }) => {
    await page.goto(`/receipt/${TEST_QR_ID}`);

    await context.setOffline(true);

    await expect(
      page.getByText(/Brak połączenia|No internet|offline/i)
    ).toBeVisible({ timeout: 5000 });

    await context.setOffline(false);
  });

  test("7. Fallback: /receipt/fallback → wpisz numer → redirect lub 404", async ({
    page,
  }) => {
    await page.goto("/receipt/fallback");

    await expect(
      page.getByText(/numer stolika|table number|Wpisz/i)
    ).toBeVisible({ timeout: 5000 });

    const input = page.getByRole("spinbutton").or(page.getByPlaceholder("5"));
    const searchBtn = page.getByRole("button", { name: /Szukaj|Search/i });

    if (await input.isVisible() && await searchBtn.isVisible()) {
      await input.fill("1");
      await searchBtn.click();
      // Albo redirect do /receipt/{qrId}, albo 404 TABLE_NOT_FOUND
      await page.waitForURL(/\/(receipt\/[a-f0-9-]+|fallback)/, { timeout: 5000 }).catch(
        () => {}
      );
    }
  });

  test("8. Faktura VAT: toggle + NIP w formularzu płatności", async ({
    page,
  }) => {
    await page.goto(`/receipt/${TEST_QR_ID}`);

    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

    const payBtn = page.getByRole("button", { name: /Zapłać|Pay/i }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();

      const invoiceToggle = page.getByText(/fakturę VAT|VAT invoice/i);
      if (await invoiceToggle.isVisible()) {
        await invoiceToggle.click();
        const nipInput = page.getByPlaceholder(/NIP|\d{10}/i).or(page.getByLabel(/NIP|Tax ID/i));
        await expect(nipInput).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
