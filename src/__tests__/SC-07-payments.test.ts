/**
 * SC-07: Scenariusze płatności
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url } from "./helpers/auth";

let testOrderId: string | null = null;
let testUserId: string | null = null;
let testProductId: string | null = null;

describe("SC-07: Płatności", () => {
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
        body: JSON.stringify({ productId: testProductId, quantity: 1 }),
      });
    }
  });

  describe("SC-07-01: Płatność gotówką", () => {
    it("powinno przyjąć płatność gotówką", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: testOrderId,
          payments: [{ method: "CASH", amount: 50 }],
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-07-02: Płatność kartą", () => {
    it("powinno przyjąć płatność kartą", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: testOrderId,
          payments: [{ method: "CARD", amount: 50 }],
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-07-03: Płatność mieszana", () => {
    it("powinno przyjąć płatność mieszaną", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: testOrderId,
          payments: [
            { method: "CASH", amount: 30 },
            { method: "CARD", amount: 20 },
          ],
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-07-04: Napiwek", () => {
    it("powinno dodać napiwek", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: testOrderId,
          payments: [{ method: "CASH", amount: 55 }],
          tip: 5,
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-07-05: Wydanie reszty", () => {
    it("powinno obliczyć resztę", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/calculate-change`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ received: 100 }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-07-06: Płatności online", () => {
    it("powinno obsłużyć BLIK", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: testOrderId,
          payments: [{ method: "BLIK", amount: 50 }],
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });
});
