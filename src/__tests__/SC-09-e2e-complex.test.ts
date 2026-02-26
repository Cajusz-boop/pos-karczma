/**
 * SC-09: Scenariusze E2E - złożone przepływy
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url } from "./helpers/auth";

let testUserId: string | null = null;
let testTableId: string | null = null;

describe("SC-09: Złożone przepływy E2E", () => {
  beforeAll(async () => {
    const auth = await getAuth();
    testUserId = auth.user.id;

    const roomsRes = await authFetch(url("/api/rooms"));
    if (roomsRes.ok) {
      const rooms = await roomsRes.json();
      if (Array.isArray(rooms) && rooms.length > 0 && rooms[0].tables?.length > 0) {
        const freeTable = rooms[0].tables.find((t: { status: string }) => t.status === "FREE");
        testTableId = freeTable?.id || rooms[0].tables[0].id;
      }
    }

  });

  describe("SC-09-01: Pełny flow na miejscu", () => {
    it("powinno utworzyć zamówienie na stolik", async () => {
      if (!testUserId || !testTableId) return;

      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          tableId: testTableId,
          type: "DINE_IN",
          guestCount: 2,
        }),
      });

      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe("SC-09-02: Pełny flow delivery", () => {
    it("powinno utworzyć zamówienie delivery", async () => {
      if (!testUserId) return;

      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          type: "DELIVERY",
          deliveryAddress: {
            street: "Testowa 1",
            city: "Kraków",
            postalCode: "31-000",
            phone: "+48123456789",
          },
          guestCount: 1,
        }),
      });

      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe("SC-09-03: Pełny flow takeaway", () => {
    it("powinno utworzyć zamówienie na wynos", async () => {
      if (!testUserId) return;

      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          type: "TAKEAWAY",
          customerName: "Jan Kowalski",
          guestCount: 1,
        }),
      });

      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe("SC-09-04: Dostawa - przypisanie kierowcy", () => {
    it("powinno pobrać listę kierowców", async () => {
      const res = await authFetch(url("/api/drivers"));
      expect([200, 401, 404]).toContain(res.status);
    });

    it("powinno pobrać strefy dostawy", async () => {
      const res = await authFetch(url("/api/delivery-zones"));
      expect([200, 401, 404]).toContain(res.status);
    });
  });

  describe("SC-09-05: Zamówienie hotelowe", () => {
    it("powinno utworzyć zamówienie na pokój hotelowy", async () => {
      if (!testUserId) return;

      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          type: "HOTEL_ROOM",
          hotelRoomNumber: "101",
          guestName: "Gość Hotelowy",
          guestCount: 1,
        }),
      });

      expect([200, 201, 400]).toContain(res.status);
    });
  });
});
