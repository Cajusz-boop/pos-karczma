"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
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
import {
  Star,
  Plus,
  Search,
  RefreshCw,
  ArrowLeft,
  Trophy,
  Gift,
  Percent,
  Ban,
} from "lucide-react";
import Link from "next/link";

interface LoyaltyCustomer {
  id: string;
  phone: string;
  name: string | null;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  rewardType: string;
  rewardValue: number;
  productId: string | null;
  isActive: boolean;
}

export default function LoyaltyPage() {
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer lookup
  const [searchPhone, setSearchPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);

  // Create reward dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [newType, setNewType] = useState("FREE_PRODUCT");
  const [newValue, setNewValue] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/loyalty/rewards");
      const data = await res.json();
      setRewards((data.rewards ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        rewardValue: Number(r.rewardValue),
      })));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleSearch = async () => {
    if (!searchPhone.trim()) return;
    setSearching(true);
    setCustomer(null);
    try {
      const res = await fetch(`/api/loyalty?phone=${encodeURIComponent(searchPhone.trim())}`);
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
        setTransactions(data.transactions ?? []);
        setAvailableRewards(data.availableRewards ?? []);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const handleCreateReward = async () => {
    const pointsCost = parseInt(newPoints);
    if (!newName.trim() || isNaN(pointsCost) || pointsCost <= 0) return;
    setCreating(true);
    try {
      await fetch("/api/loyalty/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          pointsCost,
          rewardType: newType,
          rewardValue: parseFloat(newValue) || 0,
        }),
      });
      setCreateOpen(false);
      setNewName("");
      setNewPoints("");
      setNewValue("");
      fetchRewards();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const toggleReward = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/loyalty/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      fetchRewards();
    } catch {
      // ignore
    }
  };

  const rewardTypeLabel = (type: string) => {
    switch (type) {
      case "FREE_PRODUCT": return "Darmowy produkt";
      case "DISCOUNT_PERCENT": return "Rabat %";
      case "DISCOUNT_AMOUNT": return "Rabat kwotowy";
      default: return type;
    }
  };

  const rewardTypeIcon = (type: string) => {
    switch (type) {
      case "FREE_PRODUCT": return <Gift className="h-4 w-4" />;
      case "DISCOUNT_PERCENT": return <Percent className="h-4 w-4" />;
      case "DISCOUNT_AMOUNT": return <Star className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Star className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Program lojalnościowy</h1>
            <p className="text-sm text-muted-foreground">
              1 zł = 1 punkt • Nagrody za punkty
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRewards} disabled={loading}>
          <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          Odśwież
        </Button>
      </div>

      {/* Customer lookup */}
      <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-semibold">Sprawdź punkty klienta</p>
        <div className="flex gap-2">
          <Input
            placeholder="Numer telefonu klienta"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            type="tel"
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          />
          <Button onClick={handleSearch} disabled={searching || !searchPhone.trim()}>
            <Search className="mr-1.5 h-4 w-4" />
            Szukaj
          </Button>
        </div>

        {customer && (
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{customer.name || customer.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {customer.visitCount} wizyt • Wydano łącznie: {customer.totalSpent.toFixed(2)} zł
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black tabular-nums text-yellow-600">
                  {customer.loyaltyPoints}
                </p>
                <p className="text-xs text-muted-foreground">punktów</p>
              </div>
            </div>

            {availableRewards.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-emerald-600">Dostępne nagrody:</p>
                {availableRewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded bg-emerald-50 px-2 py-1 text-sm dark:bg-emerald-950/20">
                    <span className="flex items-center gap-1.5">
                      {rewardTypeIcon(r.rewardType)}
                      {r.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.pointsCost} pkt</span>
                  </div>
                ))}
              </div>
            )}

            {transactions.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                  Historia ({transactions.length})
                </summary>
                <div className="mt-2 space-y-1">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("pl-PL")} — {t.description}
                      </span>
                      <span className={cn(
                        "font-mono font-bold",
                        t.points > 0 ? "text-emerald-600" : "text-red-600"
                      )}>
                        {t.points > 0 ? "+" : ""}{t.points}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Rewards configuration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nagrody</h2>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowa nagroda
          </Button>
        </div>

        {rewards.length === 0 && !loading && (
          <div className="py-8 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">Brak nagród</p>
            <p className="text-sm text-muted-foreground">Dodaj pierwszą nagrodę</p>
          </div>
        )}

        <div className="space-y-2">
          {rewards.map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                !r.isActive && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30">
                  {rewardTypeIcon(r.rewardType)}
                </div>
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rewardTypeLabel(r.rewardType)}
                    {r.rewardValue > 0 && ` — ${r.rewardValue}`}
                    {r.rewardType === "DISCOUNT_PERCENT" && "%"}
                    {r.rewardType === "DISCOUNT_AMOUNT" && " zł"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold tabular-nums text-yellow-600">{r.pointsCost} pkt</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleReward(r.id, r.isActive)}
                  title={r.isActive ? "Dezaktywuj" : "Aktywuj"}
                >
                  <Ban className={cn("h-4 w-4", r.isActive ? "text-destructive" : "text-emerald-600")} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create reward dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Nowa nagroda lojalnościowa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa nagrody *</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="np. Kawa gratis"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Koszt (punkty) *</label>
              <Input
                type="number"
                min="1"
                value={newPoints}
                onChange={(e) => setNewPoints(e.target.value)}
                placeholder="np. 100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Typ nagrody</label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="FREE_PRODUCT">Darmowy produkt</option>
                <option value="DISCOUNT_PERCENT">Rabat procentowy</option>
                <option value="DISCOUNT_AMOUNT">Rabat kwotowy</option>
              </select>
            </div>
            {newType !== "FREE_PRODUCT" && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Wartość {newType === "DISCOUNT_PERCENT" ? "(%)" : "(zł)"}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={newType === "DISCOUNT_PERCENT" ? "np. 10" : "np. 20.00"}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Anuluj</Button>
            <Button onClick={handleCreateReward} disabled={creating || !newName.trim() || !newPoints.trim()}>
              {creating ? "Tworzenie…" : "Utwórz nagrodę"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
