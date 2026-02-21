export type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  color: string | null;
  icon: string | null;
  children?: CategoryNode[];
};

export type ModifierGroup = {
  modifierGroupId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  modifiers: Array<{
    id: string;
    name: string;
    priceDelta: number;
    sortOrder: number;
  }>;
};

export type ProductRow = {
  id: string;
  name: string;
  nameShort: string | null;
  categoryId: string;
  category: { id: string; name: string; parentId: string | null; color: string | null; icon: string | null };
  priceGross: number;
  taxRateId: string;
  taxRate: { id: string; fiscalSymbol: string };
  isAvailable: boolean;
  color: string | null;
  sortOrder: number;
  modifierGroups: ModifierGroup[];
  allergens: Array<{ code: string; name: string; icon: string | null }>;
};
