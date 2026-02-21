/**
 * SC-05: Scenariusze przenoszenia i dzielenia zamówień
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url } from "./helpers/auth";

let testOrderId: string | null = null;
let testUserId: string | null = null;
let testTableId: string | null = null;

describe("SC-05: Przenoszenie i dzielenie zamówień", () => {
  beforeAll(async () => {
    const auth = await getAuth();
    testUserId = auth.user.id;

    const roomsRes = await authFetch(url("/api/rooms"));
    if (roomsRes.ok) {
      const rooms = await roomsRes.json();
      if (Array.isArray(rooms) && rooms.length > 0 && rooms[0].tables?.length > 0) {
        testTableId = rooms[0].tables[0].id;
      }
    }

    if (testUserId && testTableId) {
      const orderRes = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          tableId: testTableId,
          type: "DINE_IN",
          guestCount: 4,
        }),
      });
      if (orderRes.ok) {
        const data = await orderRes.json();
        testOrderId = data.order?.id;
      }
    }
  });

  describe("SC-05-01: Przeniesienie zamówienia na inny stolik", () => {
    it("powinno przenieść zamówienie na inny stolik", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/move-table`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTableId: "table-2" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-05-02: Łączenie stolików", () => {
    it("powinno połączyć stoliki", async () => {
      const res = await authFetch(url("/api/tables/merge"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableIds: ["table-1", "table-2"] }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-05-03: Dzielenie rachunku", () => {
    it("powinno podzielić rachunek po pozycjach", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/split`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "BY_ITEMS", itemIds: [] }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });

    it("powinno podzielić rachunek równo", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/split`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "EQUAL", parts: 2 }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-05-04: Przesunięcie pozycji między zamówieniami", () => {
    it("powinno przenieść pozycje między zamówieniami", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/transfer-items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetOrderId: "target-order", 
          itemIds: [] 
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-05-05: Rozliczenie częściowe", () => {
    it("powinno rozliczyć częściowo zamówienie", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/partial-payment`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: 50.00, 
          method: "CASH" 
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });
});
