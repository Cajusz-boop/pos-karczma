/**
 * T1: Logowanie PIN, otwarcie zmiany, wylogowanie
 */
import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("T1: Auth & Login", () => {
  it("TC-1.1: Login with correct PIN returns user", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "1234" }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeTruthy();
    expect(data.user.name).toBeTruthy();
  });

  it("TC-1.2: Login with wrong PIN returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "9999" }),
    });
    expect(res.status).toBe(401);
  });

  it("TC-1.3: API without token returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/orders`);
    expect(res.status).toBe(401);
  });

  it("TC-1.4: Login with empty PIN returns 400/401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("TC-1.5: Token login endpoint exists", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/token-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: "nonexistent-token" }),
    });
    // Should return 401 (not found) not 404 (route missing)
    expect(res.status).not.toBe(404);
  });
});
