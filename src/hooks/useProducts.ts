import { useLiveQuery } from "dexie-react-hooks";
import Dexie from "dexie";
import { db } from "@/lib/db/offline-db";
import type { LocalProduct } from "@/lib/db/offline-db";

const isBrowser = () => typeof window !== "undefined";

/**
 * Reactive products from Dexie — auto-updates when data changes.
 * Drop-in replacement for React Query useProducts.
 */
export function useProducts(categoryId?: string): {
  products: LocalProduct[];
  isLoading: boolean;
} {
  const products = useLiveQuery(
    async () => {
      if (!isBrowser()) return [];
      if (categoryId) {
        return db.products
          .where("[categoryId+isActive+sortOrder]")
          .between([categoryId, 1, Dexie.minKey], [categoryId, 1, Dexie.maxKey])
          .toArray();
      }
      return db.products
        .where("[isActive+isAvailable]")
        .between([1, 1], [1, 1])
        .toArray();
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
