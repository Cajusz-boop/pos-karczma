import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/offline-db";
import type { LocalProduct, LocalCategory, LocalModifierGroup, LocalAllergen, LocalTaxRate } from "@/lib/db/offline-db";
import type { CategoryNode, ProductRow } from "@/app/(dashboard)/pos/order/[orderId]/orderPageTypes";

const isBrowser = () => typeof window !== "undefined";
const active = (v: unknown) => v === true || v === 1;

function buildCategoryTree(categories: LocalCategory[]): CategoryNode[] {
  const byParent = new Map<string | null, LocalCategory[]>();
  for (const c of categories) {
    const key = c.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const arr of Array.from(byParent.values())) {
    arr.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  function build(parentId: string | null): CategoryNode[] {
    const children = byParent.get(parentId) ?? [];
    return children.map((c) => {
      const sub = build(c.id);
      return {
        id: c.id,
        name: c.name,
        parentId: c.parentId ?? null,
        sortOrder: c.sortOrder,
        color: c.color ?? null,
        icon: c.icon ?? null,
        imageUrl: c.imageUrl ?? null,
        children: sub.length > 0 ? sub : undefined,
      };
    });
  }
  return build(null);
}

/**
 * Products + categories in POS format (ProductRow, CategoryNode tree).
 * Drop-in replacement for GET /api/products in OrderPageClient.
 */
export function useProductsForPos(): {
  categories: CategoryNode[];
  products: ProductRow[];
  isLoading: boolean;
} {
  const result = useLiveQuery(
    async () => {
      if (!isBrowser()) return { categories: [], products: [], isLoading: false };

      const [productsRaw, categoriesRaw, modifierGroups, allergens, taxRates] = await Promise.all([
        db.products.toArray(),
        db.categories.toArray(),
        db.modifierGroups.toArray(),
        db.allergens.toArray(),
        db.taxRates.toArray(),
      ]);

      const products = productsRaw
        .filter((p) => active(p.isActive) && active(p.isAvailable))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const categories = categoriesRaw
        .filter((c) => active(c.isActive))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const modMap = new Map<string, LocalModifierGroup>();
      for (const m of modifierGroups) modMap.set(m.id, m);
      const algMap = new Map<string, LocalAllergen>();
      for (const a of allergens) algMap.set(a.id, a);
      const catMap = new Map<string, LocalCategory>();
      for (const c of categories) catMap.set(c.id, c);
      const taxMap = new Map<string, LocalTaxRate>();
      for (const t of taxRates) taxMap.set(t.id, t);

      const productRows: ProductRow[] = products.map((p: LocalProduct) => {
        const category = catMap.get(p.categoryId);
        const taxRate = taxMap.get(p.taxRateId);
        const modifierGroupsForProduct = (p.modifierGroupIds ?? [])
          .map((id) => modMap.get(id))
          .filter(Boolean) as LocalModifierGroup[];
        const allergensForProduct = (p.allergenIds ?? [])
          .map((id) => algMap.get(id))
          .filter(Boolean) as LocalAllergen[];

        return {
          id: p.id,
          name: p.name,
          nameShort: p.nameShort ?? null,
          categoryId: p.categoryId,
          category: {
            id: category?.id ?? p.categoryId,
            name: category?.name ?? "",
            parentId: category?.parentId ?? null,
            color: category?.color ?? null,
            icon: category?.icon ?? null,
          },
          priceGross: p.priceGross,
          taxRateId: p.taxRateId,
          taxRate: {
            id: taxRate?.id ?? p.taxRateId,
            fiscalSymbol: taxRate?.fiscalSymbol ?? "?",
          },
          isAvailable: p.isAvailable,
          color: p.color ?? null,
          sortOrder: p.sortOrder,
          modifierGroups: modifierGroupsForProduct.map((mg) => ({
            modifierGroupId: mg.id,
            name: mg.name,
            minSelect: mg.minSelect,
            maxSelect: mg.maxSelect,
            isRequired: mg.isRequired,
            modifiers: (mg.modifiers ?? []).map((m) => ({
              id: m.id,
              name: m.name,
              priceDelta: m.priceDelta,
              sortOrder: m.sortOrder,
            })),
          })),
          allergens: allergensForProduct.map((a) => ({
            code: a.code,
            name: a.name,
            icon: a.icon ?? null,
          })),
        };
      });

      const categoryTree = buildCategoryTree(categories);

      return {
        categories: categoryTree,
        products: productRows,
        isLoading: false,
      };
    },
    [],
    { categories: [], products: [], isLoading: true }
  );

  const data = result ?? { categories: [], products: [], isLoading: true };
  return {
    categories: data.categories,
    products: data.products,
    isLoading: result === undefined,
  };
}
