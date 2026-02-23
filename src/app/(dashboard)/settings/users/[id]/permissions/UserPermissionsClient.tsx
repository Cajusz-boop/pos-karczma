"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Copy, RefreshCw } from "lucide-react";
import Link from "next/link";

type PermissionsData = {
  access?: { pos?: boolean; kds?: boolean; reports?: boolean; settings?: boolean; delivery?: boolean };
  hall?: { viewOtherOrders?: boolean; moveOrders?: boolean; joinTables?: boolean; splitOrders?: boolean };
  operations?: { discount?: boolean; discountMax?: number; freeItem?: boolean; cancelItem?: boolean; cancelOrder?: boolean; editSentItem?: boolean; reprintKitchen?: boolean };
  prohibitions?: { noQuantityChange?: boolean; noPriceChange?: boolean; noNoteAdd?: boolean; noModifierChange?: boolean };
  reports?: { dailySales?: boolean; cashReport?: boolean; itemReport?: boolean; staffReport?: boolean; deliveryReport?: boolean };
  receipt?: { openCashDrawer?: boolean; payout?: boolean; refund?: boolean; printReceipt?: boolean; emailReceipt?: boolean };
  order?: { createOrder?: boolean; addItems?: boolean; removeItems?: boolean; changeQuantity?: boolean; applyCoupon?: boolean };
  delivery?: { createDelivery?: boolean; assignDriver?: boolean; changeStatus?: boolean; editAddress?: boolean };
  config?: { editProducts?: boolean; editCategories?: boolean; editTables?: boolean; editUsers?: boolean; editPrinters?: boolean };
};

type UserPermissions = {
  user: { id: string; name: string; autoLogoutSec: number | null; allowedCategoryIds: string[]; allowedTableIds: string[]; allowedPriceLevelIds: string[]; permissionsJson: PermissionsData | null };
  role: { id: string; name: string };
  effectivePermissions: PermissionsData;
};

const PERMISSION_LABELS: Record<string, Record<string, string>> = {
  access: { pos: "Dostęp do POS", kds: "Dostęp do KDS", reports: "Dostęp do raportów", settings: "Dostęp do ustawień", delivery: "Dostęp do dostaw" },
  hall: { viewOtherOrders: "Podgląd innych zamówień", moveOrders: "Przenoszenie zamówień", joinTables: "Łączenie stolików", splitOrders: "Dzielenie rachunków" },
  operations: { discount: "Udzielanie rabatów", discountMax: "Max rabat (%)", freeItem: "Dawanie darmowych pozycji", cancelItem: "Anulowanie pozycji", cancelOrder: "Anulowanie zamówień", editSentItem: "Edycja wysłanych pozycji", reprintKitchen: "Ponowny wydruk do kuchni" },
  prohibitions: { noQuantityChange: "Zakaz zmiany ilości", noPriceChange: "Zakaz zmiany ceny", noNoteAdd: "Zakaz dodawania notatek", noModifierChange: "Zakaz zmiany modyfikatorów" },
  reports: { dailySales: "Raport dzienny", cashReport: "Raport kasowy", itemReport: "Raport produktów", staffReport: "Raport pracowników", deliveryReport: "Raport dostaw" },
  receipt: { openCashDrawer: "Otwieranie szuflady", payout: "Wypłaty z kasy", refund: "Zwroty", printReceipt: "Drukowanie paragonów", emailReceipt: "Email z paragonem" },
  order: { createOrder: "Tworzenie zamówień", addItems: "Dodawanie pozycji", removeItems: "Usuwanie pozycji", changeQuantity: "Zmiana ilości", applyCoupon: "Stosowanie kuponów" },
  delivery: { createDelivery: "Tworzenie dostaw", assignDriver: "Przypisywanie kierowców", changeStatus: "Zmiana statusu", editAddress: "Edycja adresu" },
  config: { editProducts: "Edycja produktów", editCategories: "Edycja kategorii", editTables: "Edycja stolików", editUsers: "Edycja użytkowników", editPrinters: "Edycja drukarek" },
};

