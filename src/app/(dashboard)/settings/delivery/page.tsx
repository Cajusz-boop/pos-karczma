"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Truck,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Users,
  FileText,
  Upload,
  ChevronDown,
  ChevronRight,
  DollarSign,
} from "lucide-react";

interface DeliveryZone {
  id: string;
  number: number;
  name: string;
  driverCommission: number;
  deliveryCost: number;
  minOrderForFreeDelivery: number | null;
  estimatedMinutes: number;
  isActive: boolean;
  sortOrder: number;
  streetCount: number;
  orderCount: number;
  streets?: DeliveryStreet[];
}

interface DeliveryStreet {
  id: string;
  zoneId: string;
  streetName: string;
  numberFrom: number | null;
  numberTo: number | null;
  postalCode: string | null;
  city: string | null;
}

interface Driver {
  id: string;
  userId: string;
  userName: string;
  vehicleType: string | null;
  vehiclePlate: string | null;
  phoneNumber: string | null;
  isAvailable: boolean;
  currentOrder: { id: string; orderNumber: number; deliveryAddress: string | null } | null;
  stats?: {
    totalDeliveries: number;
    totalCommission: number;
    recentDays: number;
  };
}

interface Settlement {
  id: string;
  driverId: string;
  driverName: string;
  shiftDate: string;
  totalDeliveries: number;
  totalValue: number;
  totalCommission: number;
  cashCollected: number;
  status: "PENDING" | "SETTLED" | "DISPUTED";
  settledAt: string | null;
  note: string | null;
}

interface User {
  id: string;
  name: string;
}

type Tab = "zones" | "streets" | "drivers" | "settlements";

