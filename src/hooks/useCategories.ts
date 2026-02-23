import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/offline-db";
import type { LocalCategory } from "@/lib/db/offline-db";

const isBrowser = () => typeof window !== "undefined";
const active = (v: unknown) => v === true || v === 1;

export function useCategories(parentId?: string): {
  categories: LocalCategory[];
  isLoading: boolean;
} {
  const categories = useLiveQuery(
    async () => {
      if (!isBrowser()) return [];
      const all = await db.categories.toArray();
      const filtered = all
        .filter((c) => active(c.isActive) && (parentId ? c.parentId === parentId : !c.parentId))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      return filtered;
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
