"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  Search,
  Send,
  X,
  Minus,
  Plus,
  StickyNote,
  Trash2,
  CreditCard,
  ArrowRightLeft,
  Split,
  Merge,
  Ban,
  ChefHat,
  ShoppingCart,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { OrderSyncBadge } from "@/components/OrderSyncBadge";
import { AllergenFilter } from "@/components/pos/AllergenFilter";
import type { OrderItemLine } from "@/store/useOrderStore";
import type { CategoryNode, ProductRow } from "./orderPageTypes";

export interface OrderPageViewProps {
  orderNumber: number | null;
  orderNumberLabel?: string;
  syncStatus?: string;
  tableNumber: number | null;
  items: OrderItemLine[];
  categoryStack: string[];
  childCategories: CategoryNode[];
  rootCategories: CategoryNode[];
  breadcrumb: CategoryNode[];
  searchQuery: string;
  filteredProducts: ProductRow[];
  modifierProduct: {
    product: ProductRow;
    selected: Record<string, string[]>;
  } | null;
  editingNoteIndex: number | null;
  noteInput: string;
  onBack: () => void;
  onCategoryClick: (cat: CategoryNode) => void;
  onSearchChange: (q: string) => void;
  excludedAllergens?: string[];
  onAllergenToggle?: (code: string) => void;
  onAllergenClear?: () => void;
  popularProducts?: Array<{ id: string; name: string; priceGross: number; taxRateId: string; color: string | null; categoryName: string; orderCount: number }>;
  recentProducts?: ProductRow[];
  favoriteProductIds?: string[];
  onToggleFavorite?: (productId: string) => void;
  showFavoritesOnly?: boolean;
  onToggleFavoritesView?: () => void;
  allProducts?: ProductRow[];
  onProductClick: (p: ProductRow) => void;
  onProductLongPress?: (p: ProductRow, quantity: number) => void;
  onSend: () => void;
  sendError: string | null;
  onModifierSelectChange: (groupId: string, selected: string[]) => void;
  onModifierConfirm: () => void;
  onModifierClose: () => void;
  onQuantity: (index: number, delta: number) => void;
  onNoteEdit: (index: number) => void;
  onNoteSave: () => void;
  onNoteInputChange: (v: string) => void;
  onRemoveItem: (index: number) => void;
  onCloseBill: () => void;
  onCancelOrder: () => void;
  onStornoItem: (itemId: string) => void;
  onMoveOrder: () => void;
  onSplitOrder: () => void;
  onMergeOrder: () => void;
  onMessageToKitchen?: () => void;
  orderType?: string;
  courseReleasedUpTo?: number;
  onReleaseCourse?: (courseNumber: number) => void;
}

const CATEGORY_COLORS = [
  "from-orange-500 to-orange-600",
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-amber-500 to-amber-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
  "from-pink-500 to-pink-600",
];