export default function DeliverySettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("zones");

  const [zoneDialog, setZoneDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [zoneForm, setZoneForm] = useState({
    number: 1,
    name: "",
    driverCommission: 0,
    deliveryCost: 0,
    minOrderForFreeDelivery: "",
    estimatedMinutes: 30,
  });

  const [streetDialog, setStreetDialog] = useState(false);
  const [streetForm, setStreetForm] = useState({
    zoneId: "",
    streetName: "",
    numberFrom: "",
    numberTo: "",
  });

  const [bulkImportDialog, setBulkImportDialog] = useState(false);
  const [bulkImportZoneId, setBulkImportZoneId] = useState("");
  const [bulkImportText, setBulkImportText] = useState("");

  const [driverDialog, setDriverDialog] = useState(false);
  const [driverForm, setDriverForm] = useState({
    userId: "",
    vehicleType: "",
    vehiclePlate: "",
    phoneNumber: "",
  });

  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [streetSearch, setStreetSearch] = useState("");
  const [streetZoneFilter, setStreetZoneFilter] = useState("");

  const [settlementDate, setSettlementDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [settlementDialog, setSettlementDialog] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [settleCashCollected, setSettleCashCollected] = useState("");
  const [settleNote, setSettleNote] = useState("");

  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ["delivery-zones", tab === "zones"],
    queryFn: async () => {
      const r = await fetch("/api/delivery/zones?includeStreets=true");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "zones" || tab === "streets",
  });

  const { data: streetsData, isLoading: streetsLoading } = useQuery({
    queryKey: ["delivery-streets", streetSearch, streetZoneFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (streetSearch) params.set("search", streetSearch);
      if (streetZoneFilter) params.set("zoneId", streetZoneFilter);
      const r = await fetch(`/api/delivery/streets?${params}`);
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "streets",
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ["delivery-drivers"],
    queryFn: async () => {
      const r = await fetch("/api/delivery/drivers?stats=true");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "drivers",
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-for-drivers"],
    queryFn: async () => {
      const r = await fetch("/api/users");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "drivers" && driverDialog,
  });

  const { data: settlementsData, isLoading: settlementsLoading } = useQuery({
    queryKey: ["driver-settlements", settlementDate],
    queryFn: async () => {
      const dateFrom = settlementDate;
      const dateTo = settlementDate;
      const r = await fetch(
        `/api/delivery/settlements?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "settlements",
  });

  const { data: settlementDriversData } = useQuery({
    queryKey: ["settlement-drivers"],
    queryFn: async () => {
      const r = await fetch("/api/delivery/drivers?stats=true");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "settlements",
  });

  const zones: DeliveryZone[] = zonesData?.zones ?? [];
  const streets: DeliveryStreet[] = streetsData?.streets ?? [];
  const drivers: Driver[] = driversData?.drivers ?? [];
  const users: User[] = usersData?.users ?? [];
  const settlements: Settlement[] = settlementsData?.settlements ?? [];
  const settlementDrivers: Driver[] = settlementDriversData?.drivers ?? [];

  const saveZoneMutation = useMutation({
    mutationFn: async (data: typeof zoneForm & { id?: string }) => {
      const method = data.id ? "PATCH" : "POST";
      const body = {
        ...data,
        minOrderForFreeDelivery: data.minOrderForFreeDelivery
          ? parseFloat(data.minOrderForFreeDelivery)
          : null,
      };
      const r = await fetch("/api/delivery/zones", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Błąd");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      setZoneDialog(false);
      setEditingZone(null);
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/delivery/zones?id=${id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Błąd");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });

  const saveStreetMutation = useMutation({
    mutationFn: async (data: typeof streetForm) => {
      const r = await fetch("/api/delivery/streets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          numberFrom: data.numberFrom ? parseInt(data.numberFrom) : null,
          numberTo: data.numberTo ? parseInt(data.numberTo) : null,
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Błąd");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-streets"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      setStreetDialog(false);
    },
  });

  const deleteStreetMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/delivery/streets?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-streets"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async () => {
      const lines = bulkImportText.split("\n").filter((l) => l.trim());
      const streetsList = lines.map((line) => {
        const parts = line.split(";");
        return {
          streetName: parts[0]?.trim() ?? "",
          numberFrom: parts[1] ? parseInt(parts[1]) : null,
          numberTo: parts[2] ? parseInt(parts[2]) : null,
        };
      }).filter((s) => s.streetName);

      const r = await fetch("/api/delivery/streets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: bulkImportZoneId,
          streets: streetsList,
        }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Błąd");
      }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-streets"] });
      setBulkImportDialog(false);
      setBulkImportText("");
      alert(`Zaimportowano ${data.imported} ulic`);
    },
  });

  const saveDriverMutation = useMutation({
    mutationFn: async (data: typeof driverForm) => {
      const r = await fetch("/api/delivery/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Błąd");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-drivers"] });
      setDriverDialog(false);
    },
  });

  const toggleDriverMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const r = await fetch("/api/delivery/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAvailable }),
      });
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-drivers"] });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/delivery/drivers?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-drivers"] });
    },
  });

  const generateSettlementMutation = useMutation({
    mutationFn: async ({ driverId, shiftDate }: { driverId: string; shiftDate: string }) => {
      const r = await fetch("/api/delivery/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, shiftDate }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Błąd");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-settlements"] });
    },
  });

  const settleSettlementMutation = useMutation({
    mutationFn: async ({
      settlementId,
      cashCollected,
      note,
    }: {
      settlementId: string;
      cashCollected: number;
      note?: string;
    }) => {
      const r = await fetch("/api/delivery/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId, cashCollected, note }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error ?? "Błąd");
      }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-settlements"] });
      setSettlementDialog(false);
      setSelectedSettlement(null);
    },
  });

  const openSettleDialog = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setSettleCashCollected(settlement.cashCollected.toString());
    setSettleNote(settlement.note ?? "");
    setSettlementDialog(true);
  };

  const openZoneDialog = (zone?: DeliveryZone) => {
    if (zone) {
      setEditingZone(zone);
      setZoneForm({
        number: zone.number,
        name: zone.name,
        driverCommission: zone.driverCommission,
        deliveryCost: zone.deliveryCost,
        minOrderForFreeDelivery: zone.minOrderForFreeDelivery?.toString() ?? "",
        estimatedMinutes: zone.estimatedMinutes ?? 30,
      });
    } else {
      setEditingZone(null);
      const maxNumber = Math.max(0, ...zones.map((z) => z.number));
      setZoneForm({
        number: maxNumber + 1,
        name: "",
        driverCommission: 0,
        deliveryCost: 0,
        minOrderForFreeDelivery: "",
        estimatedMinutes: 30,
      });
    }
    setZoneDialog(true);
  };

  const openStreetDialog = (zoneId?: string) => {
    setStreetForm({
      zoneId: zoneId ?? zones[0]?.id ?? "",
      streetName: "",
      numberFrom: "",
      numberTo: "",
    });
    setStreetDialog(true);
  };

  const openBulkImport = (zoneId: string) => {
    setBulkImportZoneId(zoneId);
    setBulkImportText("");
    setBulkImportDialog(true);
  };

  const openDriverDialog = () => {
    setDriverForm({
      userId: "",
      vehicleType: "",
      vehiclePlate: "",
      phoneNumber: "",
    });
    setDriverDialog(true);
  };

  const toggleZoneExpand = (zoneId: string) => {
    setExpandedZones((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "zones", label: "Strefy", icon: <MapPin className="h-4 w-4" /> },
    { id: "streets", label: "Ulice", icon: <FileText className="h-4 w-4" /> },
    { id: "drivers", label: "Kierowcy", icon: <Users className="h-4 w-4" /> },
    { id: "settlements", label: "Rozliczenia", icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <div className="container max-w-4xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Truck className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-semibold">Dostawy</h1>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span className="ml-1">{t.label}</span>
          </Button>
        ))}
      </div>

      {tab === "zones" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Strefy dostaw z kosztami i prowizją kierowcy
            </p>
            <Button onClick={() => openZoneDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nowa strefa
            </Button>
          </div>

          {zonesLoading && <p className="text-muted-foreground">Ładowanie...</p>}

          <div className="space-y-2">
            {zones.map((zone) => (
              <div key={zone.id} className="rounded-lg border">
                <div
                  className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/30"
                  onClick={() => toggleZoneExpand(zone.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedZones.has(zone.id) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        zone.isActive ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {zone.number}
                    </div>
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {zone.streetCount} ulic · {zone.orderCount} zamówień
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p>Koszt: <span className="font-medium">{zone.deliveryCost.toFixed(2)} zł</span></p>
                      <p className="text-muted-foreground">Prowizja: {zone.driverCommission.toFixed(2)} zł</p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openZoneDialog(zone)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openBulkImport(zone.id)}
                        title="Import ulic"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Usunąć strefę "${zone.name}"?`)) {
                            deleteZoneMutation.mutate(zone.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedZones.has(zone.id) && zone.streets && zone.streets.length > 0 && (
                  <div className="border-t bg-muted/20 p-3">
                    <div className="flex flex-wrap gap-2">
                      {zone.streets.map((street) => (
                        <span
                          key={street.id}
                          className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-sm shadow-sm"
                        >
                          {street.streetName}
                          {street.numberFrom !== null && (
                            <span className="text-muted-foreground">
                              ({street.numberFrom}-{street.numberTo ?? "..."})
                            </span>
                          )}
                          <button
                            onClick={() => deleteStreetMutation.mutate(street.id)}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto p-0"
                      onClick={() => openStreetDialog(zone.id)}
                    >
                      + Dodaj ulicę
                    </Button>
                  </div>
                )}

                {expandedZones.has(zone.id) && (!zone.streets || zone.streets.length === 0) && (
                  <div className="border-t bg-muted/20 p-3 text-center text-sm text-muted-foreground">
                    Brak ulic w tej strefie.{" "}
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => openStreetDialog(zone.id)}
                    >
                      Dodaj pierwszą
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {zones.length === 0 && !zonesLoading && (
            <p className="text-center text-muted-foreground">
              Brak stref. Utwórz pierwszą strefę dostaw.
            </p>
          )}
        </section>
      )}

      {tab === "streets" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Szukaj ulicy..."
              value={streetSearch}
              onChange={(e) => setStreetSearch(e.target.value)}
              className="max-w-xs"
            />
            <select
              className="rounded border px-3 py-2"
              value={streetZoneFilter}
              onChange={(e) => setStreetZoneFilter(e.target.value)}
            >
              <option value="">Wszystkie strefy</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  Strefa {z.number}: {z.name}
                </option>
              ))}
            </select>
            <div className="flex-1" />
            <Button onClick={() => openStreetDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj ulicę
            </Button>
          </div>

          {streetsLoading && <p className="text-muted-foreground">Ładowanie...</p>}

          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left">Ulica</th>
                  <th className="p-3 text-left">Zakres numerów</th>
                  <th className="p-3 text-left">Strefa</th>
                  <th className="p-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {streets.map((street) => (
                  <tr key={street.id} className="border-b">
                    <td className="p-3 font-medium">{street.streetName}</td>
                    <td className="p-3 text-muted-foreground">
                      {street.numberFrom !== null
                        ? `${street.numberFrom} - ${street.numberTo ?? "..."}`
                        : "—"}
                    </td>
                    <td className="p-3">
                      {zones.find((z) => z.id === street.zoneId)?.name ?? "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Usunąć ulicę "${street.streetName}"?`)) {
                            deleteStreetMutation.mutate(street.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {streets.length === 0 && !streetsLoading && (
              <p className="p-4 text-center text-muted-foreground">
                Brak ulic spełniających kryteria.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === "drivers" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Kierowcy dostaw i ich status
            </p>
            <Button onClick={openDriverDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj kierowcę
            </Button>
          </div>

          {driversLoading && <p className="text-muted-foreground">Ładowanie...</p>}

          <div className="grid gap-3 sm:grid-cols-2">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className={`rounded-lg border p-4 ${
                  driver.isAvailable ? "bg-green-50/50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{driver.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {driver.vehicleType ?? "—"} {driver.vehiclePlate && `· ${driver.vehiclePlate}`}
                    </p>
                    {driver.phoneNumber && (
                      <p className="text-sm text-muted-foreground">{driver.phoneNumber}</p>
                    )}
                  </div>
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Dostępny</span>
                    <input
                      type="checkbox"
                      checked={driver.isAvailable}
                      onChange={(e) =>
                        toggleDriverMutation.mutate({
                          id: driver.id,
                          isAvailable: e.target.checked,
                        })
                      }
                    />
                  </label>
                </div>

                {driver.currentOrder && (
                  <div className="mt-2 rounded bg-orange-100 p-2 text-sm">
                    W trasie: #{driver.currentOrder.orderNumber}
                    {driver.currentOrder.deliveryAddress && (
                      <span className="ml-1 text-muted-foreground">
                        ({driver.currentOrder.deliveryAddress})
                      </span>
                    )}
                  </div>
                )}

                {driver.stats && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Ostatnie 30 dni: {driver.stats.totalDeliveries} dostaw,{" "}
                    {driver.stats.totalCommission.toFixed(2)} zł prowizji
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Usunąć kierowcę "${driver.userName}"?`)) {
                        deleteDriverMutation.mutate(driver.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Usuń
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {drivers.length === 0 && !driversLoading && (
            <p className="text-center text-muted-foreground">
              Brak kierowców. Dodaj pierwszego kierowcę.
            </p>
          )}
        </section>
      )}

      {tab === "settlements" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Data</label>
              <Input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <select
                id="generate-driver"
                className="rounded border px-3 py-2"
                defaultValue=""
              >
                <option value="">Wybierz kierowcę</option>
                {settlementDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.userName}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => {
                  const select = document.getElementById("generate-driver") as HTMLSelectElement;
                  if (select.value) {
                    generateSettlementMutation.mutate({
                      driverId: select.value,
                      shiftDate: settlementDate,
                    });
                  }
                }}
                disabled={generateSettlementMutation.isPending}
              >
                {generateSettlementMutation.isPending ? "Generuję..." : "Generuj rozliczenie"}
              </Button>
            </div>
          </div>

          {settlementsLoading && <p className="text-muted-foreground">Ładowanie...</p>}

          {!settlementsLoading && settlements.length === 0 && (
            <div className="rounded-lg border bg-muted/20 p-8 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 font-medium">Brak rozliczeń na wybraną datę</p>
              <p className="text-sm text-muted-foreground">
                Wybierz kierowcę i wygeneruj rozliczenie
              </p>
            </div>
          )}

          {settlements.length > 0 && (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">Kierowca</th>
                    <th className="p-3 text-center">Dostawy</th>
                    <th className="p-3 text-right">Wartość</th>
                    <th className="p-3 text-right">Prowizja</th>
                    <th className="p-3 text-right">Gotówka</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="p-3 font-medium">{s.driverName}</td>
                      <td className="p-3 text-center">{s.totalDeliveries}</td>
                      <td className="p-3 text-right">{s.totalValue.toFixed(2)} zł</td>
                      <td className="p-3 text-right font-medium text-green-600">
                        {s.totalCommission.toFixed(2)} zł
                      </td>
                      <td className="p-3 text-right">{s.cashCollected.toFixed(2)} zł</td>
                      <td className="p-3 text-center">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            s.status === "SETTLED"
                              ? "bg-green-100 text-green-800"
                              : s.status === "DISPUTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {s.status === "SETTLED"
                            ? "Zamknięte"
                            : s.status === "DISPUTED"
                            ? "Sporne"
                            : "Oczekuje"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {s.status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => openSettleDialog(s)}
                          >
                            Zamknij
                          </Button>
                        )}
                        {s.status === "SETTLED" && s.settledAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.settledAt).toLocaleTimeString("pl-PL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-lg border bg-blue-50 p-4">
            <h3 className="font-medium">Podsumowanie dnia</h3>
            <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Dostawy</p>
                <p className="text-xl font-bold">
                  {settlements.reduce((sum, s) => sum + s.totalDeliveries, 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Wartość</p>
                <p className="text-xl font-bold">
                  {settlements.reduce((sum, s) => sum + s.totalValue, 0).toFixed(2)} zł
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Prowizje</p>
                <p className="text-xl font-bold text-green-600">
                  {settlements.reduce((sum, s) => sum + s.totalCommission, 0).toFixed(2)} zł
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Gotówka</p>
                <p className="text-xl font-bold">
                  {settlements.reduce((sum, s) => sum + s.cashCollected, 0).toFixed(2)} zł
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "Edytuj strefę" : "Nowa strefa dostaw"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Numer strefy</label>
                <Input
                  type="number"
                  min={1}
                  value={zoneForm.number}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, number: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nazwa</label>
                <Input
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  placeholder="np. Centrum"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Koszt dostawy (zł)</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={zoneForm.deliveryCost}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, deliveryCost: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Prowizja kierowcy (zł)</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={zoneForm.driverCommission}
                  onChange={(e) =>
                    setZoneForm({
                      ...zoneForm,
                      driverCommission: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Min. zamówienie na darmową dostawę
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={zoneForm.minOrderForFreeDelivery}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, minOrderForFreeDelivery: e.target.value })
                  }
                  placeholder="np. 50.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Szacowany czas dostawy (min)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={zoneForm.estimatedMinutes}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, estimatedMinutes: parseInt(e.target.value) || 30 })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() =>
                saveZoneMutation.mutate({
                  ...zoneForm,
                  id: editingZone?.id,
                })
              }
              disabled={saveZoneMutation.isPending || !zoneForm.name}
            >
              {saveZoneMutation.isPending ? "Zapisuję..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={streetDialog} onOpenChange={setStreetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj ulicę</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Strefa</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={streetForm.zoneId}
                onChange={(e) => setStreetForm({ ...streetForm, zoneId: e.target.value })}
              >
                <option value="">Wybierz strefę</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    Strefa {z.number}: {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nazwa ulicy</label>
              <Input
                value={streetForm.streetName}
                onChange={(e) => setStreetForm({ ...streetForm, streetName: e.target.value })}
                placeholder="np. Główna"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Od numeru (opcjonalnie)</label>
                <Input
                  type="number"
                  value={streetForm.numberFrom}
                  onChange={(e) => setStreetForm({ ...streetForm, numberFrom: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Do numeru (opcjonalnie)</label>
                <Input
                  type="number"
                  value={streetForm.numberTo}
                  onChange={(e) => setStreetForm({ ...streetForm, numberTo: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStreetDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => saveStreetMutation.mutate(streetForm)}
              disabled={
                saveStreetMutation.isPending || !streetForm.zoneId || !streetForm.streetName
              }
            >
              {saveStreetMutation.isPending ? "Dodaję..." : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkImportDialog} onOpenChange={setBulkImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import ulic</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Wklej listę ulic, każda w osobnej linii.
              <br />
              Format: <code>Nazwa ulicy;od;do</code> (np. &quot;Główna;1;100&quot;)
            </p>
            <textarea
              className="h-48 w-full rounded border p-3 font-mono text-sm"
              value={bulkImportText}
              onChange={(e) => setBulkImportText(e.target.value)}
              placeholder={"Główna;1;100\nDługa\nKrótka;1;50"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkImportDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => bulkImportMutation.mutate()}
              disabled={bulkImportMutation.isPending || !bulkImportText.trim()}
            >
              {bulkImportMutation.isPending ? "Importuję..." : "Importuj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj kierowcę</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Pracownik</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={driverForm.userId}
                onChange={(e) => setDriverForm({ ...driverForm, userId: e.target.value })}
              >
                <option value="">Wybierz pracownika</option>
                {users
                  .filter((u) => !drivers.some((d) => d.userId === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Typ pojazdu</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={driverForm.vehicleType}
                  onChange={(e) => setDriverForm({ ...driverForm, vehicleType: e.target.value })}
                >
                  <option value="">—</option>
                  <option value="car">Samochód</option>
                  <option value="bike">Rower</option>
                  <option value="scooter">Skuter</option>
                  <option value="foot">Pieszo</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Nr rejestracyjny</label>
                <Input
                  value={driverForm.vehiclePlate}
                  onChange={(e) =>
                    setDriverForm({ ...driverForm, vehiclePlate: e.target.value })
                  }
                  placeholder="np. KR 12345"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefon</label>
              <Input
                value={driverForm.phoneNumber}
                onChange={(e) => setDriverForm({ ...driverForm, phoneNumber: e.target.value })}
                placeholder="np. 123456789"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDriverDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => saveDriverMutation.mutate(driverForm)}
              disabled={saveDriverMutation.isPending || !driverForm.userId}
            >
              {saveDriverMutation.isPending ? "Dodaję..." : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settlementDialog} onOpenChange={setSettlementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zamknij rozliczenie</DialogTitle>
          </DialogHeader>
          {selectedSettlement && (
            <div className="space-y-4">
              <div className="rounded bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">Kierowca</p>
                <p className="font-medium">{selectedSettlement.driverName}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded border p-2">
                  <p className="text-xs text-muted-foreground">Dostawy</p>
                  <p className="text-lg font-bold">{selectedSettlement.totalDeliveries}</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-xs text-muted-foreground">Wartość</p>
                  <p className="text-lg font-bold">{selectedSettlement.totalValue.toFixed(2)} zł</p>
                </div>
                <div className="rounded border bg-green-50 p-2">
                  <p className="text-xs text-muted-foreground">Prowizja</p>
                  <p className="text-lg font-bold text-green-600">
                    {selectedSettlement.totalCommission.toFixed(2)} zł
                  </p>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Gotówka zebrana (zł)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={settleCashCollected}
                  onChange={(e) => setSettleCashCollected(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  System naliczył: {selectedSettlement.cashCollected.toFixed(2)} zł
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Uwagi (opcjonalnie)</label>
                <Input
                  value={settleNote}
                  onChange={(e) => setSettleNote(e.target.value)}
                  placeholder="Notatka do rozliczenia..."
                />
              </div>
              <div className="rounded bg-blue-50 p-3">
                <p className="text-sm">
                  <strong>Do wypłaty kierowcy:</strong>{" "}
                  <span className="text-lg font-bold text-green-600">
                    {selectedSettlement.totalCommission.toFixed(2)} zł
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  (gotówka: {settleCashCollected || "0"} zł - prowizja ={" "}
                  {(parseFloat(settleCashCollected || "0") - selectedSettlement.totalCommission).toFixed(2)} zł do
                  oddania do kasy)
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettlementDialog(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() =>
                selectedSettlement &&
                settleSettlementMutation.mutate({
                  settlementId: selectedSettlement.id,
                  cashCollected: parseFloat(settleCashCollected) || 0,
                  note: settleNote || undefined,
                })
              }
              disabled={settleSettlementMutation.isPending}
            >
              {settleSettlementMutation.isPending ? "Zamykam..." : "Zamknij rozliczenie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
