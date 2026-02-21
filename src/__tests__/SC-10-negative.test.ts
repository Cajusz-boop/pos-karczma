/**
 * SC-10: Scenariusze negatywne i edge cases
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url, findUser } from "./helpers/auth";

let testUserId: string | null = null;

describe("SC-10: Scenariusze negatywne", () => {
  beforeAll(async () => {
    const auth = await getAuth();
    testUserId = auth.user.id;
  });

  describe("SC-10-01: Nieprawidłowe dane zamówienia", () => {
    it("powinno odrzucić puste zamówienie", async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("powinno odrzucić ujemną liczbę gości", async () => {
      if (!testUserId) return;

      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          type: "DINE_IN",
          guestCount: -1,
        }),
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("SC-10-02: Nieprawidłowe płatności", () => {
    it("powinno odrzucić ujemną kwotę", async () => {
      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "test-order",
          payments: [{ method: "CASH", amount: -50 }],
        }),
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("powinno odrzucić nieistniejące zamówienie", async () => {
      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "nonexistent-order-12345",
          payments: [{ method: "CASH", amount: 50 }],
        }),
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("SC-10-03: SQL Injection", () => {
    it("powinno odrzucić SQL injection w ID", async () => {
      const res = await authFetch(url("/api/orders/'; DROP TABLE orders; --"));
      expect([400, 404]).toContain(res.status);
    });
  });

  describe("SC-10-04: XSS", () => {
    it("powinno escapować HTML w danych", async () => {
      if (!testUserId) return;

      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          type: "TAKEAWAY",
          customerName: "<script>alert('xss')</script>",
          guestCount: 1,
        }),
      });

      if (res.status === 200 || res.status === 201) {
        const data = await res.json();
        const order = data.order || data;
        if (order?.customerName) {
          expect(order.customerName).not.toContain("<script>");
        }
      }
    });
  });

  describe("SC-10-05: Rate limiting", () => {
    it("powinno obsłużyć rate limit gracefully", async () => {
      const user = await findUser("Kelner 1");
      if (!user) return;

      // Make several requests quickly
      const responses = await Promise.all(
        Array(5).fill(null).map(() => 
          authFetch(url("/api/products"))
        )
      );

      // All should be either 200 or 429
      responses.forEach(res => {
        expect([200, 429]).toContain(res.status);
      });
    });
  });

  describe("SC-10-06: Timeout handling", () => {
    it("powinno obsłużyć wolne operacje", async () => {
      const start = Date.now();
      const res = await authFetch(url("/api/rooms"));
      const elapsed = Date.now() - start;

      expect(res.status).toBe(200);
      expect(elapsed).toBeLessThan(10000);
    });
  });

  describe("SC-10-07: Walidacja danych", () => {
    it("powinno odrzucić nieprawidłowy email", async () => {
      const res = await authFetch(url("/api/customers"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test",
          email: "invalid-email",
        }),
      });

      expect([400, 404]).toContain(res.status);
    });

    it("powinno odrzucić nieprawidłowy NIP", async () => {
      const res = await authFetch(url("/api/customers"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Firma",
          nip: "12345",
        }),
      });

      expect([400, 404]).toContain(res.status);
    });
  });
});
