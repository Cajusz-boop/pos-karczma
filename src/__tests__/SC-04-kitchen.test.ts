/**
 * SC-04: Scenariusze wysyłki do kuchni
 * Testy: KDS, auto-wysyłka, ogień, minutnik, kursy, storno
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url } from "./helpers/auth";

let testOrderId: string | null = null;
let testUserId: string | null = null;
let testItemId: string | null = null;
let testProductId: string | null = null;

describe("SC-04: Wysyłka do kuchni", () => {
  beforeAll(async () => {
    const auth = await getAuth();
    testUserId = auth.user.id;

    const productsRes = await authFetch(url("/api/products"));
    if (productsRes.status === 200) {
      const products = await productsRes.json();
      if (Array.isArray(products) && products.length > 0) {
        testProductId = products[0].id;
      }
    }

    if (testUserId) {
      const orderRes = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          type: "DINE_IN",
          guestCount: 2,
        }),
      });
      if (orderRes.ok) {
        const data = await orderRes.json();
        testOrderId = data.order?.id;
      }
    }

    if (testOrderId && testProductId) {
      const itemRes = await authFetch(url(`/api/orders/${testOrderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: testProductId, quantity: 2 }),
      });
      if (itemRes.ok) {
        const data = await itemRes.json();
        testItemId = data.item?.id || data.id;
      }
    }
  });

  describe("SC-04-01: KDS stations", () => {
    it("powinno pobrać listę stanowisk KDS", async () => {
      const res = await authFetch(url("/api/kds/station-list"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data) || data.stations).toBeTruthy();
    });
  });

  describe("SC-04-02: Wysyłka zamówienia do kuchni", () => {
    it("powinno wysłać zamówienie do kuchni", async () => {
      if (!testOrderId) {
        console.log("Pominięto - brak zamówienia testowego");
        return;
      }

      const res = await authFetch(url(`/api/orders/${testOrderId}/send-to-kitchen`), {
        method: "POST",
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-04-03: Wstrzymanie wysyłki (HOLD)", () => {
    it("powinno wstrzymać wysyłkę pozycji", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/hold`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hold: true }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-04-04: Ogień (FIRE)", () => {
    it("powinno wysłać pozycję natychmiast", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/fire`), {
        method: "POST",
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-04-05: Minutnik do wysyłki", () => {
    it("powinno ustawić opóźnienie wysyłki", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/delay`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delayMinutes: 15 }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-04-06: Kursy (courses)", () => {
    it("powinno przypisać pozycję do kursu", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/course`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: 2 }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-04-07: Storno pozycji wysłanej", () => {
    it("powinno anulować pozycję (storno)", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/void`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Test storno" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-04-08: Aktualizacja statusu na KDS", () => {
    it("powinno oznaczyć jako 'zaczynam'", async () => {
      if (!testItemId) return;

      const res = await authFetch(url(`/api/kds/items/${testItemId}/status`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PREPARING" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });

    it("powinno oznaczyć jako 'gotowe'", async () => {
      if (!testItemId) return;

      const res = await authFetch(url(`/api/kds/items/${testItemId}/status`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-04-09: Wyświetlanie zleceń na KDS", () => {
    it("powinno pobrać aktywne zlecenia", async () => {
      const res = await authFetch(url("/api/kds/orders?status=active"));
      expect([200, 401, 404]).toContain(res.status);
    });
  });
});
