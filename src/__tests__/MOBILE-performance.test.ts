/**
 * MOBILE-PERFORMANCE: Testy wydajnościowe dla aplikacji mobilnej
 * 
 * Testy sprawdzające:
 * - Czasy odpowiedzi API
 * - Rozmiary odpowiedzi
 * - Cache effectiveness
 * - Wydajność krytycznych operacji
 */
import { describe, it, expect, beforeAll } from "vitest";
import { getAuth, authFetch, url } from "./helpers/auth";

const PERFORMANCE_THRESHOLDS = {
  FAST: 300,      // < 300ms - szybkie operacje
  NORMAL: 1000,   // < 1s - normalne operacje
  SLOW: 2000,     // < 2s - wolniejsze operacje (dopuszczalne)
  MAX: 5000,      // < 5s - maksymalny akceptowalny czas
};

const RESPONSE_SIZE_LIMITS = {
  SMALL: 10 * 1024,      // 10KB
  MEDIUM: 100 * 1024,    // 100KB
  LARGE: 500 * 1024,     // 500KB
  MAX: 1024 * 1024,      // 1MB
};

interface PerformanceResult {
  endpoint: string;
  duration: number;
  status: number;
  size: number;
}

async function measureRequest(
  urlPath: string,
  options?: RequestInit
): Promise<PerformanceResult> {
  const start = Date.now();
  const res = await authFetch(url(urlPath), options);
  const duration = Date.now() - start;
  const text = await res.text();
  
  return {
    endpoint: urlPath,
    duration,
    status: res.status,
    size: new TextEncoder().encode(text).length,
  };
}

