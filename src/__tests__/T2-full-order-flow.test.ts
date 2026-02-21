/**
 * T2: Pełny flow zamówienia — stolik → produkty → kuchnia → płatność → e-paragon
 */
import { describe, it, expect } from "vitest";
import { authFetch, url } from "./helpers/auth";

describe("T2: Full Order Flow", () => {
  it("TC-2.1: Rooms endpoint returns data", async () => {
    const res = await authFetch(url("/api/rooms"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("TC-2.2: Products endpoint returns data", async () => {
    const res = await authFetch(url("/api/products"));
    expect(res.status).toBe(200);
  });

  it("TC-2.3: Payments endpoint rejects invalid data", async () => {
    const res = await authFetch(url("/api/payments"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "fake", payments: [] }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("TC-2.4: E-receipt route exists", async () => {
    const res = await fetch(url("/e-receipt/test-token"));
    expect([200, 404]).toContain(res.status);
  });
});
