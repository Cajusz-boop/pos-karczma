"use client";

import { useEffect, useRef, useState, useMemo, lazy, Suspense, useDeferredValue } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrderStore, type OrderItemLine } from "@/store/useOrderStore";
import { useProductsForPos } from "@/hooks/useProductsForPos";
import { useRoomsWithTables } from "@/hooks/useRoomsWithTables";
import { useOrder, useOrderItems, useOpenOrders } from "@/hooks/useOrder";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { OrderPageView } from "./OrderPageView";
import { OrderSyncBadge } from "@/components/OrderSyncBadge";
import { SuggestionPopup, type SuggestionProduct } from "@/components/pos/SuggestionPopup";
import type { CategoryNode } from "./orderPageTypes";

const PaymentDialog = lazy(() => import("./PaymentDialog").then(m => ({ default: m.PaymentDialog })));

type ProductRow = import("./orderPageTypes").ProductRow;

type OrderResponse = {
  id: string;
  orderNumber: number;
  tableNumber: number | null;
  tableId: string | null;
  userId: string;
  userName: string;
  guestCount: number;
  status: string;
  type?: string;
  courseReleasedUpTo?: number;
  discountJson: { type: string; value: number; reason?: string; authorizedBy?: string } | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxRateId: string;
    taxRatePercent: number;
    taxRateSymbol: string;
    modifiersJson: unknown;
    note: string | null;
    courseNumber: number;
    status: string;
  }>;
};

function flattenAll(cats: CategoryNode[]): CategoryNode[] {
  let out: CategoryNode[] = [];
  for (const c of cats) {
    out.push(c);
    if (c.children?.length) {
      out = out.concat(flattenAll(c.children));
    }
  }
  return out;
}

function getDescendantIds(tree: CategoryNode[], parentId: string): string[] {
  const ids: string[] = [parentId];
  const findAndCollect = (nodes: CategoryNode[]): void => {
    for (const node of nodes) {
      if (node.id === parentId || ids.includes(node.parentId ?? "")) {
        if (!ids.includes(node.id)) ids.push(node.id);
      }
      if (node.children?.length) {
        findAndCollect(node.children);
      }
    }
  };
  findAndCollect(tree);
  for (let i = 0; i < 5; i++) findAndCollect(tree);
  return ids;
}