export function OrderPageView(props: OrderPageViewProps) {
  const {
    orderNumber,
    orderNumberLabel,
    syncStatus,
    tableNumber,
    items,
    categoryStack,
    childCategories,
    rootCategories,
    breadcrumb,
    searchQuery,
    filteredProducts,
    modifierProduct,
    editingNoteIndex,
    noteInput,
    onBack,
    onCategoryClick,
    onSearchChange,
    excludedAllergens = [],
    onAllergenToggle,
    onAllergenClear,
    popularProducts = [],
    recentProducts = [],
    favoriteProductIds = [],
    onToggleFavorite,
    showFavoritesOnly = false,
    onToggleFavoritesView,
    allProducts = [],
    onProductClick,
    onProductLongPress,
    onSend,
    sendError,
    onModifierSelectChange,
    onModifierConfirm,
    onModifierClose,
    onQuantity,
    onNoteEdit,
    onNoteSave,
    onNoteInputChange,
    onRemoveItem,
    onCloseBill,
    onCancelOrder,
    onStornoItem,
    onMoveOrder,
    onSplitOrder,
    onMergeOrder,
    onMessageToKitchen,
    orderType,
    courseReleasedUpTo = 1,
    onReleaseCourse,
  } = props;

  const [mobileReceiptOpen, setMobileReceiptOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [qtyPopup, setQtyPopup] = useState<{ product: ProductRow; x: number; y: number } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search suggestions - show top 8 matching products
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return allProducts
      .filter(p => p.isAvailable && (
        p.name.toLowerCase().includes(q) ||
        (p.nameShort && p.nameShort.toLowerCase().includes(q))
      ))
      .slice(0, 8);
  }, [searchQuery, allProducts]);

  // Favorite products
  const favoriteProducts = useMemo(() => {
    return allProducts.filter(p => favoriteProductIds.includes(p.id) && p.isAvailable);
  }, [allProducts, favoriteProductIds]);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="bg-yellow-200 dark:bg-yellow-800 font-semibold">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  // Default emojis for categories
  const getCategoryEmoji = (name: string, icon: string | null) => {
    if (icon) return icon;
    const n = name.toLowerCase();
    if (n.includes("przystaw")) return "🥗";
    if (n.includes("zup")) return "🍲";
    if (n.includes("dani") || n.includes("główn")) return "🍽️";
    if (n.includes("mięs")) return "🥩";
    if (n.includes("ryb")) return "🐟";
    if (n.includes("wege")) return "🥬";
    if (n.includes("deser")) return "🍰";
    if (n.includes("gorąc") || n.includes("kaw") || n.includes("herb")) return "☕";
    if (n.includes("zimn") || n.includes("sok")) return "🧃";
    if (n.includes("piw")) return "🍺";
    if (n.includes("win")) return "🍷";
    if (n.includes("alkoh") || n.includes("mocn") || n.includes("wódk")) return "🥃";
    return null;
  };

  const handleProductPointerDown = useCallback((e: React.PointerEvent, product: ProductRow) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    longPressTimerRef.current = setTimeout(() => {
      setQtyPopup({
        product,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }, 500);
  }, []);

  const handleProductPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleQtySelect = useCallback((qty: number) => {
    if (!qtyPopup) return;
    if (onProductLongPress) {
      onProductLongPress(qtyPopup.product, qty);
    } else {
      for (let i = 0; i < qty; i++) {
        onProductClick(qtyPopup.product);
      }
    }
    setQtyPopup(null);
  }, [qtyPopup, onProductClick, onProductLongPress]);

  const activeItems = items.filter((i) => i.status !== "CANCELLED");
  const subtotal = activeItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const newItemsCount = items.filter((i) => i.status === "ORDERED").length;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      {/* ============================================================ */}
      {/* LEFT PANEL: Receipt / Order items (35% on desktop, slide-up on mobile) */}
      {/* ============================================================ */}
      <div
        className={cn(
          "flex flex-col border-r bg-card",
          "fixed inset-x-0 bottom-0 z-40 max-h-[85vh] rounded-t-2xl border-t shadow-2xl transition-transform duration-300 md:static md:z-auto md:max-h-none md:w-[35%] md:rounded-none md:border-t-0 md:shadow-none lg:w-[32%]",
          mobileReceiptOpen ? "translate-y-0" : "translate-y-[calc(100%-3.5rem)] md:translate-y-0"
        )}
      >
        {/* Mobile pull handle */}
        <button
          type="button"
          className="flex items-center justify-center py-2 md:hidden"
          onClick={() => setMobileReceiptOpen(!mobileReceiptOpen)}
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </button>

        {/* Receipt header */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Link href="/pos" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              {tableNumber != null && (
                <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                  Stolik {tableNumber}
                </span>
              )}
              <OrderSyncBadge syncStatus={syncStatus ?? "synced"} className="shrink-0" />
              <span className="text-muted-foreground">#{orderNumberLabel ?? orderNumber ?? "-"}</span>
            </div>
          </div>
          {/* Mobile: show total as tap target */}
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground md:hidden"
            onClick={() => setMobileReceiptOpen(!mobileReceiptOpen)}
          >
            <ShoppingCart className="h-4 w-4" />
            {subtotal.toFixed(2)} zł
            {activeItems.length > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px]">
                {activeItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Items list */}
        <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {items.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              Dodaj produkty z menu
            </li>
          )}
          {items.map((line, idx) => (
            <li
              key={line.id ?? `${line.productId}-${idx}`}
              className={cn(
                "group flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted/50",
                line.status === "SENT" && "bg-muted/30",
                line.status === "CANCELLED" && "opacity-40 line-through"
              )}
            >
              <div
                className={cn(
                  "min-w-0 flex-1",
                  line.status !== "SENT" && line.status !== "CANCELLED" && "cursor-pointer"
                )}
                onClick={() => {
                  if (line.status !== "SENT" && line.status !== "CANCELLED") {
                    onQuantity(idx, 1);
                  }
                }}
                title={line.status !== "SENT" && line.status !== "CANCELLED" ? "Kliknij aby dodać +1" : undefined}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-medium leading-tight">{line.productName}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {(line.quantity * line.unitPrice).toFixed(2)} zł
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{line.quantity} × {line.unitPrice.toFixed(2)}</span>
                  {line.courseNumber > 1 && <span>Kurs {line.courseNumber}</span>}
                </div>
                {line.modifiersJson?.length ? (
                  <div className="text-[11px] text-muted-foreground">
                    + {(line.modifiersJson as Array<{ name: string }>).map((m) => m.name).join(", ")}
                  </div>
                ) : null}
                {editingNoteIndex === idx ? (
                  <div className="mt-1 flex gap-1">
                    <Input
                      value={noteInput}
                      onChange={(e) => onNoteInputChange(e.target.value)}
                      onBlur={onNoteSave}
                      onKeyDown={(e) => e.key === "Enter" && onNoteSave()}
                      placeholder="Notatka…"
                      className="h-7 text-xs"
                      autoFocus
                    />
                  </div>
                ) : line.note ? (
                  <button
                    type="button"
                    onClick={() => onNoteEdit(idx)}
                    className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400"
                  >
                    <StickyNote className="h-3 w-3" />
                    {line.note}
                  </button>
                ) : null}
                {line.status === "SENT" && (
                  <span className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Wysłane
                  </span>
                )}
              </div>

              {/* Quantity controls */}
              <div className="flex shrink-0 items-center gap-0.5">
                {line.status === "ORDERED" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onQuantity(idx, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border bg-background text-sm hover:bg-muted"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuantity(idx, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border bg-background text-sm hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    {!line.note && (
                      <button
                        type="button"
                        onClick={() => onNoteEdit(idx)}
                        className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                      >
                        <StickyNote className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-md text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
                {line.id && (line.status === "ORDERED" || line.status === "SENT") && (
                  <button
                    type="button"
                    className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-destructive hover:bg-destructive/10"
                    onClick={() => onStornoItem(line.id!)}
                  >
                    Storno
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Receipt footer: totals + actions */}
        <div className="border-t bg-card px-3 py-2">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-medium text-muted-foreground">Suma</span>
            <span className="text-xl font-bold tabular-nums">{subtotal.toFixed(2)} zł</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Button
              className="w-full gap-2"
              size="lg"
              disabled={newItemsCount === 0}
              onClick={onSend}
            >
              <Send className="h-4 w-4" />
              Wyślij do kuchni
              {newItemsCount > 0 && (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                  {newItemsCount}
                </span>
              )}
            </Button>

            {orderType === "BANQUET" && onReleaseCourse && (
              <Button
                variant="outline"
                className="w-full border-amber-500 text-amber-700 dark:text-amber-400"
                onClick={() => onReleaseCourse(courseReleasedUpTo + 1)}
              >
                Wydaj kurs {courseReleasedUpTo + 1}
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onCloseBill}
            >
              <CreditCard className="h-4 w-4" />
              Zamknij rachunek
            </Button>

            {/* Operations row */}
            <div className="flex flex-wrap gap-1">
              {onMessageToKitchen && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={onMessageToKitchen}>
                  <MessageSquare className="h-3 w-3" />
                  Kuchnia
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => setActionsOpen(true)}>
                Więcej…
              </Button>
            </div>
          </div>

          {sendError && <p className="mt-1 text-xs text-destructive">{sendError}</p>}
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT PANEL: Categories + Products (65% on desktop, full on mobile) */}
      {/* ============================================================ */}
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Search + breadcrumb bar */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {categoryStack.length > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {breadcrumb.length > 0 && (
            <nav className="hidden items-center gap-0.5 text-xs text-muted-foreground sm:flex">
              {breadcrumb.map((b, i) => (
                <span key={b.id} className="flex items-center gap-0.5">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  <span className="font-medium text-foreground">{b.name}</span>
                </span>
              ))}
            </nav>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              ref={searchInputRef}
              placeholder="🔍 Szukaj produktu…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="h-9 pl-8 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { onSearchChange(""); searchInputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {/* Search suggestions dropdown */}
            {searchFocused && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border bg-card shadow-xl">
                {searchSuggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onProductClick(p);
                      onSearchChange("");
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {highlightMatch(p.name, searchQuery)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.category?.name}
                      </div>
                    </div>
                    <div className="font-bold text-primary tabular-nums">
                      {p.priceGross.toFixed(2)} zł
                    </div>
                    {onToggleFavorite && (
                      <button
                        type="button"
                        className="p-1 hover:bg-muted rounded"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleFavorite(p.id);
                        }}
                      >
                        <Star className={cn(
                          "h-4 w-4",
                          favoriteProductIds.includes(p.id) 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-muted-foreground"
                        )} />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {onAllergenToggle && onAllergenClear && (
            <AllergenFilter
              selectedAllergens={excludedAllergens}
              onToggle={onAllergenToggle}
              onClear={onAllergenClear}
            />
          )}
        </div>

        {/* Recent products bar */}
        {!searchQuery && recentProducts.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-b px-3 py-1.5 scrollbar-hide">
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ostatnie:</span>
            {recentProducts.map((rp) => (
              <button
                key={rp.id}
                type="button"
                onClick={() => onProductClick(rp)}
                className="shrink-0 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
              >
                {rp.name} <span className="text-muted-foreground ml-0.5">{rp.priceGross.toFixed(0)}zł</span>
              </button>
            ))}
          </div>
        )}

        {/* Popular products - TOP 8 */}
        {!searchQuery && categoryStack.length === 0 && popularProducts.length > 0 && (
          <div className="border-b px-3 py-2">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              Popularne
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8">
              {popularProducts.map((pp) => (
                  <button
                    key={pp.id}
                    type="button"
                    onClick={() => {
                      onProductClick({
                        id: pp.id,
                        name: pp.name,
                        nameShort: null,
                        categoryId: "",
                        category: { id: "", name: pp.categoryName, parentId: null, color: null, icon: null },
                        priceGross: pp.priceGross,
                        taxRateId: pp.taxRateId,
                        taxRate: { id: pp.taxRateId, fiscalSymbol: "" },
                        isAvailable: true,
                        color: pp.color,
                        sortOrder: 0,
                        modifierGroups: [],
                        allergens: [],
                      });
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-all active:scale-95 hover:bg-muted/50",
                      "min-h-[60px]"
                    )}
                    style={pp.color ? { borderColor: pp.color, borderWidth: 2 } : undefined}
                  >
                    <span className="text-xs font-medium leading-tight line-clamp-2">{pp.name}</span>
                    <span className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                      {pp.priceGross.toFixed(2)} zł
                    </span>
                  </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories - tabs style (horizontal scrollable) */}
        {/* Always show root categories for easy navigation */}
        {!searchQuery && rootCategories.length > 0 && (
          <div className="border-b">
            <div className="flex overflow-x-auto px-2 py-1.5 gap-1 scrollbar-hide">
              {/* Favorites tab */}
              {onToggleFavoritesView && favoriteProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={onToggleFavoritesView}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-all active:scale-95",
                    showFavoritesOnly
                      ? "bg-yellow-500 text-white shadow-md ring-2 ring-yellow-300"
                      : "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 shadow-sm hover:shadow-md hover:bg-yellow-200",
                  )}
                >
                  <Star className={cn("inline h-4 w-4 mr-1", showFavoritesOnly && "fill-white")} />
                  Ulubione ({favoriteProductIds.length})
                </button>
              )}
              {rootCategories.map((cat, i) => {
                const gradient = cat.color
                  ? undefined
                  : CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                const isActive = !showFavoritesOnly && categoryStack.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryClick(cat)}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-all active:scale-95",
                      isActive
                        ? "text-white shadow-md ring-2 ring-white/50"
                        : "text-white/90 shadow-sm hover:shadow-md",
                      gradient && `bg-gradient-to-br ${gradient}`,
                    )}
                    style={cat.color ? { backgroundColor: cat.color } : undefined}
                  >
                    {getCategoryEmoji(cat.name, cat.icon) && (
                      <span className="mr-1">{getCategoryEmoji(cat.name, cat.icon)}</span>
                    )}
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Show subcategories if current category has children */}
        {!searchQuery && childCategories.length > 0 && categoryStack.length > 0 && (
          <div className="border-b bg-muted/30">
            <div className="flex overflow-x-auto px-2 py-1 gap-1 scrollbar-hide">
              {childCategories.map((cat) => {
                const isActive = categoryStack[categoryStack.length - 1] === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryClick(cat)}
                    className={cn(
                      "shrink-0 rounded px-2.5 py-1 text-xs font-medium transition-all active:scale-95",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={!p.isAvailable}
                onClick={() => { if (!qtyPopup) onProductClick(p); }}
                onPointerDown={(e) => handleProductPointerDown(e, p)}
                onPointerUp={handleProductPointerUp}
                onPointerLeave={handleProductPointerUp}
                onContextMenu={(e) => e.preventDefault()}
                className={cn(
                  "flex flex-col rounded-xl border-2 bg-card p-2.5 text-left shadow-sm transition-all active:scale-95 sm:p-3",
                  p.isAvailable
                    ? "border-border hover:border-primary/50 hover:shadow-md"
                    : "border-muted opacity-50",
                  p.color && "border-l-4"
                )}
                style={p.color ? { borderLeftColor: p.color } : undefined}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm font-semibold leading-tight sm:text-base">
                    {p.name}
                  </span>
                  {onToggleFavorite && (
                    <button
                      type="button"
                      className="shrink-0 p-0.5 -mr-1 -mt-1 hover:bg-muted/50 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(p.id);
                      }}
                    >
                      <Star className={cn(
                        "h-4 w-4 transition-colors",
                        favoriteProductIds.includes(p.id) 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground/50 hover:text-yellow-400"
                      )} />
                    </button>
                  )}
                </div>
                <span className="mt-1 text-base font-bold tabular-nums text-primary sm:text-lg">
                  {p.priceGross.toFixed(2)} zł
                </span>
                {p.allergens?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.allergens.slice(0, 5).map((a) => (
                      <span
                        key={a.code}
                        className="inline-flex h-5 items-center rounded bg-muted px-1 text-[9px] font-medium text-muted-foreground"
                        title={a.name}
                      >
                        {a.icon || a.code}
                      </span>
                    ))}
                  </div>
                )}
                {!p.isAvailable && (
                  <span className="mt-1 text-[10px] font-medium uppercase text-destructive">
                    Niedostępne
                  </span>
                )}
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && !searchQuery && showFavoritesOnly && (
            <div className="py-12 text-center text-muted-foreground">
              <Star className="mx-auto h-12 w-12 text-yellow-300 mb-2" />
              <p>Brak ulubionych produktów</p>
              <p className="text-xs mt-1">Kliknij gwiazdkę ⭐ przy produkcie, aby dodać go do ulubionych</p>
            </div>
          )}
          {filteredProducts.length === 0 && !searchQuery && !showFavoritesOnly && categoryStack.length > 0 && (
            <div className="py-12 text-center text-muted-foreground">
              Brak produktów w tej kategorii
            </div>
          )}
          {filteredProducts.length === 0 && !searchQuery && !showFavoritesOnly && categoryStack.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              Wybierz kategorię aby zobaczyć produkty
            </div>
          )}
          {filteredProducts.length === 0 && searchQuery && (
            <div className="py-12 text-center text-muted-foreground">
              Nie znaleziono: &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Modifier selection dialog */}
      <Dialog open={!!modifierProduct} onOpenChange={(open) => !open && onModifierClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modifierProduct?.product.name}</DialogTitle>
          </DialogHeader>
          {modifierProduct
            ? modifierProduct.product.modifierGroups
                .filter((g) => g.isRequired)
                .map((group) => {
                  const selected = modifierProduct.selected[group.modifierGroupId] ?? [];
                  const setSelected = (next: string[]) => {
                    onModifierSelectChange(group.modifierGroupId, next);
                  };
                  return (
                    <div key={group.modifierGroupId} className="space-y-2">
                      <p className="text-sm font-semibold">
                        {group.name} {group.isRequired ? "*" : ""}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          {group.maxSelect === 1
                            ? "(wybierz 1)"
                            : `(min ${group.minSelect}, max ${group.maxSelect})`}
                        </span>
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {group.modifiers.map((m) => {
                          const isSelected = selected.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                if (group.maxSelect === 1) {
                                  setSelected([m.id]);
                                } else {
                                  setSelected(
                                    isSelected
                                      ? selected.filter((x) => x !== m.id)
                                      : selected.length < group.maxSelect
                                        ? [...selected, m.id]
                                        : selected
                                  );
                                }
                              }}
                              className={cn(
                                "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/10 font-medium"
                                  : "border-border hover:bg-muted/50"
                              )}
                            >
                              <span>{m.name}</span>
                              {m.priceDelta !== 0 && (
                                <span className="text-muted-foreground">
                                  {m.priceDelta > 0 ? "+" : ""}{m.priceDelta.toFixed(2)} zł
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            : null}
          <DialogFooter>
            <Button variant="outline" onClick={onModifierClose}>
              Anuluj
            </Button>
            <Button onClick={onModifierConfirm}>Dodaj do zamówienia</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* More actions dialog */}
      <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Operacje</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-16 flex-col gap-1 text-xs" onClick={() => { setActionsOpen(false); onMoveOrder(); }}>
              <ArrowRightLeft className="h-5 w-5" />
              Przenieś stolik
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1 text-xs" onClick={() => { setActionsOpen(false); onSplitOrder(); }}>
              <Split className="h-5 w-5" />
              Podziel rachunek
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-1 text-xs" onClick={() => { setActionsOpen(false); onMergeOrder(); }}>
              <Merge className="h-5 w-5" />
              Połącz zamówienia
            </Button>
            <Button variant="destructive" className="h-16 flex-col gap-1 text-xs" onClick={() => { setActionsOpen(false); onCancelOrder(); }}>
              <Ban className="h-5 w-5" />
              Anuluj zamówienie
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quantity popup (long press) */}
      {qtyPopup && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setQtyPopup(null)}
          />
          <div
            className="fixed z-50 animate-in fade-in-0 zoom-in-95 rounded-xl border bg-card p-3 shadow-xl"
            style={{
              left: Math.min(qtyPopup.x - 120, window.innerWidth - 260),
              top: Math.max(qtyPopup.y - 160, 10),
            }}
          >
            <p className="mb-2 text-center text-sm font-semibold">
              {qtyPopup.product.name}
            </p>
            <p className="mb-2 text-center text-xs text-muted-foreground">Ile sztuk?</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleQtySelect(n)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border bg-background text-lg font-bold transition-colors hover:bg-primary hover:text-primary-foreground active:scale-95"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
