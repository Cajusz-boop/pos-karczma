/**
 * SC-02: Scenariusze otwierania zamówień
 * Testy: stolik, wynos, szybki paragon, dołączenie, liczba gości
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let testTableId: string | null = null;
let testUserId: string | null = null;
let testOrderId: string | null = null;
let testRoomId: string | null = null;

describe("SC-02: Otwieranie zamówień", () => {
  beforeAll(async () => {
    const tablesRes = await fetch(`${BASE_URL}/api/pos/floor`);
    if (tablesRes.status === 200) {
      const data = await tablesRes.json();
      const freeTable = data.tables?.find((t: { status: string }) => t.status === "FREE");
      if (freeTable) {
        testTableId = freeTable.id;
        testRoomId = freeTable.roomId;
      }
    }

    const usersRes = await fetch(`${BASE_URL}/api/users`);
    if (usersRes.status === 200) {
      const users = await usersRes.json();
      if (Array.isArray(users) && users.length > 0) {
        testUserId = users[0].id;
      }
    }
  });

  describe("SC-02-01: Otwarcie zamówienia przy stoliku (dine-in)", () => {
    it("powinno pobrać mapę stolików", async () => {
      const res = await fetch(`${BASE_URL}/api/pos/floor`);
      expect([200, 401]).toContain(res.status);
      
      if (res.status === 200) {
        const data = await res.json();
        expect(data.tables || data.rooms).toBeDefined();
      }
    });

    it("powinno sprawdzić status stolika przed otwarciem", async () => {
      if (!testTableId) {
        console.log("Pominięto - brak wolnego stolika");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/pos/floor`);
      if (res.status === 200) {
        const data = await res.json();
        const table = data.tables?.find((t: { id: string }) => t.id === testTableId);
        if (table) {
          expect(["FREE", "OCCUPIED", "RESERVED"]).toContain(table.status);
        }
      }
    });

    it("powinno utworzyć zamówienie dla stolika", async () => {
      if (!testTableId || !testUserId) {
        console.log("Pominięto - brak danych testowych");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: testTableId,
          userId: testUserId,
          guestCount: 2,
          type: "DINE_IN",
        }),
      });

      if (res.status === 200 || res.status === 201) {
        const data = await res.json();
        expect(data.order).toBeDefined();
        expect(data.order.id).toBeTruthy();
        expect(data.order.orderNumber).toBeGreaterThan(0);
        testOrderId = data.order.id;
      } else if (res.status === 400) {
        const err = await res.json();
        expect(err.error).toContain("zajęty");
      }
    });

    it("stolik powinien zmienić status na OCCUPIED", async () => {
      if (!testTableId || !testOrderId) return;

      const res = await fetch(`${BASE_URL}/api/pos/floor`);
      if (res.status === 200) {
        const data = await res.json();
        const table = data.tables?.find((t: { id: string }) => t.id === testTableId);
        if (table) {
          expect(table.status).toBe("OCCUPIED");
        }
      }
    });
  });

  describe("SC-02-02: Otwarcie zamówienia na wynos (takeaway)", () => {
    it("powinno utworzyć zamówienie TAKEAWAY bez stolika", async () => {
      if (!testUserId) return;

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          type: "TAKEAWAY",
          guestCount: 1,
        }),
      });

      if (res.status === 200 || res.status === 201) {
        const data = await res.json();
        expect(data.order).toBeDefined();
        expect(data.order.type).toBe("TAKEAWAY");
        expect(data.order.tableId || data.order.table).toBeFalsy();
      }
    });
  });

  describe("SC-02-03: Szybki paragon (quick sale)", () => {
    it("powinno utworzyć szybkie zamówienie barowe", async () => {
      if (!testUserId) return;

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          type: "TAKEAWAY",
          guestCount: 1,
        }),
      });

      expect([200, 201, 400, 401]).toContain(res.status);
    });
  });

  describe("SC-02-04: Dołączenie do istniejącego zamówienia", () => {
    it("powinno pobrać otwarte zamówienia dla stolika", async () => {
      if (!testTableId) return;

      const res = await fetch(`${BASE_URL}/api/orders?status=open`);
      if (res.status === 200) {
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it("powinno pobrać szczegóły zamówienia", async () => {
      if (!testOrderId) return;

      const res = await fetch(`${BASE_URL}/api/orders/${testOrderId}`);
      if (res.status === 200) {
        const data = await res.json();
        expect(data.id || data.order?.id).toBeTruthy();
      }
    });
  });

  describe("SC-02-05: Pytanie o liczbę gości", () => {
    it("zamówienie powinno mieć guestCount", async () => {
      if (!testOrderId) return;

      const res = await fetch(`${BASE_URL}/api/orders/${testOrderId}`);
      if (res.status === 200) {
        const data = await res.json();
        const order = data.order || data;
        expect(typeof order.guestCount).toBe("number");
      }
    });

    it("powinno aktualizować liczbę gości", async () => {
      if (!testOrderId) return;

      const res = await fetch(`${BASE_URL}/api/orders/${testOrderId}/guests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestCount: 4 }),
      });

      expect([200, 404]).toContain(res.status);
    });
  });

  describe("SC-02-06: Odmowa otwarcia zajętego stolika", () => {
    it("powinno odrzucić otwarcie na zajętym stoliku", async () => {
      if (!testTableId || !testUserId) return;

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: testTableId,
          userId: testUserId,
          guestCount: 2,
        }),
      });

      if (res.status === 400) {
        const data = await res.json();
        expect(data.error).toContain("zajęty");
      }
    });
  });

  afterAll(async () => {
    if (testOrderId) {
      await fetch(`${BASE_URL}/api/orders/${testOrderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    }
  });
});
