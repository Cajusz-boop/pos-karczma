import { useLiveQuery } from "dexie-react-hooks";
import Dexie from "dexie";
import { db } from "@/lib/db/offline-db";
import type { LocalCategory } from "@/lib/db/offline-db";

const isBrowser = () => typeof window !== "undefined";

export function useCategories(parentId?: string): {
  categories: LocalCategory[];
  isLoading: boolean;
} {
  const categories = useLiveQuery(
    async () => {
      if (!isBrowser()) return [];
      if (parentId) {
        return db.categories
          .where("[parentId+sortOrder]")
          .between([parentId, Dexie.minKey], [parentId, Dexie.maxKey])
          .filter((c) => c.isActive)
          .toArray();
      }
      return db.categories
        .where("[isActive+sortOrder]")
        .between([1, Dexie.minKey], [1, Dexie.maxKey])
        .toArray();
    },
    [parentId],
    []
  );

  return {
    categories: categories ?? [],
    isLoading: categories === undefined,
  };
}

export function useCategory(categoryId: string): LocalCategory | undefined {
  return useLiveQuery(
    () => (!isBrowser() ? undefined : db.categories.get(categoryId)),
    [categoryId],
    undefined
  );
}

export function useAllCategories(): {
  categories: LocalCategory[];
  isLoading: boolean;
} {
  const categories = useLiveQuery(
    () => (!isBrowser() ? [] : db.categories.toArray()),
    [],
    []
  );

  return {
    categories: categories ?? [],
    isLoading: categories === undefined,
  };
}
