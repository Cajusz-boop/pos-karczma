"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrderStore, type OrderItemLine } from "@/store/useOrderStore";
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
import { PaymentDialog } from "./PaymentDialog";
import { SuggestionPopup, type SuggestionProduct } from "@/components/pos/SuggestionPopup";
import type { CategoryNode } from "./orderPageTypes";

type ProductRow = import("./orderPageTypes").ProductRow;

type ProductsResponse = {
  categories: CategoryNode[];
  products: ProductRow[];
};

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

type RoomWithTables = {
  id: string;
  name: string;
  tables: { id: string; number: number; status: string }[];
};

type OpenOrderRow = { id: string; orderNumber: number; tableId: string | null; tableNumber: number | null; userName: string };

export function OrderPageClient({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { orderNumber, tableNumber, items, setOrder, addItem, updateQuantity, updateNote, removeItem } =
    useOrderStore();

  const [categoryStack, setCategoryStack] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [recentProductIds, setRecentProductIds] = useState<string[]>([]);
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
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
  const prevOrderStatusRef = useRef<string | null>(null);
  const currentUser = useAuthStore((s) => s.currentUser);

  const { data: rooms = [] } = useQuery<RoomWithTables[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("Błąd sal");
      return res.json();
    },
  });
  const { data: openOrders = [] } = useQuery<OpenOrderRow[]>({
    queryKey: ["orders", "open"],
    queryFn: async () => {
      const res = await fetch("/api/orders?status=open");
      if (!res.ok) throw new Error("Błąd listy");
      return res.json();
    },
    enabled: mergeDialogOpen,
  });

  const { data: orderData, isLoading: orderLoading } = useQuery<OrderResponse>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Błąd zamówienia");
      return res.json();
    },
    enabled: !!orderId,
    refetchInterval: 5000,
  });

  const { data: productsData } = useQuery<ProductsResponse>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Błąd produktów");
      return res.json();
    },
  });

  const { data: popularProducts = [] } = useQuery<Array<{ id: string; name: string; priceGross: number; taxRateId: string; color: string | null; categoryName: string; orderCount: number }>>({
    queryKey: ["popular-products"],
    queryFn: async () => {
      const res = await fetch("/api/products/popular?limit=8&days=7");
      if (!res.ok) return [];
      return res.json();
    },
  });

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
    if (orderData && orderData.id === orderId) {
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
      setOrder(orderId, orderData.orderNumber, orderData.tableNumber ?? null, lines);
    }
  }, [orderId, orderData, setOrder]);

  const categories = useMemo(() => productsData?.categories ?? [], [productsData?.categories]);
  const products = useMemo(() => productsData?.products ?? [], [productsData?.products]);
  const currentCategoryId = categoryStack[categoryStack.length - 1] ?? null;
  const childCategories = useMemo(
    () => getDirectChildren(categories, currentCategoryId),
    [categories, currentCategoryId]
  );
  const breadcrumb = currentCategoryId ? getBreadcrumb(categories, currentCategoryId) : [];

  const recentProducts = useMemo(() => {
    return recentProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as ProductRow[];
  }, [recentProductIds, products]);

  const showProductsHere = currentCategoryId && childCategories.length === 0;
  const filteredProducts = useMemo(() => {
    const allergenFilter = (p: ProductRow) => {
      if (excludedAllergens.length === 0) return true;
      return !p.allergens.some((a) => excludedAllergens.includes(a.code));
    };

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return [...products]
        .filter(
          (p) =>
            (p.name.toLowerCase().includes(q) ||
            (p.nameShort && p.nameShort.toLowerCase().includes(q))) &&
            allergenFilter(p)
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    if (!showProductsHere) return [];
    return [...products]
      .filter((p) => p.categoryId === currentCategoryId && allergenFilter(p))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [products, currentCategoryId, showProductsHere, searchQuery, excludedAllergens]);

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
    if (cat.children && cat.children.length > 0) {
      setCategoryStack((s) => [...s, cat.id]);
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
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Ładowanie zamówienia…</p>
      </div>
    );
  }

  return (
    <>
      <OrderPageView
        orderNumber={orderNumber}
        tableNumber={tableNumber}
        items={items}
        categoryStack={categoryStack}
        childCategories={childCategories}
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
        onCloseBill={() => setPaymentDialogOpen(true)}
        onCancelOrder={() => setCancelOrderConfirm(true)}
        onStornoItem={(itemId) => { setStornoItemId(itemId); setStornoReason(""); setOpError(null); }}
        onMoveOrder={() => { setMoveDialogOpen(true); setSelectedTableId(null); setOpError(null); }}
        onSplitOrder={() => { setSplitDialogOpen(true); setSplitSelectedIds([]); setOpError(null); }}
        onMergeOrder={() => { setMergeDialogOpen(true); setMergeTargetOrderId(null); setOpError(null); }}
        onMessageToKitchen={() => { setMessageToKitchenOpen(true); setMessageToKitchenText(""); }}
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
                className="w-full justify-start"
                size="sm"
                onClick={() => setMergeTargetOrderId(o.id)}
              >
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
