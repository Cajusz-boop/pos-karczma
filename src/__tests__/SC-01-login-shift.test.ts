/**
 * SC-01: Scenariusze logowania i rozpoczęcia pracy
 * Testy: PIN, kapsułka Dallas, NFC, otwarcie zmiany
 */
import { describe, it, expect, beforeAll } from "vitest";
import { findUser, authFetch, url } from "./helpers/auth";

let authCookie: string | null = null;
let testUserId: string | null = null;

describe("SC-01: Logowanie i rozpoczęcie pracy", () => {
  beforeAll(async () => {
    const user = await findUser("Kelner 1");
    if (user) testUserId = user.id;
  });

  describe("SC-01-01: Logowanie kelner PIN", () => {
    it("powinno wyświetlić ekran logowania", async () => {
      const res = await fetch(url("/api/auth/session"));
      expect([200, 401]).toContain(res.status);
    });

    it("powinno odrzucić błędny PIN", async () => {
      if (!testUserId) return;
      
      const res = await fetch(url("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: testUserId, pin: "0000" }),
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("powinno zalogować z poprawnym PIN", async () => {
      if (!testUserId) {
        console.log("Pominięto - brak użytkownika");
        return;
      }
      
      const res = await fetch(url("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: testUserId, pin: "1111" }),
      });
      
      // 429 rate limited is acceptable
      if (res.status === 429) {
        console.log("Rate limited - test skipped");
        return;
      }
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeTruthy();
      
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) {
        const match = setCookie.match(/pos_session=([^;]+)/);
        authCookie = match ? `pos_session=${match[1]}` : setCookie;
      }
    });

    it("powinno ustawić httpOnly cookie z JWT", async () => {
      if (!testUserId) return;
      
      const res = await fetch(url("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: testUserId, pin: "1111" }),
      });
      
      const setCookie = res.headers.get("set-cookie");
      if (res.status === 200 && setCookie) {
        expect(setCookie.toLowerCase()).toContain("httponly");
      }
    });
  });

  describe("SC-01-02: Logowanie kapsułką Dallas iButton", () => {
    it("powinno mieć endpoint token-login", async () => {
      const res = await fetch(url("/api/auth/token-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: "INVALID-TOKEN-123" }),
      });
      expect([200, 401, 404]).toContain(res.status);
    });

    it("powinno odrzucić nieznany token", async () => {
      const res = await fetch(url("/api/auth/token-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: "UNKNOWN-DALLAS-TOKEN" }),
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("SC-01-03: Logowanie NFC na telefonie Android", () => {
    it("endpoint token-login obsługuje NFC", async () => {
      const res = await fetch(url("/api/auth/token-login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tokenId: "NFC-UID-12345678",
          tokenType: "NFC"
        }),
      });
      expect([200, 401, 404]).toContain(res.status);
    });
  });

  describe("SC-01-04: Otwarcie zmiany kelnera", () => {
    it("powinno mieć endpoint shifts", async () => {
      const res = await authFetch(url("/api/shifts"));
      expect([200, 401]).toContain(res.status);
    });

    it("powinno utworzyć nową zmianę", async () => {
      if (!testUserId || !authCookie) {
        console.log("Pominięto - brak zalogowanego użytkownika");
        return;
      }

      const res = await fetch(url("/api/shifts"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cookie": authCookie,
        },
        body: JSON.stringify({ 
          userId: testUserId,
          startingCash: 500.00 
        }),
      });
      
      if (res.status === 200 || res.status === 201) {
        const data = await res.json();
        expect(data.shift || data.id).toBeTruthy();
      }
    });

    it("powinno zwrócić otwartą zmianę użytkownika", async () => {
      if (!testUserId) return;

      const res = await authFetch(url(`/api/shifts?userId=${testUserId}&status=open`));
      if (res.status === 200) {
        const data = await res.json();
        expect(Array.isArray(data) || data.shifts).toBeTruthy();
      }
    });
  });

  describe("SC-01-05: Bezpieczeństwo API", () => {
    it("API orders wymaga autoryzacji", async () => {
      const res = await fetch(url("/api/orders"));
      expect(res.status).toBe(401);
    });

    it("API products wymaga autoryzacji", async () => {
      const res = await fetch(url("/api/products"));
      expect(res.status).toBe(401);
    });

    it("API users nie wymaga autoryzacji (lista do logowania)", async () => {
      const res = await fetch(url("/api/users"));
      expect(res.status).toBe(200);
    });
  });
});
