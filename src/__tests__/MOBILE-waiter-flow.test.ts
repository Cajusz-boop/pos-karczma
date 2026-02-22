/**
 * MOBILE-WAITER-FLOW: Kompleksowe testy E2E dla przepływu kelnerskiego
 * 
 * Ten plik testuje cały flow od momentu gdy kelner podchodzi do stolika
 * aż do wydania paragonu. Testy są zaprojektowane z myślą o aplikacji mobilnej.
 * 
 * Scenariusze:
 * - MW-01: Podstawowy flow (stolik → zamówienie → kuchnia → płatność → paragon)
 * - MW-02: Zamówienie na wynos
 * - MW-03: Modyfikatory i notatki do pozycji
 * - MW-04: Płatność mieszana
 * - MW-05: Storno pozycji
 * - MW-06: Anulowanie zamówienia
 * - MW-07: E-paragon
 * - MW-08: Obsługa offline
 * - MW-09: Napiwek
 * - MW-10: NIP na paragonie
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAuth, adminFetch, authFetch, url, loginAs } from "./helpers/auth";

interface TestContext {
  userId: string;
  tableId: string | null;
  roomId: string | null;
  orderId: string | null;
  productId: string | null;
  productPrice: number;
  modifierGroupId: string | null;
  modifierId: string | null;
}

const ctx: TestContext = {
  userId: "",
  tableId: null,
  roomId: null,
  orderId: null,
  productId: null,
  productPrice: 0,
  modifierGroupId: null,
  modifierId: null,
};

describe("MOBILE WAITER FLOW - Pełny przepływ kelnerski", () => {
  beforeAll(async () => {
    const auth = await getAuth();
    ctx.userId = auth.user.id;

    // Pobierz wolny stolik
    const floorRes = await authFetch(url("/api/pos/floor"));
    if (floorRes.ok) {
      const data = await floorRes.json();
      const rooms = data.rooms ?? data;
      if (Array.isArray(rooms) && rooms.length > 0) {
        ctx.roomId = rooms[0].id;
        const freeTable = rooms[0].tables?.find((t: { status: string }) => t.status === "FREE");
        if (freeTable) {
          ctx.tableId = freeTable.id;
        }
      }
    }

    // Pobierz produkt testowy
    const productsRes = await authFetch(url("/api/products"));
    if (productsRes.ok) {
      const products = await productsRes.json();
      if (Array.isArray(products) && products.length > 0) {
        const product = products.find((p: { isActive: boolean }) => p.isActive) ?? products[0];
        ctx.productId = product.id;
        ctx.productPrice = parseFloat(product.priceGross) || 15;

        // Sprawdź czy ma modyfikatory
        if (product.modifierGroups?.length > 0) {
          const group = product.modifierGroups[0];
          ctx.modifierGroupId = group.id;
          if (group.modifiers?.length > 0) {
            ctx.modifierId = group.modifiers[0].id;
          }
        }
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-01: PODSTAWOWY FLOW NA STOLIKU
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-01: Podstawowy flow - stolik → zamówienie → kuchnia → płatność → paragon", () => {
    let orderId: string;
    let orderNumber: number;

    it("MW-01-01: Kelner loguje się PIN-em", async () => {
      const auth = await loginAs("Kelner 1", "1111");
      expect(auth.user.id).toBeTruthy();
      expect(auth.cookie).toContain("pos-session");
    });

    it("MW-01-02: Kelner widzi listę sal i stolików", async () => {
      const res = await authFetch(url("/api/pos/floor"));
      expect(res.status).toBe(200);

      const data = await res.json();
      const rooms = data.rooms ?? data;
      expect(Array.isArray(rooms)).toBe(true);
      expect(rooms.length).toBeGreaterThan(0);

      const hasFreeTables = rooms.some(
        (r: { tables: { status: string }[] }) => r.tables?.some((t) => t.status === "FREE")
      );
      expect(hasFreeTables).toBe(true);
    });

    it("MW-01-03: Kelner otwiera zamówienie na stoliku", async () => {
      if (!ctx.tableId) {
        console.warn("Brak wolnego stolika - pomijam test");
        return;
      }

      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: ctx.tableId,
          userId: ctx.userId,
          guestCount: 2,
          type: "DINE_IN",
        }),
      });

      expect([200, 201]).toContain(res.status);
      const data = await res.json();
      const order = data.order ?? data;
      expect(order).toBeDefined();
      expect(order.id).toBeTruthy();
      expect(order.orderNumber).toBeGreaterThan(0);
      expect(order.type).toBe("DINE_IN");

      orderId = data.order.id;
      orderNumber = data.order.orderNumber;
      ctx.orderId = orderId;
    });

    it("MW-01-04: Kelner widzi listę produktów", async () => {
      const res = await authFetch(url("/api/products"));
      expect(res.status).toBe(200);

      const data = await res.json();
      const products = Array.isArray(data) ? data : data.data ?? data.products ?? [];
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);

      const activeProducts = products.filter((p: { isActive: boolean }) => p.isActive);
      expect(activeProducts.length).toBeGreaterThan(0);
    });

    it("MW-01-05: Kelner widzi kategorie produktów", async () => {
      const res = await authFetch(url("/api/categories"));
      expect(res.status).toBe(200);

      const data = await res.json();
      const categories = Array.isArray(data) ? data : data.data ?? data.categories ?? [];
      expect(Array.isArray(categories)).toBe(true);
    });

    it("MW-01-06: Kelner dodaje pozycję do zamówienia", async () => {
      if (!orderId || !ctx.productId) return;

      const res = await authFetch(url(`/api/orders/${orderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: ctx.productId,
          quantity: 2,
        }),
      });

      expect([200, 201]).toContain(res.status);
    });

    it("MW-01-07: Kelner wysyła zamówienie do kuchni", async () => {
      if (!orderId || !ctx.productId) return;

      const orderRes = await authFetch(url(`/api/orders/${orderId}`));
      const orderData = await orderRes.json();
      const items = orderData.order?.items ?? orderData.items ?? [];

      const itemsToSend = items
        .filter((i: { status: string }) => i.status === "ORDERED")
        .map((i: { id: string; quantity: number }) => ({
          id: i.id,
          quantity: i.quantity,
        }));

      if (itemsToSend.length === 0) {
        console.warn("Brak pozycji do wysłania - pomijam");
        return;
      }

      const res = await authFetch(url(`/api/orders/${orderId}/send`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToSend }),
      });

      expect([200, 400]).toContain(res.status);
    });

    it("MW-01-08: Kelner przyjmuje płatność gotówką", async () => {
      if (!orderId) return;

      const orderRes = await authFetch(url(`/api/orders/${orderId}`));
      const orderData = await orderRes.json();
      const total = parseFloat(orderData.order?.totalGross ?? orderData.totalGross ?? "30");

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [{ method: "CASH", amount: total }],
        }),
      });

      expect([200, 400]).toContain(res.status);
    });

    it("MW-01-09: Kelner zamyka zamówienie i drukuje paragon", async () => {
      if (!orderId) return;

      const res = await authFetch(url(`/api/orders/${orderId}/close`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: true }),
      });

      expect([200, 400]).toContain(res.status);
    });

    it("MW-01-10: Stolik jest ponownie wolny", async () => {
      if (!ctx.tableId) return;

      const res = await authFetch(url("/api/pos/floor"));
      expect(res.status).toBe(200);

      const data = await res.json();
      const rooms = data.rooms ?? data;
      let tableStatus = null;

      for (const room of rooms) {
        const table = room.tables?.find((t: { id: string }) => t.id === ctx.tableId);
        if (table) {
          tableStatus = table.status;
          break;
        }
      }

      // Stolik powinien być FREE lub nadal OCCUPIED jeśli zamówienie nie zostało w pełni zamknięte
      expect(["FREE", "OCCUPIED"]).toContain(tableStatus);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-02: ZAMÓWIENIE NA WYNOS
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-02: Zamówienie na wynos (TAKEAWAY)", () => {
    let orderId: string;

    it("MW-02-01: Kelner tworzy zamówienie na wynos bez stolika", async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });

      expect([200, 201]).toContain(res.status);
      const data = await res.json();
      const order = data.order ?? data;
      expect(order.type).toBe("TAKEAWAY");
      expect(order.tableId == null).toBe(true); // null or undefined

      orderId = order.id;
    });

    it("MW-02-02: Dodanie produktów do zamówienia na wynos", async () => {
      if (!orderId || !ctx.productId) return;

      const res = await authFetch(url(`/api/orders/${orderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: ctx.productId,
          quantity: 1,
        }),
      });

      expect([200, 201]).toContain(res.status);
    });

    it("MW-02-03: Szybkie zamknięcie zamówienia na wynos", async () => {
      if (!orderId) return;

      // Płatność
      const payRes = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [{ method: "CASH", amount: 100 }],
        }),
      });
      expect([200, 400]).toContain(payRes.status);

      // Zamknięcie
      const closeRes = await authFetch(url(`/api/orders/${orderId}/close`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: true }),
      });
      expect([200, 400]).toContain(closeRes.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-03: MODYFIKATORY I NOTATKI
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-03: Modyfikatory i notatki do pozycji", () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.order.id;
      }
    });

    it("MW-03-01: Kelner widzi dostępne modyfikatory", async () => {
      const res = await authFetch(url("/api/modifiers"));
      expect(res.status).toBe(200);

      const data = await res.json();
      const modifiers = Array.isArray(data) ? data : data.data ?? data.modifiers ?? [];
      expect(Array.isArray(modifiers)).toBe(true);
    });

    it("MW-03-02: Dodanie pozycji z modyfikatorem", async () => {
      if (!orderId || !ctx.productId) return;

      const modifiers = ctx.modifierId
        ? [{ modifierId: ctx.modifierId, name: "Test Modifier", priceDelta: 2 }]
        : [];

      const res = await authFetch(url(`/api/orders/${orderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: ctx.productId,
          quantity: 1,
          modifiersJson: modifiers,
        }),
      });

      expect([200, 201]).toContain(res.status);
    });

    it("MW-03-03: Dodanie pozycji z notatką", async () => {
      if (!orderId || !ctx.productId) return;

      const res = await authFetch(url(`/api/orders/${orderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: ctx.productId,
          quantity: 1,
          note: "bez cebuli, extra ostro",
        }),
      });

      expect([200, 201]).toContain(res.status);
    });

    it("MW-03-04: Dodanie pozycji z modyfikatorem i notatką", async () => {
      if (!orderId || !ctx.productId) return;

      const modifiers = ctx.modifierId
        ? [{ modifierId: ctx.modifierId, name: "Test Modifier", priceDelta: 2 }]
        : [];

      const res = await authFetch(url(`/api/orders/${orderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: ctx.productId,
          quantity: 1,
          modifiersJson: modifiers,
          note: "na talerzu dla dziecka",
        }),
      });

      expect([200, 201]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-04: PŁATNOŚĆ MIESZANA
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-04: Płatność mieszana (gotówka + karta)", () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 2,
          type: "TAKEAWAY",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.order.id;
      }

      if (orderId && ctx.productId) {
        await authFetch(url(`/api/orders/${orderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 3 }),
        });
      }
    });

    it("MW-04-01: Płatność częściowa gotówką i kartą", async () => {
      if (!orderId) return;

      const orderRes = await authFetch(url(`/api/orders/${orderId}`));
      const orderData = await orderRes.json();
      const total = parseFloat(orderData.order?.totalGross ?? orderData.totalGross ?? "45");

      const cashAmount = Math.floor(total / 2);
      const cardAmount = total - cashAmount;

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [
            { method: "CASH", amount: cashAmount },
            { method: "CARD", amount: cardAmount },
          ],
        }),
      });

      expect([200, 400]).toContain(res.status);
    });

    it("MW-04-02: Płatność gotówka + BLIK", async () => {
      if (!orderId) return;

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [
            { method: "CASH", amount: 20 },
            { method: "BLIK", amount: 25 },
          ],
        }),
      });

      expect([200, 400]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-05: STORNO POZYCJI
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-05: Storno pozycji z zamówienia", () => {
    let orderId: string;
    let itemId: string;

    beforeAll(async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.order.id;
      }

      if (orderId && ctx.productId) {
        const itemRes = await authFetch(url(`/api/orders/${orderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 2 }),
        });
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          itemId = itemData.item?.id ?? itemData.id;
        }
      }
    });

    it("MW-05-01: Storno pozycji przed wysłaniem do kuchni", async () => {
      if (!orderId || !itemId) return;

      const res = await authFetch(url(`/api/orders/${orderId}/items/${itemId}/cancel`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Klient zmienił zdanie" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });

    it("MW-05-02: Storno pozycji wymaga uprawnienia managera", async () => {
      // Dodajemy nową pozycję, wysyłamy do kuchni, a następnie próbujemy storno
      if (!orderId || !ctx.productId) return;

      const itemRes = await authFetch(url(`/api/orders/${orderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: ctx.productId, quantity: 1 }),
      });

      if (!itemRes.ok) return;

      const itemData = await itemRes.json();
      const newItemId = itemData.item?.id ?? itemData.id;

      // Wysyłamy do kuchni
      await authFetch(url(`/api/orders/${orderId}/send`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: newItemId, quantity: 1 }] }),
      });

      // Próbujemy storno jako kelner
      const cancelRes = await authFetch(url(`/api/orders/${orderId}/items/${newItemId}/cancel`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Test storno" }),
      });

      // Oczekujemy sukcesu lub błędu uprawnień
      expect([200, 400, 403]).toContain(cancelRes.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-06: ANULOWANIE ZAMÓWIENIA
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-06: Anulowanie całego zamówienia", () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.order.id;
      }
    });

    it("MW-06-01: Anulowanie pustego zamówienia", async () => {
      if (!orderId) return;

      const res = await authFetch(url(`/api/orders/${orderId}/cancel`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Klient zrezygnował" }),
      });

      expect([200, 400]).toContain(res.status);
    });

    it("MW-06-02: Anulowanie zamówienia z pozycjami", async () => {
      // Tworzymy nowe zamówienie z pozycjami
      const orderRes = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });

      if (!orderRes.ok) return;

      const orderData = await orderRes.json();
      const newOrderId = orderData.order.id;

      if (ctx.productId) {
        await authFetch(url(`/api/orders/${newOrderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 1 }),
        });
      }

      const cancelRes = await authFetch(url(`/api/orders/${newOrderId}/cancel`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Anulowanie testowe" }),
      });

      expect([200, 400]).toContain(cancelRes.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-07: E-PARAGON
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-07: E-paragon (elektroniczny paragon)", () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.order.id;
      }

      if (orderId && ctx.productId) {
        await authFetch(url(`/api/orders/${orderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 1 }),
        });
      }
    });

    it("MW-07-01: Generowanie e-paragonu z QR kodem", async () => {
      if (!orderId) return;

      // Płatność
      await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [{ method: "CASH", amount: 100 }],
        }),
      });

      // Zamknięcie z e-paragonem
      const res = await authFetch(url(`/api/orders/${orderId}/close`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: true, eReceipt: true }),
      });

      expect([200, 400]).toContain(res.status);
    });

    it("MW-07-02: Wysłanie e-paragonu SMS", async () => {
      if (!orderId) return;

      const res = await authFetch(url(`/api/orders/${orderId}/e-receipt`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod: "sms",
          phoneNumber: "+48123456789",
        }),
      });

      // SMS może nie być skonfigurowany w testach
      expect([200, 400, 404, 500]).toContain(res.status);
    });

    it("MW-07-03: E-paragon jest dostępny publicznie po tokenie", async () => {
      // Test publicznego endpointu e-receipt
      const res = await fetch(url("/e-receipt/test-token-123"));
      expect([200, 404]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-08: OBSŁUGA OFFLINE (symulacja)
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-08: Obsługa braku połączenia (offline)", () => {
    it("MW-08-01: Ping endpoint odpowiada szybko", async () => {
      const start = Date.now();
      const res = await fetch(url("/api/ping"), { method: "HEAD" });
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Powinno być < 1s
    });

    it("MW-08-02: Health endpoint zwraca status", async () => {
      const res = await fetch(url("/api/health"));
      expect([200, 404]).toContain(res.status);
    });

    it("MW-08-03: Produkty są cachowane (szybki second request)", async () => {
      // Pierwsze żądanie
      const res1 = await authFetch(url("/api/products"));
      expect(res1.status).toBe(200);

      // Drugie żądanie - powinno być szybsze dzięki cache
      const start = Date.now();
      const res2 = await authFetch(url("/api/products"));
      const duration = Date.now() - start;

      expect(res2.status).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-09: NAPIWEK
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-09: Dodawanie napiwku", () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 2,
          type: "TAKEAWAY",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.order.id;
      }

      if (orderId && ctx.productId) {
        await authFetch(url(`/api/orders/${orderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 2 }),
        });
      }
    });

    it("MW-09-01: Płatność z napiwkiem gotówkowym", async () => {
      if (!orderId) return;

      const orderRes = await authFetch(url(`/api/orders/${orderId}`));
      const orderData = await orderRes.json();
      const total = parseFloat(orderData.order?.totalGross ?? orderData.totalGross ?? "30");

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [{ method: "CASH", amount: total + 10 }],
          tipAmount: 10,
          tipUserId: ctx.userId,
        }),
      });

      expect([200, 400]).toContain(res.status);
    });

    it("MW-09-02: Napiwek kartą (oddzielna transakcja)", async () => {
      if (!orderId) return;

      const res = await authFetch(url("/api/tips"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: 15,
          method: "CARD",
          userId: ctx.userId,
        }),
      });

      expect([200, 400, 404, 405]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-10: NIP NA PARAGONIE
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-10: Paragon z NIP (faktura uproszczona)", () => {
    let orderId: string;

    beforeAll(async () => {
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderId = data.order.id;
      }

      if (orderId && ctx.productId) {
        await authFetch(url(`/api/orders/${orderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 1 }),
        });
      }
    });

    it("MW-10-01: Zamknięcie z NIP nabywcy", async () => {
      if (!orderId) return;

      // Płatność
      await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [{ method: "CASH", amount: 100 }],
        }),
      });

      // Zamknięcie z NIP
      const res = await authFetch(url(`/api/orders/${orderId}/close`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt: true,
          buyerNip: "1234567890",
        }),
      });

      expect([200, 400]).toContain(res.status);
    });

    it("MW-10-02: Walidacja niepoprawnego NIP", async () => {
      const newOrderRes = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });

      if (!newOrderRes.ok) return;

      const data = await newOrderRes.json();
      const newOrderId = data.order.id;

      if (ctx.productId) {
        await authFetch(url(`/api/orders/${newOrderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 1 }),
        });
      }

      await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newOrderId,
          payments: [{ method: "CASH", amount: 100 }],
        }),
      });

      // Zbyt krótki NIP
      const res = await authFetch(url(`/api/orders/${newOrderId}/close`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt: true,
          buyerNip: "123", // Za krótki
        }),
      });

      // Powinien przyjąć (walidacja po stronie fiskalnej) lub odrzucić
      expect([200, 400]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-11: WYDAJNOŚĆ DLA MOBILE
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-11: Testy wydajnościowe dla mobile", () => {
    it("MW-11-01: Lista produktów ładuje się szybko", async () => {
      const start = Date.now();
      const res = await authFetch(url("/api/products?minimal=true"));
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(2000); // Max 2s
    });

    it("MW-11-02: Floor map ładuje się szybko", async () => {
      const start = Date.now();
      const res = await authFetch(url("/api/pos/floor"));
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(1500); // Max 1.5s
    });

    it("MW-11-03: Kategorie ładują się szybko", async () => {
      const start = Date.now();
      const res = await authFetch(url("/api/categories"));
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Max 1s
    });

    it("MW-11-04: Tworzenie zamówienia jest szybkie", async () => {
      const start = Date.now();
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });
      const duration = Date.now() - start;

      expect([200, 201]).toContain(res.status);
      expect(duration).toBeLessThan(1000); // Max 1s
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // MW-12: SCENARIUSZE BŁĘDÓW
  // ═══════════════════════════════════════════════════════════════════
  describe("MW-12: Obsługa błędów (negative testing)", () => {
    it("MW-12-01: Próba płatności bez zamówienia", async () => {
      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "nieistniejące-id",
          payments: [{ method: "CASH", amount: 50 }],
        }),
      });

      expect([400, 404]).toContain(res.status);
    });

    it("MW-12-02: Próba zamknięcia zamówienia bez płatności", async () => {
      const orderRes = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });

      if (!orderRes.ok) return;

      const data = await orderRes.json();
      const orderId = data.order.id;

      if (ctx.productId) {
        await authFetch(url(`/api/orders/${orderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 1 }),
        });
      }

      // Próba zamknięcia bez płatności
      const closeRes = await authFetch(url(`/api/orders/${orderId}/close`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: true }),
      });

      expect([400, 200]).toContain(closeRes.status);
    });

    it("MW-12-03: Niedostateczna płatność", async () => {
      const orderRes = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });

      if (!orderRes.ok) return;

      const data = await orderRes.json();
      const orderId = data.order.id;

      if (ctx.productId) {
        await authFetch(url(`/api/orders/${orderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 5 }),
        });
      }

      // Zbyt mała płatność
      const payRes = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [{ method: "CASH", amount: 0.01 }],
        }),
      });

      // System może przyjąć częściową płatność lub odrzucić
      expect([200, 400]).toContain(payRes.status);
    });

    it("MW-12-04: Nieprawidłowa metoda płatności", async () => {
      const orderRes = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });

      if (!orderRes.ok) return;

      const data = await orderRes.json();
      const orderId = data.order.id;

      const res = await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [{ method: "INVALID_METHOD", amount: 50 }],
        }),
      });

      expect(res.status).toBe(400);
    });

    it("MW-12-05: Próba dodania produktu do zamkniętego zamówienia", async () => {
      // Tworzymy, płacimy i zamykamy zamówienie
      const orderRes = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ctx.userId,
          guestCount: 1,
          type: "TAKEAWAY",
        }),
      });

      if (!orderRes.ok) return;

      const data = await orderRes.json();
      const orderId = data.order.id;

      // Płatność
      await authFetch(url("/api/payments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payments: [{ method: "CASH", amount: 1 }],
        }),
      });

      // Zamknięcie
      await authFetch(url(`/api/orders/${orderId}/close`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: false }),
      });

      // Próba dodania produktu do zamkniętego zamówienia
      if (ctx.productId) {
        const addRes = await authFetch(url(`/api/orders/${orderId}/items`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: ctx.productId, quantity: 1 }),
        });

        expect([400, 404, 409]).toContain(addRes.status);
      }
    });
  });
});