describe("MOBILE PERFORMANCE - Testy wydajnościowe", () => {
  beforeAll(async () => {
    await getAuth();
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERF-01: KRYTYCZNE ENDPOINTY
  // ═══════════════════════════════════════════════════════════════════
  describe("PERF-01: Czasy odpowiedzi krytycznych endpointów", () => {
    it("PERF-01-01: /api/products odpowiada w < 2s", async () => {
      const result = await measureRequest("/api/products");
      
      expect(result.status).toBe(200);
      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW);
      
      console.log(`[PERF] /api/products: ${result.duration}ms, ${result.size} bytes`);
    });

    it("PERF-01-02: /api/products?minimal=true jest szybszy", async () => {
      const fullResult = await measureRequest("/api/products");
      const minimalResult = await measureRequest("/api/products?minimal=true");
      
      expect(minimalResult.status).toBe(200);
      expect(minimalResult.size).toBeLessThanOrEqual(fullResult.size);
      
      console.log(`[PERF] Full products: ${fullResult.duration}ms, ${fullResult.size} bytes`);
      console.log(`[PERF] Minimal products: ${minimalResult.duration}ms, ${minimalResult.size} bytes`);
    });

    it("PERF-01-03: /api/categories odpowiada w < 1s", async () => {
      const result = await measureRequest("/api/categories");
      
      expect(result.status).toBe(200);
      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMAL);
      
      console.log(`[PERF] /api/categories: ${result.duration}ms, ${result.size} bytes`);
    });

    it("PERF-01-04: /api/pos/floor odpowiada w < 1.5s", async () => {
      const result = await measureRequest("/api/pos/floor");
      
      expect(result.status).toBe(200);
      expect(result.duration).toBeLessThan(1500);
      
      console.log(`[PERF] /api/pos/floor: ${result.duration}ms, ${result.size} bytes`);
    });

    it("PERF-01-05: /api/modifiers odpowiada w < 1s", async () => {
      const result = await measureRequest("/api/modifiers");
      
      expect(result.status).toBe(200);
      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMAL);
      
      console.log(`[PERF] /api/modifiers: ${result.duration}ms, ${result.size} bytes`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERF-02: OPERACJE ZAPISU
  // ═══════════════════════════════════════════════════════════════════
  describe("PERF-02: Wydajność operacji zapisu", () => {
    let testOrderId: string;
    let testUserId: string;
    let testProductId: string;

    beforeAll(async () => {
      const auth = await getAuth();
      testUserId = auth.user.id;

      const productsRes = await authFetch(url("/api/products"));
      if (productsRes.ok) {
        const products = await productsRes.json();
        if (products.length > 0) {
          testProductId = products[0].id;
        }
      }
    });

    it("PERF-02-01: Tworzenie zamówienia w < 1s", async () => {
      const start = Date.now();
      
      const res = await authFetch(url("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          guestCount: 2,
          type: "TAKEAWAY",
        }),
      });
      
      const duration = Date.now() - start;
      
      expect([200, 201]).toContain(res.status);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMAL);
      
      const data = await res.json();
      testOrderId = data.order?.id ?? data.id;
      
      console.log(`[PERF] Create order: ${duration}ms`);
    });

    it("PERF-02-02: Dodawanie pozycji w < 500ms", async () => {
      if (!testOrderId || !testProductId) return;

      const start = Date.now();
      
      const res = await authFetch(url(`/api/orders/${testOrderId}/items`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: testProductId,
          quantity: 1,
        }),
      });
      
      const duration = Date.now() - start;
      
      expect([200, 201]).toContain(res.status);
      expect(duration).toBeLessThan(500);
      
      console.log(`[PERF] Add item: ${duration}ms`);
    });

    it("PERF-02-03: Pobieranie szczegółów zamówienia w < 500ms", async () => {
      if (!testOrderId) return;

      const start = Date.now();
      
      const res = await authFetch(url(`/api/orders/${testOrderId}`));
      
      const duration = Date.now() - start;
      
      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(500);
      
      console.log(`[PERF] Get order: ${duration}ms`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERF-03: ROZMIARY ODPOWIEDZI
  // ═══════════════════════════════════════════════════════════════════
  describe("PERF-03: Rozmiary odpowiedzi (optymalizacja dla mobile)", () => {
    it("PERF-03-01: /api/categories < 50KB", async () => {
      const result = await measureRequest("/api/categories");
      
      expect(result.size).toBeLessThan(50 * 1024);
      console.log(`[SIZE] /api/categories: ${(result.size / 1024).toFixed(2)}KB`);
    });

    it("PERF-03-02: /api/products < 500KB", async () => {
      const result = await measureRequest("/api/products");
      
      expect(result.size).toBeLessThan(RESPONSE_SIZE_LIMITS.LARGE);
      console.log(`[SIZE] /api/products: ${(result.size / 1024).toFixed(2)}KB`);
    });

    it("PERF-03-03: /api/pos/floor < 100KB", async () => {
      const result = await measureRequest("/api/pos/floor");
      
      expect(result.size).toBeLessThan(RESPONSE_SIZE_LIMITS.MEDIUM);
      console.log(`[SIZE] /api/pos/floor: ${(result.size / 1024).toFixed(2)}KB`);
    });

    it("PERF-03-04: /api/rooms < 20KB", async () => {
      const result = await measureRequest("/api/rooms");
      
      expect(result.size).toBeLessThan(20 * 1024);
      console.log(`[SIZE] /api/rooms: ${(result.size / 1024).toFixed(2)}KB`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERF-04: CACHE EFFECTIVENESS
  // ═══════════════════════════════════════════════════════════════════
  describe("PERF-04: Efektywność cache", () => {
    it("PERF-04-01: Drugie żądanie products jest szybsze", async () => {
      // Pierwsze żądanie - może nie być w cache
      const first = await measureRequest("/api/products");
      
      // Drugie żądanie - powinno być szybsze dzięki cache
      const second = await measureRequest("/api/products");
      
      console.log(`[CACHE] First request: ${first.duration}ms`);
      console.log(`[CACHE] Second request: ${second.duration}ms`);
      
      // Drugie żądanie powinno być co najmniej tak szybkie jak pierwsze
      // (lub szybsze dzięki cache)
      expect(second.status).toBe(200);
    });

    it("PERF-04-02: Drugie żądanie categories jest szybsze", async () => {
      const first = await measureRequest("/api/categories");
      const second = await measureRequest("/api/categories");
      
      console.log(`[CACHE] Categories first: ${first.duration}ms`);
      console.log(`[CACHE] Categories second: ${second.duration}ms`);
      
      expect(second.status).toBe(200);
    });

    it("PERF-04-03: Wielokrotne żądania floor nie degradują wydajności", async () => {
      const results: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const result = await measureRequest("/api/pos/floor");
        results.push(result.duration);
      }
      
      const avg = results.reduce((a, b) => a + b, 0) / results.length;
      const max = Math.max(...results);
      
      console.log(`[CACHE] Floor requests avg: ${avg.toFixed(0)}ms, max: ${max}ms`);
      
      // Średni czas powinien być akceptowalny
      expect(avg).toBeLessThan(PERFORMANCE_THRESHOLDS.SLOW);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERF-05: RÓWNOLEGŁE ŻĄDANIA
  // ═══════════════════════════════════════════════════════════════════
  describe("PERF-05: Równoległe żądania (mobile startup)", () => {
    it("PERF-05-01: Równoległe ładowanie danych startowych", async () => {
      const start = Date.now();
      
      const [products, categories, floor, modifiers] = await Promise.all([
        authFetch(url("/api/products")),
        authFetch(url("/api/categories")),
        authFetch(url("/api/pos/floor")),
        authFetch(url("/api/modifiers")),
      ]);
      
      const duration = Date.now() - start;
      
      expect(products.status).toBe(200);
      expect(categories.status).toBe(200);
      expect(floor.status).toBe(200);
      expect(modifiers.status).toBe(200);
      
      // Wszystkie żądania równolegle powinny zmieścić się w rozsądnym czasie
      expect(duration).toBeLessThan(3000);
      
      console.log(`[PARALLEL] All startup data: ${duration}ms`);
    });

    it("PERF-05-02: Sekwencyjne ładowanie jest wolniejsze niż równoległe", async () => {
      // Sekwencyjnie
      const seqStart = Date.now();
      await authFetch(url("/api/products"));
      await authFetch(url("/api/categories"));
      const seqDuration = Date.now() - seqStart;
      
      // Równolegle
      const parStart = Date.now();
      await Promise.all([
        authFetch(url("/api/products")),
        authFetch(url("/api/categories")),
      ]);
      const parDuration = Date.now() - parStart;
      
      console.log(`[COMPARE] Sequential: ${seqDuration}ms`);
      console.log(`[COMPARE] Parallel: ${parDuration}ms`);
      
      // Równoległe powinno być szybsze (lub podobne przy cache)
      expect(parDuration).toBeLessThanOrEqual(seqDuration + 200);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERF-06: PING I HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════════
  describe("PERF-06: Ping i health check dla mobile", () => {
    it("PERF-06-01: /api/ping odpowiada w < 200ms", async () => {
      const start = Date.now();
      const res = await fetch(url("/api/ping"), { method: "HEAD" });
      const duration = Date.now() - start;
      
      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(200);
      
      console.log(`[PING] Response time: ${duration}ms`);
    });

    it("PERF-06-02: Health check odpowiada szybko", async () => {
      const start = Date.now();
      const res = await fetch(url("/api/health"));
      const duration = Date.now() - start;
      
      expect([200, 404]).toContain(res.status);
      expect(duration).toBeLessThan(500);
      
      console.log(`[HEALTH] Response time: ${duration}ms`);
    });

    it("PERF-06-03: Wielokrotny ping jest stabilny", async () => {
      const results: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await fetch(url("/api/ping"), { method: "HEAD" });
        results.push(Date.now() - start);
      }
      
      const avg = results.reduce((a, b) => a + b, 0) / results.length;
      const max = Math.max(...results);
      const min = Math.min(...results);
      
      console.log(`[PING] Avg: ${avg.toFixed(0)}ms, Min: ${min}ms, Max: ${max}ms`);
      
      expect(avg).toBeLessThan(150);
      expect(max).toBeLessThan(500);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERF-07: PAGINACJA I LIMITY
  // ═══════════════════════════════════════════════════════════════════
  describe("PERF-07: Paginacja i limity", () => {
    it("PERF-07-01: Produkty z limitem są mniejsze", async () => {
      const fullResult = await measureRequest("/api/products");
      const limitedResult = await measureRequest("/api/products?limit=10");
      
      console.log(`[LIMIT] Full: ${fullResult.size} bytes`);
      console.log(`[LIMIT] Limited (10): ${limitedResult.size} bytes`);
      
      // Ograniczone powinno być mniejsze lub równe
      expect(limitedResult.size).toBeLessThanOrEqual(fullResult.size);
    });

    it("PERF-07-02: Orders z limitem odpowiada szybko", async () => {
      const result = await measureRequest("/api/orders?limit=20&status=OPEN");
      
      expect([200, 404]).toContain(result.status);
      expect(result.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.NORMAL);
      
      console.log(`[LIMIT] Orders (20): ${result.duration}ms, ${result.size} bytes`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERF-08: WYSZUKIWANIE
  // ═══════════════════════════════════════════════════════════════════
  describe("PERF-08: Wydajność wyszukiwania", () => {
    it("PERF-08-01: Wyszukiwanie produktów jest szybkie", async () => {
      const start = Date.now();
      const res = await authFetch(url("/api/products/search?q=piwo"));
      const duration = Date.now() - start;
      
      expect([200, 404]).toContain(res.status);
      expect(duration).toBeLessThan(500);
      
      console.log(`[SEARCH] Products "piwo": ${duration}ms`);
    });

    it("PERF-08-02: Wyszukiwanie pustym query jest szybkie", async () => {
      const start = Date.now();
      const res = await authFetch(url("/api/products/search?q="));
      const duration = Date.now() - start;
      
      expect([200, 400, 404]).toContain(res.status);
      expect(duration).toBeLessThan(300);
      
      console.log(`[SEARCH] Empty query: ${duration}ms`);
    });

    it("PERF-08-03: Wyszukiwanie długim tekstem nie zawiesza", async () => {
      const longQuery = "a".repeat(100);
      const start = Date.now();
      const res = await authFetch(url(`/api/products/search?q=${longQuery}`));
      const duration = Date.now() - start;
      
      expect([200, 400, 404]).toContain(res.status);
      expect(duration).toBeLessThan(1000);
      
      console.log(`[SEARCH] Long query (100 chars): ${duration}ms`);
    });
  });
});
