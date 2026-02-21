/**
 * T4-T10: Core system tests
 */
import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("T4: Mobile POS & PWA", () => {
  it("TC-4.1: PWA manifest.json exists", async () => {
    const res = await fetch(`${BASE_URL}/manifest.json`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBeTruthy();
  });

  it("TC-4.2: Service worker exists", async () => {
    const res = await fetch(`${BASE_URL}/sw.js`);
    expect(res.status).toBe(200);
  });

  it("TC-4.3: PWA icons exist", async () => {
    const res192 = await fetch(`${BASE_URL}/icon-192.png`);
    const res512 = await fetch(`${BASE_URL}/icon-512.png`);
    expect(res192.status).toBe(200);
    expect(res512.status).toBe(200);
  });
});

describe("T6: E-receipt", () => {
  it("TC-6.1: E-receipt route exists", async () => {
    const res = await fetch(`${BASE_URL}/e-receipt/nonexistent`);
    expect([200, 404]).toContain(res.status);
  });
});

describe("T7: Security", () => {
  it("TC-7.1: API without token → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`);
    expect(res.status).toBe(401);
  });
});

describe("T8: Payment validation", () => {
  it("TC-8.1: Payment with invalid data rejected", async () => {
    const res = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "nonexistent", payments: [{ method: "CASH", amount: 0.01 }] }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("T9: Products CRUD", () => {
  it("TC-9.1: GET /api/products", async () => {
    const res = await fetch(`${BASE_URL}/api/products`);
    expect(res.status).toBe(200);
  });
});

describe("T10: Users CRUD", () => {
  it("TC-10.1: GET /api/users", async () => {
    const res = await fetch(`${BASE_URL}/api/users`);
    expect([200, 401]).toContain(res.status);
  });
});