function getDirectChildren(tree: CategoryNode[], parentId: string | null): CategoryNode[] {
  if (parentId === null) {
    return (tree ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }
  for (const node of tree) {
    if (node.id === parentId) {
      return (node.children ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
    }
    if (node.children?.length) {
      const found = getDirectChildren(node.children, parentId);
      if (found.length > 0) return found;
    }
  }
  return [];
}

function getBreadcrumb(tree: CategoryNode[], targetId: string): CategoryNode[] {
  const flat = flattenAll(tree);
  const path: CategoryNode[] = [];
  let id: string | null = targetId;
  while (id) {
    const node = flat.find((c) => c.id === id);
    if (!node) break;
    path.unshift(node);
    id = node.parentId;
  }
  return path;
}

type OpenOrderRow = {
  id: string;
  orderNumber: number;
  tableId: string | null;
  tableNumber: number | null;
  userName: string;
  syncStatus?: string;
};

export function OrderPageClient({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { orderNumber, tableNumber, items, setOrder, addItem, updateQuantity, updateNote, removeItem } =
    useOrderStore();

  const [categoryStack, setCategoryStack] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [modifierProduct, setModifierProduct] = useState<{
    product: ProductRow;
    selected: Record<string, string[]>;
  } | null>(null);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelOrderConfirm, setCancelOrderConfirm] = useState(false);
  const [stornoItemId, setStornoItemId] = useState<string | null>(null);
  const [stornoReason, setStornoReason] = useState("");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [opLoading, setOpLoading] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [mergeIfOccupied, setMergeIfOccupied] = useState(false);
  const [splitSelectedIds, setSplitSelectedIds] = useState<string[]>([]);
  const [mergeTargetOrderId, setMergeTargetOrderId] = useState<string | null>(null);
  const [showReadyBanner, setShowReadyBanner] = useState(false);
  const [messageToKitchenOpen, setMessageToKitchenOpen] = useState(false);
  const [messageToKitchenText, setMessageToKitchenText] = useState("");
  const [messageToKitchenSending, setMessageToKitchenSending] = useState(false);
  const [closeZeroDialogOpen, setCloseZeroDialogOpen] = useState(false);
  const prevOrderStatusRef = useRef<string | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);

  // Hotel order params from URL
  const searchParams = useSearchParams();
  const isHotelOrder = searchParams.get("hotel") === "true";
  const hotelRoomNumber = searchParams.get("roomNumber") ?? "";
  const hotelGuestName = searchParams.get("guestName") ?? "";
  const hotelGuestId = searchParams.get("guestId") ?? "";
  const hotelCheckOut = searchParams.get("checkOut") ?? "";
  const [hotelChargeLoading, setHotelChargeLoading] = useState(false);
  const [hotelChargeResult, setHotelChargeResult] = useState<{
    success: boolean;
    message: string;
    unassigned?: boolean;
  } | null>(null);

  // Dexie — products, categories, rooms, orders (offline-first)
  const { categories, products, isLoading: productsLoading } = useProductsForPos();
  const { rooms } = useRoomsWithTables();
  const { orders: openOrdersRaw } = useOpenOrders();
  const localOrder = useOrder(orderId);
  const { items: localOrderItems } = useOrderItems(localOrder?._localId);

  // Fallback: jeśli Dexie nie ma zamówienia po 2s, pobierz z API i hydruj
  const [dexieChecked, setDexieChecked] = useState(false);
  useEffect(() => {
    if (localOrder !== undefined) return;
    const timer = setTimeout(() => setDexieChecked(true), 2000);
    return () => clearTimeout(timer);
  }, [localOrder]);

  const { data: apiFallbackOrder } = useQuery({
    queryKey: ["order-fallback", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.error) return null;
      return data;
    },
    enabled: dexieChecked && localOrder === undefined && !!orderId,
    staleTime: Infinity,
  });

  // Hydruj do Dexie gdy API zwróci zamówienie
  useEffect(() => {
    if (!apiFallbackOrder || localOrder) return;
    import("@/lib/orders/order-actions").then(({ hydrateOrderFromApiCreate }) => {
      hydrateOrderFromApiCreate({
        serverId: apiFallbackOrder.id,
        orderNumber: apiFallbackOrder.orderNumber,
        type: apiFallbackOrder.type ?? "TAKEAWAY",
        tableId: apiFallbackOrder.tableId,
        userId: apiFallbackOrder.userId,
        userName: apiFallbackOrder.user?.name ?? "",
        guestCount: apiFallbackOrder.guestCount ?? 1,
      });
    });
  }, [apiFallbackOrder, localOrder]);

  // Map open orders to OpenOrderRow format (for merge dialog)
  const openOrders: OpenOrderRow[] = useMemo(
    () =>
      openOrdersRaw
        .filter((o) => (o._serverId ?? o._localId) !== orderId)
        .map((o) => ({
          id: o._serverId ?? o._localId,
          orderNumber: o.orderNumber ?? 0,
          tableId: o.tableId ?? null,
          tableNumber: o.tableNumber ?? null,
          userName: o.userName ?? "",
          syncStatus: o._syncStatus,
        })),
    [openOrdersRaw, orderId]
  );

  // Order data: prefer Dexie; fallback structure for store population
  const orderData: OrderResponse | null = useMemo(() => {
    const ord = localOrder;
    if (!ord) return null;
    const items = localOrderItems ?? [];
    return {
      id: ord._serverId ?? ord._localId,
      orderNumber: ord.orderNumber ?? 0,
      tableNumber: ord.tableNumber ?? null,
      tableId: ord.tableId ?? null,
      userId: ord.userId,
      userName: ord.userName ?? "",
      guestCount: ord.guestCount ?? 0,
      status: ord.status,
      type: ord.type,
      courseReleasedUpTo: 1,
      discountJson: ord.discountJson ?? null,
      items: items.map((i) => ({
        id: i._localId ?? i.productId + "-" + i.quantity,
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRateId: i.taxRateId,
        taxRatePercent: i.taxRatePercent ?? 0,
        taxRateSymbol: i.fiscalSymbol ?? "?",
        modifiersJson: i.modifiersJson ?? [],
        note: i.note ?? null,
        courseNumber: i.courseNumber,
        status: i.status,
      })),
    };
  }, [localOrder, localOrderItems]);

  const orderLoading = productsLoading || (!!orderId && localOrder === undefined && !dexieChecked);
  const popularProducts: Array<{ id: string; name: string; priceGross: number; taxRateId: string; color: string | null; categoryName: string; orderCount: number }> = [];

  // Favorites
  const { data: userPrefs } = useQuery<{ preferences: { favoriteProducts: string[] } }>({
    queryKey: ["pos-preferences", currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/users/${currentUser?.id}/pos-preferences`);
      if (!res.ok) return { preferences: { favoriteProducts: [] } };
      return res.json();
    },
    enabled: !!currentUser?.id,
    staleTime: 60 * 1000,
  });
  const favoriteProductIds = useMemo(
    () => userPrefs?.preferences?.favoriteProducts ?? [],
    [userPrefs?.preferences?.favoriteProducts]
  );

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/users/${currentUser?.id}/pos-preferences/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Błąd ulubionych");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["pos-preferences", currentUser?.id],
        (old: { preferences: { favoriteProducts: string[] } } | undefined) => ({
          preferences: {
            ...old?.preferences,
            favoriteProducts: data.favoriteProducts,
          },
        })
      );
    },
  });

  const handleToggleFavorite = (productId: string) => {
    toggleFavoriteMutation.mutate(productId);
  };

  const handleToggleFavoritesView = () => {
    setShowFavoritesOnly(prev => !prev);
  };

  useEffect(() => {
    if (orderData?.status === "READY" && prevOrderStatusRef.current !== "READY") {
      setShowReadyBanner(true);
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUvvT18=");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}
    }
    if (orderData?.status) prevOrderStatusRef.current = orderData.status;
  }, [orderData?.status]);

  useEffect(() => {
    if (orderData) {
      const lines: OrderItemLine[] = orderData.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRateId: i.taxRateId,
        modifiersJson: Array.isArray(i.modifiersJson) ? i.modifiersJson : undefined,
        note: i.note ?? undefined,
        courseNumber: i.courseNumber,
        status: i.status === "CANCELLED" ? "CANCELLED" : i.status === "SENT" ? "SENT" : "ORDERED",
      }));
      setOrder(orderData.id, orderData.orderNumber, orderData.tableNumber ?? null, lines);
    }
  }, [orderId, orderData, setOrder]);

  const currentCategoryId = categoryStack[categoryStack.length - 1] ?? null;
  const childCategories = useMemo(
    () => getDirectChildren(categories, currentCategoryId),
    [categories, currentCategoryId]
  );
  const rootCategories = useMemo(
    () => getDirectChildren(categories, null),
    [categories]
  );
  const breadcrumb = currentCategoryId ? getBreadcrumb(categories, currentCategoryId) : [];

  // Effective category stack - if empty, use first root category for display
  const effectiveCategoryStack = useMemo(() => {
    if (categoryStack.length > 0) return categoryStack;
    if (rootCategories.length > 0) return [rootCategories[0].id];
    return [];
  }, [categoryStack, rootCategories]);

  const recentProducts = useMemo(() => {
    return recentProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as ProductRow[];
  }, [recentProductIds, products]);

  const categoryIdsToShow = useMemo(() => {
    // If no category selected, use first root category by default
    const effectiveCategoryId = currentCategoryId ?? rootCategories[0]?.id ?? null;
    if (!effectiveCategoryId) return [];
    return getDescendantIds(categories, effectiveCategoryId);
  }, [categories, currentCategoryId, rootCategories]);

  const filteredProducts = useMemo(() => {
    const allergenFilter = (p: ProductRow) => {
      if (excludedAllergens.length === 0) return true;
      return !p.allergens.some((a) => excludedAllergens.includes(a.code));
    };
    const alphabeticalSort = (a: ProductRow, b: ProductRow) => 
      a.name.localeCompare(b.name, 'pl');

    // Show favorites only mode
    if (showFavoritesOnly) {
      return [...products]
        .filter((p) => favoriteProductIds.includes(p.id) && p.isAvailable && allergenFilter(p))
        .sort(alphabeticalSort);
    }

    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.trim().toLowerCase();
      return [...products]
        .filter(
          (p) =>
            (p.name.toLowerCase().includes(q) ||
            (p.nameShort && p.nameShort.toLowerCase().includes(q))) &&
            allergenFilter(p)
        )
        .sort(alphabeticalSort);
    }
    if (categoryIdsToShow.length === 0) return [];
    return [...products]
      .filter((p) => categoryIdsToShow.includes(p.categoryId) && allergenFilter(p))
      .sort(alphabeticalSort);
  }, [products, categoryIdsToShow, deferredSearchQuery, excludedAllergens, showFavoritesOnly, favoriteProductIds]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const payload = items.map((it) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        taxRateId: it.taxRateId,
        modifiersJson: it.modifiersJson,
        note: it.note,
        courseNumber: it.courseNumber,
      }));
      const res = await fetch(`/api/orders/${orderId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Błąd wysyłania");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      fetch("/api/print/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).catch(() => {});
    },
  });

  const handleCategoryClick = (cat: CategoryNode) => {
    // Clear favorites view when clicking a category
    setShowFavoritesOnly(false);
    // If clicking a root category, reset stack to just that category
    const isRootCategory = rootCategories.some(rc => rc.id === cat.id);
    if (isRootCategory) {
      setCategoryStack([cat.id]);
    } else {
      setCategoryStack((s) => [...s, cat.id]);
    }
  };

  const handleBack = () => {
    setCategoryStack((s) => s.slice(0, -1));
  };

  const requiredGroups = (p: ProductRow) =>
    p.modifierGroups.filter((g) => g.isRequired && g.modifiers.length > 0);

  const tryAddProduct = (product: ProductRow) => {
    const required = requiredGroups(product);
    if (required.length > 0) {
      // Auto-apply defaults: if all required groups have exactly 1 choice (minSelect=1, maxSelect=1)
      // and each has at least 1 modifier, skip the dialog and auto-select first modifier
      const canAutoApply = required.every(
        (g) => g.minSelect === 1 && g.maxSelect === 1 && g.modifiers.length >= 1
      );

      if (canAutoApply) {
        // Build auto-selected modifiers and add directly
        const autoSelected: Record<string, string[]> = {};
        for (const g of required) {
          autoSelected[g.modifierGroupId] = [g.modifiers[0].id];
        }
        // Temporarily set modifierProduct to use doAddProduct's modifier logic
        const mods = product.modifierGroups.flatMap((g) =>
          (autoSelected[g.modifierGroupId] ?? []).map((mid) => {
            const m = g.modifiers.find((x) => x.id === mid);
            return m ? { modifierId: m.id, name: m.name, priceDelta: m.priceDelta } : null;
          })
        ).filter(Boolean) as Array<{ modifierId: string; name: string; priceDelta: number }>;
        const totalPrice = product.priceGross + mods.reduce((s, m) => s + m.priceDelta, 0);
        vibrateConfirm();
        addItem({
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: totalPrice,
          taxRateId: product.taxRateId,
          modifiersJson: mods.length ? mods : undefined,
          courseNumber: 1,
        });
        setLastAddedProductId(product.id);
        setRecentProductIds((prev) => [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 6));
        return;
      }

      // Otherwise show modifier dialog with pre-selected defaults
      const selected: Record<string, string[]> = {};
      for (const g of required) {
        selected[g.modifierGroupId] = g.maxSelect === 1 && g.modifiers[0] ? [g.modifiers[0].id] : [];
      }
      setModifierProduct({ product, selected });
      return;
    }
    doAddProduct(product);
  };

  const vibrateConfirm = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  function doAddProduct(product: ProductRow) {
    const mods = product.modifierGroups.flatMap((g) =>
      (modifierProduct?.selected[g.modifierGroupId] ?? []).map((mid) => {
        const m = g.modifiers.find((x) => x.id === mid);
        return m ? { modifierId: m.id, name: m.name, priceDelta: m.priceDelta } : null;
      })
    ).filter(Boolean) as Array<{ modifierId: string; name: string; priceDelta: number }>;
    const totalPrice = product.priceGross + mods.reduce((s, m) => s + m.priceDelta, 0);
    vibrateConfirm();
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: totalPrice,
      taxRateId: product.taxRateId,
      modifiersJson: mods.length ? mods : undefined,
      courseNumber: 1,
    });
    setLastAddedProductId(product.id);
    setRecentProductIds((prev) => [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 6));
    setModifierProduct(null);
  }

  const confirmModifiers = () => {
    if (!modifierProduct) return;
    const { product } = modifierProduct;
    const required = requiredGroups(product);
    const invalid = required.some((g) => {
      const sel = modifierProduct.selected[g.modifierGroupId] ?? [];
      return sel.length < g.minSelect || sel.length > g.maxSelect;
    });
    if (invalid) return;
    const mods = product.modifierGroups.flatMap((g) =>
      (modifierProduct.selected[g.modifierGroupId] ?? []).map((mid) => {
        const m = g.modifiers.find((x) => x.id === mid);
        return m ? { modifierId: m.id, name: m.name, priceDelta: m.priceDelta } : null;
      })
    ).filter(Boolean) as Array<{ modifierId: string; name: string; priceDelta: number }>;
    const totalPrice = product.priceGross + mods.reduce((s, m) => s + m.priceDelta, 0);
    vibrateConfirm();
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: totalPrice,
      taxRateId: product.taxRateId,
      modifiersJson: mods.length ? mods : undefined,
      courseNumber: 1,
    });
    setLastAddedProductId(product.id);
    setRecentProductIds((prev) => [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 6));
    setModifierProduct(null);
  };

  const handleSuggestionAdd = (suggested: SuggestionProduct) => {
    addItem({
      productId: suggested.id,
      productName: suggested.name,
      quantity: 1,
      unitPrice: suggested.priceGross,
      taxRateId: suggested.taxRateId,
      courseNumber: 1,
    });
  };

  const startEditNote = (index: number) => {
    if (items[index]?.status === "SENT") return;
    setEditingNoteIndex(index);
    setNoteInput(items[index]?.note ?? "");
  };

  const saveNote = () => {
    if (editingNoteIndex !== null) {
      updateNote(editingNoteIndex, noteInput);
      setEditingNoteIndex(null);
      setNoteInput("");
    }
  };

  const invalidateOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  const handleSendToRoom = async () => {
    if (!hotelRoomNumber || !orderId) return;
    setHotelChargeLoading(true);
    setHotelChargeResult(null);
    setOpError(null);

    try {
      // First send items to kitchen if there are new items
      const newItems = items.filter((i) => i.status === "ORDERED");
      if (newItems.length > 0) {
        await sendMutation.mutateAsync();
      }

      // Then charge to hotel room
      const res = await fetch("/api/hotel/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: hotelRoomNumber,
          orderId,
          guestName: hotelGuestName || undefined,
          guestId: hotelGuestId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHotelChargeResult({
          success: false,
          message: data.error ?? "Błąd obciążenia pokoju",
        });
        return;
      }

      // Close order after successful charge
      const closeRes = await fetch(`/api/orders/${orderId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: false }),
      });

      if (!closeRes.ok) {
        setHotelChargeResult({
          success: true,
          message: "Pokój obciążony, ale nie udało się zamknąć zamówienia",
          unassigned: data.unassigned,
        });
        return;
      }

      const activeItems = items.filter((i) => i.status !== "CANCELLED");
      const total = activeItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

      setHotelChargeResult({
        success: true,
        message: data.unassigned
          ? `Obciążono pokój ${hotelRoomNumber} — ${total.toFixed(2)} zł (brak aktywnej rezerwacji — zapisano do przypisania)`
          : `✓ Obciążono pokój ${hotelRoomNumber} — ${total.toFixed(2)} zł`,
        unassigned: data.unassigned,
      });

      invalidateOrder();

      // Redirect after success
      setTimeout(() => {
        router.push("/hotel-orders");
      }, 2000);
    } catch (e) {
      setHotelChargeResult({
        success: false,
        message: e instanceof Error ? e.message : "Błąd połączenia",
      });
    } finally {
      setHotelChargeLoading(false);
    }
  };

  const handleCloseBill = async () => {
    const activeItems = items.filter((i) => i.status !== "CANCELLED");
    const total = activeItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    
    if (total === 0) {
      // Zero balance - show confirmation dialog
      setOpError(null);
      setCloseZeroDialogOpen(true);
    } else {
      // Has balance - show payment dialog
      setPaymentDialogOpen(true);
    }
  };

  const handleCloseZeroOrder = async () => {
    // Check if order is synced to server
    if (!localOrder?._serverId) {
      setOpError("Zamówienie nie zostało jeszcze zsynchronizowane z serwerem. Poczekaj na synchronizację.");
      return;
    }

    setOpLoading(true);
    setOpError(null);
    try {
      const res = await fetch(`/api/orders/${localOrder._serverId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: false }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Błąd zamykania");
      invalidateOrder();
      setCloseZeroDialogOpen(false);
      router.push("/pos");
    } catch (e) {
      setOpError(e instanceof Error ? e.message : "Błąd zamykania");
    } finally {
      setOpLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    setOpError(null);
    setOpLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Błąd");
      setCancelOrderConfirm(false);
      invalidateOrder();
      router.push("/pos");
    } catch (e) {
      setOpError(e instanceof Error ? e.message : "Błąd anulowania");
    } finally {
      setOpLoading(false);
    }
  };

  const handleStornoSubmit = async () => {
    if (!stornoItemId) return;
    setOpError(null);
    setOpLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/items/${stornoItemId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: stornoReason || "Anulowano", reasonCode: "other" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Błąd");
      setStornoItemId(null);
      setStornoReason("");
      invalidateOrder();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : "Błąd storno");
    } finally {
      setOpLoading(false);
    }
  };

  const handleMoveSubmit = async () => {
    if (!selectedTableId) return;
    setOpError(null);
    setOpLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTableId: selectedTableId, mergeIfOccupied }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd");
      setMoveDialogOpen(false);
      setSelectedTableId(null);
      setMergeIfOccupied(false);
      invalidateOrder();
      if (data.merged && data.targetOrderId) router.push(`/pos/order/${data.targetOrderId}`);
    } catch (e) {
      setOpError(e instanceof Error ? e.message : "Błąd przenoszenia");
    } finally {
      setOpLoading(false);
    }
  };

  const handleSplitSubmit = async () => {
    if (splitSelectedIds.length === 0) return;
    setOpError(null);
    setOpLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIdsForNewOrder: splitSelectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd");
      setSplitDialogOpen(false);
      setSplitSelectedIds([]);
      invalidateOrder();
      if (data.newOrderId) router.push(`/pos/order/${data.newOrderId}`);
    } catch (e) {
      setOpError(e instanceof Error ? e.message : "Błąd podziału");
    } finally {
      setOpLoading(false);
    }
  };

  const handleMessageToKitchenSubmit = async () => {
    if (!messageToKitchenText.trim()) return;
    setMessageToKitchenSending(true);
    try {
      const res = await fetch("/api/kds/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          tableId: orderData?.tableId ?? undefined,
          message: messageToKitchenText.trim(),
        }),
      });
      if (!res.ok) throw new Error("Błąd wysyłania");
      setMessageToKitchenOpen(false);
      setMessageToKitchenText("");
    } catch {
      setOpError("Nie udało się wysłać wiadomości do kuchni");
    } finally {
      setMessageToKitchenSending(false);
    }
  };

  const handleMergeSubmit = async () => {
    if (!mergeTargetOrderId) return;
    setOpError(null);
    setOpLoading(true);
    try {
      const res = await fetch("/api/orders/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: [orderId, mergeTargetOrderId],
          leadingUserId: currentUser?.id ?? undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Błąd");
      setMergeDialogOpen(false);
      setMergeTargetOrderId(null);
      invalidateOrder();
    } catch (e) {
      setOpError(e instanceof Error ? e.message : "Błąd łączenia");
    } finally {
      setOpLoading(false);
    }
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Ładowanie zamówienia…</p>
      </div>
    );
  }

  const orderReady = orderData && orderData.id === orderId;
  if (!orderReady) {
    if (dexieChecked && apiFallbackOrder === null) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-destructive font-medium">Zamówienie nie istnieje</p>
          <Button variant="outline" onClick={() => router.push("/pos")}>
            Powrót do POS
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Ładowanie zamówienia…</p>
      </div>
    );
  }

  return (
    <>
      <OrderPageView
        orderNumber={orderData?.orderNumber ?? orderNumber ?? null}
        orderNumberLabel={
          localOrder?._syncStatus === "pending" && localOrder?.orderNumber
            ? `L-${localOrder.orderNumber}`
            : undefined
        }
        syncStatus={localOrder?._syncStatus}
        tableNumber={tableNumber}
        items={items}
        categoryStack={effectiveCategoryStack}
        childCategories={childCategories}
        rootCategories={rootCategories}
        breadcrumb={breadcrumb}
        searchQuery={searchQuery}
        filteredProducts={filteredProducts}
        modifierProduct={modifierProduct}
        editingNoteIndex={editingNoteIndex}
        noteInput={noteInput}
        onBack={handleBack}
        onCategoryClick={handleCategoryClick}
        onSearchChange={setSearchQuery}
        excludedAllergens={excludedAllergens}
        onAllergenToggle={(code) =>
          setExcludedAllergens((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
          )
        }
        onAllergenClear={() => setExcludedAllergens([])}
        popularProducts={popularProducts}
        recentProducts={recentProducts}
        favoriteProductIds={favoriteProductIds}
        onToggleFavorite={handleToggleFavorite}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavoritesView={handleToggleFavoritesView}
        allProducts={products}
        onProductClick={tryAddProduct}
        onSend={() => sendMutation.mutate()}
        sendError={sendMutation.isError ? String(sendMutation.error?.message) : null}
        onModifierSelectChange={(groupId, selected) =>
          setModifierProduct((prev) =>
            prev ? { ...prev, selected: { ...prev.selected, [groupId]: selected } } : null
          )
        }
        onModifierConfirm={confirmModifiers}
        onModifierClose={() => setModifierProduct(null)}
        onQuantity={updateQuantity}
        onNoteEdit={startEditNote}
        onNoteSave={saveNote}
        onNoteInputChange={setNoteInput}
        onRemoveItem={removeItem}
        onCloseBill={handleCloseBill}
        onCancelOrder={() => setCancelOrderConfirm(true)}
        onStornoItem={(itemId) => { setStornoItemId(itemId); setStornoReason(""); setOpError(null); }}
        onMoveOrder={() => { setMoveDialogOpen(true); setSelectedTableId(null); setOpError(null); }}
        onSplitOrder={() => { setSplitDialogOpen(true); setSplitSelectedIds([]); setOpError(null); }}
        onMergeOrder={() => { setMergeDialogOpen(true); setMergeTargetOrderId(null); setOpError(null); }}
        onMessageToKitchen={() => { setMessageToKitchenOpen(true); setMessageToKitchenText(""); }}
        isHotelOrder={isHotelOrder}
        hotelRoomNumber={hotelRoomNumber}
        hotelGuestName={hotelGuestName}
        hotelCheckOut={hotelCheckOut}
        onSendToRoom={handleSendToRoom}
        hotelChargeLoading={hotelChargeLoading}
        hotelChargeResult={hotelChargeResult}
        orderType={orderData?.type}
        courseReleasedUpTo={orderData?.courseReleasedUpTo ?? 1}
        onReleaseCourse={async (courseNumber) => {
          const res = await fetch(`/api/orders/${orderId}/release-course`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseNumber }),
          });
          if (res.ok) queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        }}
      />
      <SuggestionPopup
        productId={lastAddedProductId}
        onAdd={handleSuggestionAdd}
        onDismiss={() => setLastAddedProductId(null)}
      />
      {showReadyBanner && orderData?.status === "READY" && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border-2 border-green-600 bg-green-100 px-4 py-3 shadow-lg dark:bg-green-900/90 dark:text-green-100">
          <p className="font-semibold">
            Stolik {orderData?.tableNumber ?? orderId} — dania gotowe do odbioru!
          </p>
          <Button size="sm" variant="secondary" className="mt-2" onClick={() => setShowReadyBanner(false)}>
            OK
          </Button>
        </div>
      )}
      <Dialog open={messageToKitchenOpen} onOpenChange={setMessageToKitchenOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Wiadomość do kuchni</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Treść wiadomości (np. „Stolik 5 prosi o przyspieszenie”):</p>
          <Input
            placeholder="Wpisz wiadomość…"
            value={messageToKitchenText}
            onChange={(e) => setMessageToKitchenText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleMessageToKitchenSubmit())}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageToKitchenOpen(false)}>Anuluj</Button>
            <Button onClick={handleMessageToKitchenSubmit} disabled={!messageToKitchenText.trim() || messageToKitchenSending}>
              {messageToKitchenSending ? "…" : "Wyślij"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {paymentDialogOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
          <PaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            order={orderData ? {
              id: orderData.id,
              orderNumber: orderData.orderNumber,
              userId: orderData.userId,
              items: orderData.items
                .filter((i) => i.status !== "CANCELLED")
                .map((i) => ({
                  id: i.id,
                  productName: i.productName,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  taxRatePercent: i.taxRatePercent ?? 0,
                  taxRateSymbol: i.taxRateSymbol ?? "?",
                })),
              discountJson: orderData.discountJson,
            } : null}
            currentUserId={currentUser?.id ?? null}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["order", orderId] })}
          />
        </Suspense>
      )}

      <Dialog open={cancelOrderConfirm} onOpenChange={setCancelOrderConfirm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anulować zamówienie?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Zamówienie zostanie anulowane, stolik zwolniony.</p>
          {opError && <p className="text-sm text-destructive">{opError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOrderConfirm(false)}>Nie</Button>
            <Button variant="destructive" onClick={handleCancelOrder} disabled={opLoading}>{opLoading ? "…" : "Anuluj zamówienie"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeZeroDialogOpen} onOpenChange={(open) => { setCloseZeroDialogOpen(open); if (!open) setOpError(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Zamknij pusty rachunek</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Zamówienie ma wartość 0 zł. Czy chcesz zamknąć rachunek bez paragonu?
          </p>
          {localOrder?._syncStatus === "pending" && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ Zamówienie czeka na synchronizację z serwerem...
            </p>
          )}
          {opError && <p className="text-sm text-destructive">{opError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseZeroDialogOpen(false)}>Anuluj</Button>
            <Button 
              onClick={handleCloseZeroOrder} 
              disabled={opLoading || localOrder?._syncStatus === "pending"}
            >
              {opLoading ? "Zamykanie…" : "Zamknij rachunek"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!stornoItemId} onOpenChange={(o) => !o && setStornoItemId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Storno pozycji</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Podaj powód anulowania (obowiązkowe):</p>
          <Input
            placeholder="np. pomyłka kelnera, brak składników…"
            value={stornoReason}
            onChange={(e) => setStornoReason(e.target.value)}
          />
          {opError && <p className="text-sm text-destructive">{opError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStornoItemId(null)}>Rezygnuj</Button>
            <Button onClick={handleStornoSubmit} disabled={opLoading || !stornoReason.trim()}>{opLoading ? "…" : "Anuluj pozycję"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Przenieś zamówienie do stolika</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {rooms.map((room) => (
              <div key={room.id}>
                <p className="font-medium text-sm">{room.name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {room.tables?.map((t) => (
                    <Button
                      key={t.id}
                      variant={selectedTableId === t.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTableId(t.id)}
                    >
                      Stolik {t.number}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={mergeIfOccupied} onChange={(e) => setMergeIfOccupied(e.target.checked)} />
              <span className="text-sm">Połącz z zamówieniem, jeśli stolik zajęty</span>
            </label>
          </div>
          {opError && <p className="text-sm text-destructive">{opError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleMoveSubmit} disabled={!selectedTableId || opLoading}>{opLoading ? "…" : "Przenieś"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Podziel rachunek</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Zaznacz pozycje do nowego rachunku:</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {items.filter((i) => i.status !== "CANCELLED").map((line) => (
              <label key={line.id ?? line.productId} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={line.id ? splitSelectedIds.includes(line.id) : false}
                  disabled={!line.id}
                  onChange={(e) => {
                    if (!line.id) return;
                    setSplitSelectedIds((prev) =>
                      e.target.checked ? [...prev, line.id!] : prev.filter((id) => id !== line.id)
                    );
                  }}
                />
                <span className="text-sm">{line.productName} × {line.quantity}</span>
              </label>
            ))}
          </div>
          {opError && <p className="text-sm text-destructive">{opError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleSplitSubmit} disabled={splitSelectedIds.length === 0 || opLoading}>{opLoading ? "…" : "Utwórz nowy rachunek"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Połącz z zamówieniem</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Wybierz zamówienie do połączenia (pozycje trafią do bieżącego):</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {openOrders.filter((o) => o.id !== orderId).map((o) => (
              <Button
                key={o.id}
                variant={mergeTargetOrderId === o.id ? "default" : "outline"}
                className="w-full justify-start gap-2"
                size="sm"
                onClick={() => setMergeTargetOrderId(o.id)}
              >
                <OrderSyncBadge syncStatus={o.syncStatus ?? "pending"} className="shrink-0" />
                #{o.orderNumber} · Stolik {o.tableNumber ?? "?"} · {o.userName}
              </Button>
            ))}
          </div>
          {opError && <p className="text-sm text-destructive">{opError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleMergeSubmit} disabled={!mergeTargetOrderId || opLoading}>{opLoading ? "…" : "Połącz"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
