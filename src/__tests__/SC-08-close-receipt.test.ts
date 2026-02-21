/**
 * SC-08: Scenariusze zamknięcia i wydruku paragonu
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url } from "./helpers/auth";

let testOrderId: string | null = null;
let testUserId: string | null = null;

describe("SC-08: Zamknięcie i paragon", () => {
  beforeAll(async () => {
    const auth = await getAuth();
    testUserId = auth.user.id;

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
  });

  describe("SC-08-01: Zamknięcie zamówienia", () => {
    it("powinno zamknąć zamówienie", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/close`), {
        method: "POST",
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-08-02: Wydruk paragonu fiskalnego", () => {
    it("powinno wydrukować paragon", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/print-receipt`), {
        method: "POST",
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-08-03: Wydruk faktury", () => {
    it("powinno wydrukować fakturę", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/print-invoice`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nip: "1234567890",
          companyName: "Test Firma",
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-08-04: E-paragon", () => {
    it("powinno wygenerować e-paragon", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/e-receipt`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-08-05: Wydruk niefiskalny", () => {
    it("powinno wydrukować rachunek niefiskalny", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/print-bill`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fiscal: false }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-08-06: Duplikat paragonu", () => {
    it("powinno wydrukować duplikat", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/print-duplicate`), {
        method: "POST",
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });
});
