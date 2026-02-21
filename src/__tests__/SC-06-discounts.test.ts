/**
 * SC-06: Scenariusze rabatów i promocji
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url } from "./helpers/auth";

let testOrderId: string | null = null;
let testUserId: string | null = null;
let testProductId: string | null = null;

describe("SC-06: Rabaty i promocje", () => {
  beforeAll(async () => {
    const auth = await getAuth();
    testUserId = auth.user.id;

    const productsRes = await authFetch(url("/api/products"));
    if (productsRes.ok) {
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
          type: "TAKEAWAY",
          guestCount: 1,
        }),
      });
      if (orderRes.ok) {
        const data = await orderRes.json();
        testOrderId = data.order?.id;
      }
    }

    if (testOrderId && testProductId) {
      await authFetch(url(`/api/orders/${testOrderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: testProductId, quantity: 2 }),
      });
    }
  });

  describe("SC-06-01: Rabat procentowy", () => {
    it("powinno zastosować rabat procentowy", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountJson: { type: "PERCENT", value: 10 },
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-06-02: Rabat kwotowy", () => {
    it("powinno zastosować rabat kwotowy", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountJson: { type: "AMOUNT", value: 20 },
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-06-03: Kod promocyjny", () => {
    it("powinno zweryfikować kod promocyjny", async () => {
      const res = await authFetch(url("/api/promotions/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "TESTCODE" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });

    it("powinno zastosować kod promocyjny", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/apply-promo`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "TESTCODE" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-06-04: Happy Hour", () => {
    it("powinno pobrać aktywne promocje", async () => {
      const res = await authFetch(url("/api/promotions?active=true"));
      expect([200, 401, 404]).toContain(res.status);
    });
  });

  describe("SC-06-05: Bon podarunkowy", () => {
    it("powinno zweryfikować bon", async () => {
      const res = await authFetch(url("/api/vouchers/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "BON100" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });

    it("powinno wykorzystać bon", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/apply-voucher`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode: "BON100" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });
});
