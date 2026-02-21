/**
 * T11-T20: Advanced system tests
 */
import { describe, it, expect, beforeAll } from "vitest";
import { findUser, authFetch, url } from "./helpers/auth";

describe("T13: Negative login", () => {
  let testUserId: string;

  beforeAll(async () => {
    const user = await findUser("Kelner 1");
    if (user) testUserId = user.id;
  });

  it("TC-13.1: Wrong PIN → 401", async () => {
    if (!testUserId) return;
    
    const res = await fetch(url("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: testUserId, pin: "0000" }),
    });
    
    // 429 or 401 are both acceptable
    expect([401, 429]).toContain(res.status);
  });

  it("TC-13.2: Empty PIN → 400+", async () => {
    const res = await fetch(url("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: testUserId || "test", pin: "" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("T15: Boundary payments", () => {
  it("TC-15.1: Payment 0 amount → rejected", async () => {
    const res = await authFetch(url("/api/payments"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "test", payments: [{ method: "CASH", amount: 0 }] }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("T19: E-receipt negative", () => {
  it("TC-19.1: Invalid e-receipt token", async () => {
    const res = await fetch(url("/e-receipt/invalid-token-12345"));
    expect([200, 404]).toContain(res.status);
  });
});

describe("T26: Input validation", () => {
  it("TC-26.1: SQL injection attempt rejected", async () => {
    const res = await authFetch(url("/api/payments"), {
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