export default function UserPermissionsClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [localPerms, setLocalPerms] = useState<PermissionsData | null>(null);
  const [autoLogoutSec, setAutoLogoutSec] = useState<number | null>(null);

  const { data, isLoading } = useQuery<UserPermissions>({
    queryKey: ["user-permissions", id],
    queryFn: () => fetch(`/api/users/${id}/permissions`).then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (perms: { permissionsJson?: PermissionsData; autoLogoutSec?: number | null }) =>
      fetch(`/api/users/${id}/permissions`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(perms) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", id] });
      alert("Uprawnienia zapisane");
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => fetch("/api/users").then((r) => r.json()),
  });

  const copyMutation = useMutation({
    mutationFn: (sourceUserId: string) =>
      fetch(`/api/users/${id}/permissions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUserId }) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", id] });
      alert("Uprawnienia skopiowane");
    },
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <p>Ładowanie...</p>
      </div>
    );
  }

  const perms = localPerms ?? data.user.permissionsJson ?? {};
  const effective = data.effectivePermissions;

  const updatePerm = (section: string, key: string, value: boolean | number) => {
    setLocalPerms((prev) => {
      const current = prev ?? data.user.permissionsJson ?? {};
      return { ...current, [section]: { ...(current[section as keyof PermissionsData] ?? {}), [key]: value } };
    });
  };

  const sectionLabels: Record<string, string> = { access: "Dostęp", hall: "Sala", operations: "Operacje", prohibitions: "Zakazy", reports: "Raporty", receipt: "Rachunek", order: "Zamówienie", delivery: "Dostawy", config: "Konfiguracja" };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settings" className="p-2 hover:bg-gray-700 rounded"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-xl font-semibold">Uprawnienia: {data.user.name}</h1>
              <p className="text-sm text-gray-400">Rola: {data.role.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <select onChange={(e) => e.target.value && copyMutation.mutate(e.target.value)} className="bg-gray-700 border border-gray-600 rounded px-3 py-2" defaultValue="">
              <option value="">Kopiuj z...</option>
              {(usersData?.users ?? []).filter((u: { id: string }) => u.id !== id).map((u: { id: string; name: string }) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button onClick={() => saveMutation.mutate({ permissionsJson: localPerms ?? undefined, autoLogoutSec: autoLogoutSec ?? data.user.autoLogoutSec })} disabled={saveMutation.isPending} className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded flex items-center gap-2">
              <Save className="w-4 h-4" /> Zapisz
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Ogólne</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Auto wylogowanie</label>
              <select value={autoLogoutSec ?? data.user.autoLogoutSec ?? ""} onChange={(e) => setAutoLogoutSec(e.target.value ? parseInt(e.target.value) : null)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                <option value="">Domyślne</option>
                <option value="0">Wyłączone</option>
                <option value="20">20 sekund</option>
                <option value="40">40 sekund</option>
                <option value="60">1 minuta</option>
                <option value="120">2 minuty</option>
                <option value="300">5 minut</option>
              </select>
            </div>
          </div>
        </div>

        {Object.entries(PERMISSION_LABELS).map(([section, keys]) => (
          <div key={section} className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">{sectionLabels[section] ?? section}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(keys).map(([key, label]) => {
                const sectionPerms = perms[section as keyof PermissionsData] as Record<string, boolean | number> | undefined;
                const effectiveSection = effective[section as keyof PermissionsData] as Record<string, boolean | number> | undefined;
                const value = sectionPerms?.[key];
                const effectiveValue = effectiveSection?.[key];
                const isNumber = key === "discountMax";
                return (
                  <div key={key} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded">
                    <span className="text-sm">{label}</span>
                    {isNumber ? (
                      <input type="number" min={0} max={100} value={(value as number) ?? (effectiveValue as number) ?? 100} onChange={(e) => updatePerm(section, key, parseInt(e.target.value) || 0)} className="w-20 bg-gray-600 border border-gray-500 rounded px-2 py-1 text-right" />
                    ) : (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={(value as boolean) ?? (effectiveValue as boolean) ?? true} onChange={(e) => updatePerm(section, key, e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
