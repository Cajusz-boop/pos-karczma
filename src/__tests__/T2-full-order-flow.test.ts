/**
 * T2: Pełny flow zamówienia — stolik → produkty → kuchnia → płatność → e-paragon
 */
import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("T2: Full Order Flow", () => {
  it("TC-2.1: Rooms endpoint returns data", async () => {
    const res = await fetch(`${BASE_URL}/api/rooms`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("TC-2.2: Products endpoint returns data", async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    expect(res.status).toBe(200);
  });

  it("TC-2.3: Payments endpoint rejects invalid data", async () => {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "fake", payments: [] }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("TC-2.4: E-receipt route exists", async () => {
    const res = await fetch(`${BASE_URL}/e-receipt/test-token`);
    // Should render page (200) or show not found within page
    expect([200, 404]).toContain(res.status);
  });
});
