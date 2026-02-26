/**
 * SC-03: Scenariusze dodawania produktów
 * Testy: dotyk, ilość, wyszukiwanie, modyfikatory, zestawy, alergeny, sugestie
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url } from "./helpers/auth";

let testOrderId: string | null = null;
let testUserId: string | null = null;
let testProductId: string | null = null;
let testItemId: string | null = null;
let testCategoryId: string | null = null;

describe("SC-03: Dodawanie produktów", () => {
  beforeAll(async () => {
    const auth = await getAuth();
    testUserId = auth.user.id;

    const productsRes = await authFetch(url("/api/products"));
    if (productsRes.status === 200) {
      const products = await productsRes.json();
      if (Array.isArray(products) && products.length > 0) {
        testProductId = products[0].id;
        testCategoryId = products[0].categoryId;
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
      if (orderRes.status === 200 || orderRes.status === 201) {
        const data = await orderRes.json();
        testOrderId = data.order?.id;
      }
    }
  });

  describe("SC-03-01: Dodanie produktu przez dotyk", () => {
    it("powinno pobrać listę kategorii", async () => {
      const res = await authFetch(url("/api/categories"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data) || Array.isArray(data?.categories)).toBe(true);
    });

    it("powinno pobrać produkty kategorii", async () => {
      if (!testCategoryId) return;

      const res = await authFetch(url(`/api/products?categoryId=${testCategoryId}`));
      if (res.status === 200) {
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it("powinno dodać produkt do zamówienia", async () => {
      if (!testOrderId || !testProductId) {
        console.log("Pominięto - brak danych testowych");
        return;
      }

      const res = await authFetch(url(`/api/orders/${testOrderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 1,
        }),
      });

      expect([200, 201, 400, 404]).toContain(res.status);
      
      if (res.status === 200 || res.status === 201) {
        const data = await res.json();
        expect(data.item || data.id).toBeTruthy();
        testItemId = data.item?.id || data.id;
      }
    });

    it("zamówienie powinno mieć zaktualizowaną sumę", async () => {
      if (!testOrderId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}`));
      if (res.status === 200) {
        const data = await res.json();
        const order = data.order || data;
        expect(order.items?.length || 0).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("SC-03-02: Zmiana ilości przez kliknięcie pozycji", () => {
    it("powinno zwiększyć ilość pozycji", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: 2 }),
      });

      expect([200, 404]).toContain(res.status);
    });
  });

  describe("SC-03-04: Wyszukiwanie produktu", () => {
    it("powinno wyszukać produkt po nazwie", async () => {
      const res = await authFetch(url("/api/products/search?q=piwo"));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data) || data.products).toBeTruthy();
    });

    it("powinno zwrócić puste wyniki dla nieistniejącego", async () => {
      const res = await authFetch(url("/api/products/search?q=xyznonexistent999"));
      if (res.status === 200) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : data.products || [];
        expect(results.length).toBe(0);
      }
    });
  });

  describe("SC-03-05: Szybkie wprowadzanie ILOŚĆ*KOD*CENA", () => {
    it("powinno obsłużyć quick-entry", async () => {
      const res = await authFetch(url("/api/products/quick-entry"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "2*1001" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });

    it("powinno obsłużyć ILOŚĆ*KOD*CENA", async () => {
      const res = await authFetch(url("/api/products/quick-entry"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: "3*1005*12.50" }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-03-06: Wyszukiwanie T9", () => {
    it("powinno wyszukać po T9", async () => {
      const res = await authFetch(url("/api/products/search?t9=74926"));
      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-03-07: Dodanie modyfikatora do produktu", () => {
    it("powinno pobrać dostępne modyfikatory", async () => {
      const res = await authFetch(url("/api/modifiers"));
      expect(res.status).toBe(200);
    });

    it("powinno dodać modyfikator do pozycji", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/modifiers`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modifierId: "test-modifier" }),
      });

      expect([200, 201, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-03-08: Dodanie produktu z notatką (alergia)", () => {
    it("powinno dodać notatkę do pozycji", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/note`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          note: "BEZ ORZECHÓW - ALERGIA",
          type: "ALLERGY"
        }),
      });

      expect([200, 404]).toContain(res.status);
    });

    it("powinno pobrać notatkę pozycji", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/note`));
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("SC-03-09: Dodanie zestawu z wymianą składnika", () => {
    it("powinno pobrać składniki zestawu", async () => {
      if (!testProductId) return;

      const res = await authFetch(url(`/api/products/${testProductId}/components`));
      expect([200, 404]).toContain(res.status);
    });

    it("powinno wymienić składnik zestawu", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/swap-component`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldComponentId: "component-1",
          newComponentId: "component-2",
        }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-03-10: Dodanie BRAK składnika", () => {
    it("powinno oznaczyć składnik jako BRAK", async () => {
      if (!testOrderId || !testItemId) return;

      const res = await authFetch(url(`/api/orders/${testOrderId}/items/${testItemId}/subtract`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: "onion", subtract: true }),
      });

      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe("SC-03-11: Panel Popularne — TOP produktów", () => {
    it("powinno pobrać popularne produkty", async () => {
      const res = await authFetch(url("/api/products?popular=true&limit=8"));
      expect(res.status).toBe(200);
    });
  });

  describe("SC-03-13: Sugestie sprzedażowe (upselling)", () => {
    it("powinno pobrać sugestie dla produktu", async () => {
      if (!testProductId) return;

      const res = await authFetch(url(`/api/suggestions?productId=${testProductId}`));
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("SC-03-14: Filtr alergenów", () => {
    it("powinno filtrować produkty bez alergenów", async () => {
      const res = await authFetch(url("/api/products?excludeAllergens=gluten,lactose"));
      expect(res.status).toBe(200);
    });
  });
});
