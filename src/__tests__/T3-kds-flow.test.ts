/**
 * T3: KDS flow — zamówienie, zaczynam, gotowe, push
 */
import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("T3: KDS Flow", () => {
  it("TC-3.1: KDS stations endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/kds/stations`);
    expect(res.status).toBe(200);
  });

  it("TC-3.2: KDS config endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/kds/config`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.config).toBeDefined();
    expect(data.config.warningMinutes).toBeTypeOf("number");
    expect(["tile", "allday", "expo"]).toContain(data.config.defaultMode);
  });

  it("TC-3.3: Push VAPID key endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/push`);
    expect(res.status).toBe(200);
  });
});
