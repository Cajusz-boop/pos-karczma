/**
 * T21-T40: System & Integration Tests
 */
import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("T22: Reports", () => {
  it("TC-22.1: Food cost report endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/reports/food-cost`);
    expect(res.status).toBe(200);
  });

  it("TC-22.2: Menu engineering report endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/reports/menu-engineering`);
    expect(res.status).toBe(200);
  });
});

describe("T25: Performance", () => {
  it("TC-25.1: Rooms load in < 5s", async () => {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/rooms`);
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeLessThan(5000);
  });
});

describe("T38: Health check", () => {
  it("TC-38.1: Health endpoint returns OK", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});

describe("T39: Vouchers & Loyalty", () => {
  it("TC-39.1: Vouchers endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/vouchers`);
    expect(res.status).toBe(200);
  });

  it("TC-39.2: Loyalty rewards endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/loyalty/rewards`);
    expect(res.status).toBe(200);
  });
});

describe("T40: Training mode", () => {
  it("TC-40.1: Training mode endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/training`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.trainingMode).toBe("boolean");
  });
});
