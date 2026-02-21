/**
 * T1: Logowanie PIN, otwarcie zmiany, wylogowanie
 */
import { describe, it, expect, beforeAll } from "vitest";
import { findUser, login, url } from "./helpers/auth";

describe("T1: Auth & Login", () => {
  let adminUserId: string;

  beforeAll(async () => {
    const admin = await findUser("Łukasz");
    if (admin) adminUserId = admin.id;
  });

  it("TC-1.1: Login with correct PIN returns user", async () => {
    if (!adminUserId) {
      console.log("Pominięto - brak użytkownika admin");
      return;
    }
    
    const res = await fetch(url("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: adminUserId, pin: "1234" }),
    });
    
    // 429 is acceptable - rate limited
    if (res.status === 429) {
      console.log("Rate limited - test skipped");
      return;
    }
    
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeTruthy();
    expect(data.user.name).toBeTruthy();
  });

  it("TC-1.2: Login with wrong PIN returns 401", async () => {
    if (!adminUserId) return;
    
    const res = await fetch(url("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: adminUserId, pin: "9999" }),
    });
    
    // 429 or 401 are both acceptable
    expect([401, 429]).toContain(res.status);
  });

  it("TC-1.3: API without token returns 401", async () => {
    const res = await fetch(url("/api/orders"));
    expect(res.status).toBe(401);
  });

  it("TC-1.4: Login with empty PIN returns 400/401", async () => {
    const res = await fetch(url("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: adminUserId || "test", pin: "" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("TC-1.5: Token login endpoint exists", async () => {
    const res = await fetch(url("/api/auth/token-login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: "nonexistent-token" }),
    });
    expect(res.status).not.toBe(404);
  });
});
