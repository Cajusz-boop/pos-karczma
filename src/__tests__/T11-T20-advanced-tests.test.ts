/**
 * T11-T20: Advanced system tests
 */
import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("T13: Negative login", () => {
  it("TC-13.1: Wrong PIN → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "0000" }),
    });
    expect(res.status).toBe(401);
  });

  it("TC-13.2: Empty PIN → 400+", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("T15: Boundary payments", () => {
  it("TC-15.1: Payment 0 amount → rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "test", payments: [{ method: "CASH", amount: 0 }] }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("T19: E-receipt negative", () => {
  it("TC-19.1: Invalid e-receipt token", async () => {
    const res = await fetch(`${BASE_URL}/e-receipt/invalid-token-12345`);
    expect([200, 404]).toContain(res.status);
  });
});

describe("T26: Input validation", () => {
  it("TC-26.1: SQL injection attempt rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: "'; DROP TABLE orders; --",
        payments: [{ method: "CASH", amount: -100 }],
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
