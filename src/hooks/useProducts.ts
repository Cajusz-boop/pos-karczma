import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/offline-db";
import type { LocalProduct } from "@/lib/db/offline-db";

const isBrowser = () => typeof window !== "undefined";
const active = (v: unknown) => v === true || v === 1;

/**
 * Reactive products from Dexie — auto-updates when data changes.
 * Drop-in replacement for React Query useProducts.
 * Używa toArray + filter zamiast .where/.between — IndexedDB nie akceptuje boolean/null w IDBKeyRange.
 */
export function useProducts(categoryId?: string): {
  products: LocalProduct[];
  isLoading: boolean;
} {
  const products = useLiveQuery(
    async () => {
      if (!isBrowser()) return [];
      const all = await db.products.toArray();
      const filtered = all
        .filter((p) => active(p.isActive) && active(p.isAvailable) && (categoryId ? p.categoryId === categoryId : true))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      return filtered;
    },
    [categoryId],
    []
  );

  return {
    products: products ?? [],
    isLoading: products === undefined,
  };
}

export function useProduct(productId: string): LocalProduct | undefined {
  return useLiveQuery(
    () => (!isBrowser() ? undefined : db.products.get(productId)),
    [productId],
    undefined
  );
}

export function useAllProducts(): {
  products: LocalProduct[];
  isLoading: boolean;
} {
  const products = useLiveQuery(
    () => (!isBrowser() ? [] : db.products.toArray()),
    [],
    []
  );

  return {
    products: products ?? [],
    isLoading: products === undefined,
  };
}
