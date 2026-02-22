"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

const CACHE_KEY = "pos-karczma-query-cache";
const CACHE_VERSION = 1;
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

interface CacheEntry {
  version: number;
  timestamp: number;
  data: Record<string, unknown>;
}

function loadCache(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    if (Date.now() - entry.timestamp > CACHE_MAX_AGE) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return entry.data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function saveCache(client: QueryClient): void {
  if (typeof window === "undefined") return;
  
  try {
    const cache = client.getQueryCache();
    const queries = cache.getAll();
    
    const persistableQueries = queries
      .filter((query) => {
        const queryKey = query.queryKey;
        if (!Array.isArray(queryKey) || queryKey.length === 0) return false;
        const key = queryKey[0];
        return ["products", "categories", "rooms", "tables", "modifiers"].includes(key as string);
      })
      .reduce((acc, query) => {
        const key = JSON.stringify(query.queryKey);
        if (query.state.data !== undefined) {
          acc[key] = {
            data: query.state.data,
            dataUpdatedAt: query.state.dataUpdatedAt,
          };
        }
        return acc;
      }, {} as Record<string, unknown>);
    
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data: persistableQueries,
    };
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

function restoreCache(client: QueryClient, cache: Record<string, unknown>): void {
  Object.entries(cache).forEach(([key, value]) => {
    try {
      const queryKey = JSON.parse(key);
      const { data, dataUpdatedAt } = value as { data: unknown; dataUpdatedAt: number };
      
      if (Date.now() - dataUpdatedAt < CACHE_MAX_AGE) {
        client.setQueryData(queryKey, data);
      }
    } catch {
      // Ignore invalid entries
    }
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            gcTime: 1000 * 60 * 30, // 30 minutes
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );
  
  useEffect(() => {
    const cachedData = loadCache();
    if (cachedData) {
      restoreCache(client, cachedData);
    }
    
    const saveInterval = setInterval(() => {
      saveCache(client);
    }, 30000);
    
    const handleBeforeUnload = () => {
      saveCache(client);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveCache(client);
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      saveCache(client);
    };
  }, [client]);
  
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
