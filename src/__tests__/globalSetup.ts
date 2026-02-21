/**
 * Global test setup - runs ONCE before all tests
 * Logs in and saves auth cookie to file
 */

import { writeFileSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const AUTH_FILE = join(__dirname, ".test-auth.json");

export default async function setup() {
  try {
    // Get users
    const usersRes = await fetch(`${BASE_URL}/api/users`);
    if (!usersRes.ok) {
      console.error("Failed to get users for test setup");
      return;
    }
    const users = await usersRes.json();
    
    // Find Kelner 1
    const kelner = users.find((u: { name: string }) => u.name === "Kelner 1");
    if (!kelner) {
      console.error("Kelner 1 not found for test setup");
      return;
    }

    // Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: kelner.id, pin: "1111" }),
    });

    if (!loginRes.ok) {
      console.error("Failed to login for test setup:", loginRes.status);
      return;
    }

    const setCookie = loginRes.headers.get("set-cookie") || "";
    const match = setCookie.match(/pos_session=([^;]+)/);
    const cookie = match ? `pos_session=${match[1]}` : setCookie;
    
    // Save to file for other test processes to read
    writeFileSync(AUTH_FILE, JSON.stringify({
      cookie,
      userId: kelner.id,
      userName: kelner.name,
    }));
    
    console.log("Global test auth setup complete");
  } catch (err) {
    console.error("Global test setup error:", err);
  }
}
