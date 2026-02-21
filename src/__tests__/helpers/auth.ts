/**
 * Test authentication helper
 * Provides utilities for logging in and making authenticated requests
 * 
 * IMPORTANT: This module caches authentication globally to avoid rate limiting.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const AUTH_FILE = join(__dirname, "..", ".test-auth.json");

interface SavedAuth {
  cookie: string;
  userId: string;
  userName: string;
}

function loadSavedAuth(): SavedAuth | null {
  try {
    if (existsSync(AUTH_FILE)) {
      return JSON.parse(readFileSync(AUTH_FILE, "utf-8"));
    }
  } catch {
    // Ignore errors
  }
  return null;
}

interface User {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  isOwner: boolean;
}

interface AuthResult {
  user: User;
  cookie: string;
}

// Global cache - persists across all test files
const globalCache: {
  users: User[] | null;
  auth: AuthResult | null;
  adminAuth: AuthResult | null;
  loginPromise: Promise<AuthResult> | null;
  adminLoginPromise: Promise<AuthResult> | null;
  usersPromise: Promise<User[]> | null;
} = {
  users: null,
  auth: null,
  adminAuth: null,
  loginPromise: null,
  adminLoginPromise: null,
  usersPromise: null,
};

/**
 * Get list of all users from the API
 */
export async function getUsers(): Promise<User[]> {
  if (globalCache.users) return globalCache.users;
  
  // Prevent concurrent requests
  if (globalCache.usersPromise) return globalCache.usersPromise;
  
  globalCache.usersPromise = (async () => {
    const res = await fetch(`${BASE_URL}/api/users`);
    if (!res.ok) {
      throw new Error(`Failed to get users: ${res.status}`);
    }
    const users = await res.json();
    globalCache.users = users;
    return users;
  })();
  
  return globalCache.usersPromise;
}

/**
 * Find a user by name
 */
export async function findUser(name: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.name === name);
}

/**
 * Login with userId and PIN, returns the auth cookie
 */
export async function login(userId: string, pin: string): Promise<AuthResult> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, pin }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Login failed: ${res.status} - ${error.error || JSON.stringify(error)}`);
  }

  const data = await res.json();
  const setCookie = res.headers.get("set-cookie") || "";
  
  // Extract the cookie value
  const cookieMatch = setCookie.match(/pos_session=([^;]+)/);
  const cookie = cookieMatch ? `pos_session=${cookieMatch[1]}` : setCookie;

  return {
    user: data.user,
    cookie,
  };
}

/**
 * Login as a specific user by name
 * Default: "Kelner 1" with PIN "1111"
 */
export async function loginAs(userName: string = "Kelner 1", pin: string = "1111"): Promise<AuthResult> {
  const user = await findUser(userName);
  if (!user) {
    throw new Error(`User "${userName}" not found`);
  }
  return login(user.id, pin);
}

/**
 * Get or create cached authentication
 * Uses "Kelner 1" by default - CACHED GLOBALLY
 * First checks saved auth from global setup
 */
export async function getAuth(): Promise<AuthResult> {
  if (globalCache.auth) return globalCache.auth;
  
  // Check if auth was set by global setup (saved to file)
  const saved = loadSavedAuth();
  if (saved) {
    const user = await findUser(saved.userName);
    if (user) {
      globalCache.auth = {
        user,
        cookie: saved.cookie,
      };
      return globalCache.auth;
    }
  }
  
  // Prevent concurrent login attempts (rate limiting protection)
  if (globalCache.loginPromise) return globalCache.loginPromise;
  
  globalCache.loginPromise = loginAs("Kelner 1", "1111");
  globalCache.auth = await globalCache.loginPromise;
  return globalCache.auth;
}

/**
 * Get admin authentication (owner)
 * Uses "Łukasz" with PIN "1234" - CACHED GLOBALLY
 */
export async function getAdminAuth(): Promise<AuthResult> {
  if (globalCache.adminAuth) return globalCache.adminAuth;
  
  // Prevent concurrent login attempts
  if (globalCache.adminLoginPromise) return globalCache.adminLoginPromise;
  
  globalCache.adminLoginPromise = loginAs("Łukasz", "1234");
  globalCache.adminAuth = await globalCache.adminLoginPromise;
  return globalCache.adminAuth;
}

/**
 * Make an authenticated fetch request
 */
export async function authFetch(
  urlPath: string,
  options: RequestInit = {}
): Promise<Response> {
  const auth = await getAuth();
  
  const headers = new Headers(options.headers);
  headers.set("Cookie", auth.cookie);
  
  return fetch(urlPath, {
    ...options,
    headers,
  });
}

/**
 * Make an authenticated fetch request as admin
 */
export async function adminFetch(
  urlPath: string,
  options: RequestInit = {}
): Promise<Response> {
  const auth = await getAdminAuth();
  
  const headers = new Headers(options.headers);
  headers.set("Cookie", auth.cookie);
  
  return fetch(urlPath, {
    ...options,
    headers,
  });
}

/**
 * Reset cached authentication (useful between test suites)
 */
export function resetAuth(): void {
  globalCache.auth = null;
  globalCache.adminAuth = null;
  globalCache.users = null;
  globalCache.loginPromise = null;
  globalCache.adminLoginPromise = null;
  globalCache.usersPromise = null;
}

/**
 * Helper to build full URL
 */
export function url(path: string): string {
  return `${BASE_URL}${path}`;
}
