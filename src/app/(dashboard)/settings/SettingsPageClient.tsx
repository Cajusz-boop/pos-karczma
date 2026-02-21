"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "@/components/ui/dialog";
import { Settings, Building2, Printer, Users, LayoutGrid, Utensils, Tags, Percent, FileSpreadsheet, Gift, Heart, GraduationCap, CalendarDays, Monitor, Smartphone, Truck, Package, Tv, CreditCard, BarChart3, Archive, Wrench } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

function KsefAndFiscalSection() {
  const [ksefConfig, setKsefConfig] = useState<{
    enabled?: boolean;
    nip?: string;
    subjectName?: string;
    subjectAddress?: string;
    mode?: string;
    autoSend?: boolean;
    hasToken?: boolean;
  } | null>(null);
  const [ksefToken, setKsefToken] = useState("");
  const [ksefSaving, setKsefSaving] = useState(false);
  const [fiscalStatus, setFiscalStatus] = useState<{ ok?: boolean; message?: string; mode?: string } | null>(null);
  const [fiscalLoading, setFiscalLoading] = useState(false);
  const [dailyReportLoading, setDailyReportLoading] = useState(false);
  const [dailyReportDone, setDailyReportDone] = useState<string | null>(null);
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodDone, setPeriodDone] = useState(false);

  // Fiscal printer config
  const [fiscalConfig, setFiscalConfig] = useState<{
    mode: string;
    connectionType: string;
    address: string;
    port: number;
    model: string;
    baudRate: number;
  }>({
    mode: "DEMO",
    connectionType: "TCP",
    address: "",
    port: 9100,
    model: "Posnet Thermal",
    baudRate: 9600,
  });
  const [fiscalConfigSaving, setFiscalConfigSaving] = useState(false);

  useEffect(() => {
    fetch("/api/fiscal/config")
      .then((r) => r.json())
      .then((data) => setFiscalConfig((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/ksef")
      .then((r) => r.json())
      .then(setKsefConfig)
      .catch(() => setKsefConfig(null));
  }, []);

  const testFiscal = async () => {
    setFiscalLoading(true);
    setFiscalStatus(null);
    try {
      const res = await fetch("/api/fiscal");
      const data = await res.json();
      setFiscalStatus(data);
    } catch {
      setFiscalStatus({ ok: false, message: "Błąd sieci" });
    } finally {
      setFiscalLoading(false);
    }
  };

  const saveKsef = async () => {
    setKsefSaving(true);
    try {
      await fetch("/api/ksef", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: ksefConfig?.enabled ?? false,
          token: ksefToken || undefined,
          nip: ksefConfig?.nip ?? undefined,
          subjectName: ksefConfig?.subjectName ?? undefined,
          subjectAddress: ksefConfig?.subjectAddress ?? undefined,
          mode: ksefConfig?.mode ?? "test",
          autoSend: ksefConfig?.autoSend ?? true,
        }),
      });
      const res = await fetch("/api/ksef");
      setKsefConfig(await res.json());
      setKsefToken("");
    } finally {
      setKsefSaving(false);
    }
  };

  const runDailyReport = async () => {
    setDailyReportLoading(true);
    setDailyReportDone(null);
    try {
      const res = await fetch("/api/fiscal", { method: "POST" });
      const data = await res.json();
      if (res.ok) setDailyReportDone(data.date ?? "OK");
      else setFiscalStatus({ ok: false, message: data.error ?? "Błąd" });
    } catch {
      setFiscalStatus({ ok: false, message: "Błąd sieci" });
    } finally {
      setDailyReportLoading(false);
    }
  };

  return (
    <>
      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">KSeF (Krajowy System e-Faktur)</h2>
        <p className="mb-3 text-sm text-muted-foreground">Token, NIP i dane podmiotu. Tryb test/produkcja.</p>
        {ksefConfig && (
          <div className="mb-3 space-y-2">
            <label className="block text-sm">Token (opcjonalnie)</label>
            <Input type="password" value={ksefToken} onChange={(e) => setKsefToken(e.target.value)} placeholder={ksefConfig.hasToken ? "••••••••" : "Wpisz token"} />
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={ksefConfig.enabled ?? false} onChange={(e) => setKsefConfig({ ...ksefConfig, enabled: e.target.checked })} />
                Włącz KSeF
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={ksefConfig.autoSend ?? true} onChange={(e) => setKsefConfig({ ...ksefConfig, autoSend: e.target.checked })} />
                Auto-wysyłka przy wystawieniu
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-sm">NIP</label>
                <Input value={ksefConfig.nip ?? ""} onChange={(e) => setKsefConfig({ ...ksefConfig, nip: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="block text-sm">Tryb</label>
                <select className="mt-1 w-full rounded border px-2 py-1" value={ksefConfig.mode ?? "test"} onChange={(e) => setKsefConfig({ ...ksefConfig, mode: e.target.value })}>
                  <option value="test">Test</option>
                  <option value="prod">Produkcja</option>
                </select>
              </div>
            </div>
            <Input value={ksefConfig.subjectName ?? ""} onChange={(e) => setKsefConfig({ ...ksefConfig, subjectName: e.target.value })} placeholder="Nazwa podmiotu" className="mt-1" />
            <Input value={ksefConfig.subjectAddress ?? ""} onChange={(e) => setKsefConfig({ ...ksefConfig, subjectAddress: e.target.value })} placeholder="Adres" className="mt-1" />
            <Button onClick={saveKsef} disabled={ksefSaving} className="mt-2">{ksefSaving ? "Zapisuję…" : "Zapisz KSeF"}</Button>
          </div>
        )}
      </section>
      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">Drukarka fiskalna (Posnet)</h2>
        <p className="mb-3 text-sm text-muted-foreground">Konfiguracja połączenia, test i raporty fiskalne.</p>

        {/* Configuration */}
        <div className="mb-4 space-y-2 rounded border bg-muted/30 p-3">
          <h3 className="text-sm font-medium">Konfiguracja</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium">Tryb</label>
              <select
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={fiscalConfig.mode}
                onChange={(e) => setFiscalConfig({ ...fiscalConfig, mode: e.target.value })}
              >
                <option value="DEMO">DEMO (symulacja)</option>
                <option value="LIVE">LIVE (prawdziwa drukarka)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium">Typ połączenia</label>
              <select
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={fiscalConfig.connectionType}
                onChange={(e) => setFiscalConfig({ ...fiscalConfig, connectionType: e.target.value })}
              >
                <option value="TCP">TCP/IP (sieciowe)</option>
                <option value="COM">COM (port szeregowy)</option>
                <option value="USB">USB</option>
              </select>
            </div>
          </div>
          {fiscalConfig.mode === "LIVE" && (
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium">
                  {fiscalConfig.connectionType === "TCP" ? "Adres IP" : "Port"}
                </label>
                <Input
                  value={fiscalConfig.address}
                  onChange={(e) => setFiscalConfig({ ...fiscalConfig, address: e.target.value })}
                  placeholder={fiscalConfig.connectionType === "TCP" ? "192.168.1.100" : "COM3"}
                  className="mt-1"
                />
              </div>
              {fiscalConfig.connectionType === "TCP" && (
                <div>
                  <label className="block text-xs font-medium">Port TCP</label>
                  <Input
                    type="number"
                    value={fiscalConfig.port}
                    onChange={(e) => setFiscalConfig({ ...fiscalConfig, port: parseInt(e.target.value) || 9100 })}
                    className="mt-1"
                  />
                </div>
              )}
              {fiscalConfig.connectionType === "COM" && (
                <div>
                  <label className="block text-xs font-medium">Baud rate</label>
                  <select
                    className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    value={fiscalConfig.baudRate}
                    onChange={(e) => setFiscalConfig({ ...fiscalConfig, baudRate: parseInt(e.target.value) })}
                  >
                    <option value="9600">9600</option>
                    <option value="19200">19200</option>
                    <option value="38400">38400</option>
                    <option value="57600">57600</option>
                    <option value="115200">115200</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium">Model</label>
                <Input
                  value={fiscalConfig.model}
                  onChange={(e) => setFiscalConfig({ ...fiscalConfig, model: e.target.value })}
                  placeholder="Posnet Thermal"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <Button
            size="sm"
            onClick={async () => {
              setFiscalConfigSaving(true);
              try {
                await fetch("/api/fiscal/config", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(fiscalConfig),
                });
              } finally {
                setFiscalConfigSaving(false);
              }
            }}
            disabled={fiscalConfigSaving}
          >
            {fiscalConfigSaving ? "Zapisuję…" : "Zapisz konfigurację"}
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={testFiscal} disabled={fiscalLoading}>
            {fiscalLoading ? "Sprawdzam…" : "Test połączenia"}
          </Button>
          <Button variant="outline" onClick={runDailyReport} disabled={dailyReportLoading}>
            {dailyReportLoading ? "Generuję…" : "Raport dobowy"}
          </Button>
        </div>

        {/* Period report */}
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs font-medium">Od</label>
            <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="mt-1 w-36" />
          </div>
          <div>
            <label className="block text-xs font-medium">Do</label>
            <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="mt-1 w-36" />
          </div>
          <Button
            variant="outline"
            disabled={!periodFrom || !periodTo || periodLoading}
            onClick={async () => {
              setPeriodLoading(true);
              setPeriodDone(false);
              try {
                const res = await fetch("/api/fiscal/period-report", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ dateFrom: periodFrom, dateTo: periodTo }),
                });
                if (res.ok) setPeriodDone(true);
                else {
                  const d = await res.json();
                  setFiscalStatus({ ok: false, message: d.error ?? "Błąd" });
                }
              } catch {
                setFiscalStatus({ ok: false, message: "Błąd sieci" });
              } finally {
                setPeriodLoading(false);
              }
            }}
          >
            {periodLoading ? "Generuję…" : "Raport okresowy"}
          </Button>
        </div>

        {/* Status */}
        {fiscalStatus && (
          <div className="mt-3 text-sm">
            {fiscalStatus.ok ? (
              <p className="text-green-600">{fiscalStatus.message ?? "OK"} {fiscalStatus.mode ? `[${fiscalStatus.mode}]` : ""}</p>
            ) : (
              <p className="text-destructive">{fiscalStatus.message ?? "Błąd"}</p>
            )}
          </div>
        )}
        {dailyReportDone && <p className="mt-2 text-sm text-green-600">Raport dobowy zapisany: {dailyReportDone}</p>}
        {periodDone && <p className="mt-2 text-sm text-green-600">Raport okresowy wydrukowany</p>}
      </section>
    </>
  );
}

type TabId = "general" | "rooms" | "printers" | "shifts";

export default function SettingsPageClient() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("general");

  const { data: config = {}, refetch: refetchConfig } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const r = await fetch("/api/config");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "general",
  });

  const [configForm, setConfigForm] = useState<Record<string, string | number>>({});
  useEffect(() => {
    if (tab === "general" && Object.keys(config).length) {
      setConfigForm({
        companyName: (config.companyName as string) ?? "Karczma Łabędź",
        companyNip: (config.companyNip as string) ?? "",
        companyAddress: (config.companyAddress as string) ?? "",
        invoiceNumberPrefix: (config.invoiceNumberPrefix as string) ?? "FV",
        currency: (config.currency as string) ?? "PLN",
        sessionTimeoutMinutes: String(config.sessionTimeoutMinutes ?? 5),
        autoReportTime: (config.autoReportTime as string) ?? "23:55",
        discountThresholdPercent: String(config.discountThresholdPercent ?? 10),
      });
    }
  }, [tab, config]);

  const configSave = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configForm),
      });
      if (!r.ok) throw new Error("Błąd zapisu");
    },
    onSuccess: () => {
      refetchConfig();
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms-all"],
    queryFn: async () => {
      const r = await fetch("/api/rooms?all=true");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "rooms",
  });

  const roomToggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const r = await fetch(`/api/rooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!r.ok) throw new Error("Błąd");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms-all"] });
    },
  });

  const { data: printers = [] } = useQuery({
    queryKey: ["printers"],
    queryFn: async () => {
      const r = await fetch("/api/printers");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "printers",
  });

  const { data: openShifts = [] } = useQuery({
    queryKey: ["shifts-open"],
    queryFn: async () => {
      const r = await fetch("/api/shifts?status=OPEN");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
    enabled: tab === "shifts",
  });

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "Ogólne", icon: <Settings className="h-4 w-4" /> },
    { id: "rooms", label: "Sale", icon: <Building2 className="h-4 w-4" /> },
    { id: "printers", label: "Drukarki", icon: <Printer className="h-4 w-4" /> },
    { id: "shifts", label: "Otwarte zmiany", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="container max-w-2xl space-y-6 py-6">
      <h1 className="text-2xl font-semibold">Ustawienia</h1>

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

      {tab === "general" && (
        <div className="space-y-6">
          <section className="rounded-lg border p-4">
            <h2 className="mb-3 text-lg font-medium">Dane firmy</h2>
            <div className="space-y-2">
              <label className="block text-sm">Nazwa</label>
              <Input
                value={configForm.companyName ?? ""}
                onChange={(e) => setConfigForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="Karczma Łabędź"
              />
              <label className="block text-sm">NIP</label>
              <Input
                value={configForm.companyNip ?? ""}
                onChange={(e) => setConfigForm((f) => ({ ...f, companyNip: e.target.value }))}
                placeholder="NIP"
              />
              <label className="block text-sm">Adres</label>
              <Input
                value={configForm.companyAddress ?? ""}
                onChange={(e) => setConfigForm((f) => ({ ...f, companyAddress: e.target.value }))}
                placeholder="Adres siedziby"
              />
              <label className="block text-sm">Prefiks numeracji faktur</label>
              <Input
                value={configForm.invoiceNumberPrefix ?? ""}
                onChange={(e) => setConfigForm((f) => ({ ...f, invoiceNumberPrefix: e.target.value }))}
              />
              <label className="block text-sm">Waluta</label>
              <Input
                value={configForm.currency ?? ""}
                onChange={(e) => setConfigForm((f) => ({ ...f, currency: e.target.value }))}
              />
              <label className="block text-sm">Timeout sesji (min)</label>
              <Input
                type="number"
                value={configForm.sessionTimeoutMinutes ?? ""}
                onChange={(e) => setConfigForm((f) => ({ ...f, sessionTimeoutMinutes: e.target.value }))}
              />
              <label className="block text-sm">Godzina auto-raportu</label>
              <Input
                value={configForm.autoReportTime ?? ""}
                onChange={(e) => setConfigForm((f) => ({ ...f, autoReportTime: e.target.value }))}
                placeholder="23:55"
              />
              <label className="block text-sm">Próg rabatu wymagający PIN (%)</label>
              <Input
                type="number"
                value={configForm.discountThresholdPercent ?? ""}
                onChange={(e) => setConfigForm((f) => ({ ...f, discountThresholdPercent: e.target.value }))}
              />
              <Button onClick={() => configSave.mutate()} disabled={configSave.isPending}>
                {configSave.isPending ? "Zapisywanie…" : "Zapisz ustawienia"}
              </Button>
            </div>
          </section>
          <KsefAndFiscalSection />
        </div>
      )}

      {tab === "rooms" && (
        <section className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Panel sal</h2>
              <p className="text-sm text-muted-foreground">Aktywacja/dezaktywacja sal (np. Wiata sezonowa).</p>
            </div>
            <Link href="/settings/table-layout">
              <Button variant="outline" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Edytuj układ stolików
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {rooms.map((room: { id: string; name: string; isActive: boolean }) => (
              <div key={room.id} className="flex items-center justify-between rounded border p-2">
                <span className="font-medium">{room.name}</span>
                <label className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Aktywna</span>
                  <input
                    type="checkbox"
                    checked={room.isActive}
                    onChange={(e) => roomToggle.mutate({ id: room.id, isActive: e.target.checked })}
                    disabled={roomToggle.isPending}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "printers" && (
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-medium">Drukarki kuchenne / bar</h2>
          <p className="mb-3 text-sm text-muted-foreground">Lista drukarek, przypisanie kategorii, test wydruku.</p>
          <div className="space-y-2">
            {printers.map((p: { id: string; name: string; type: string; isActive: boolean; categories: { name: string }[] }) => (
              <div key={p.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">({p.type})</span>
                  {p.categories?.length > 0 && (
                    <p className="text-xs text-muted-foreground">Kategorie: {p.categories.map((c: { name: string }) => c.name).join(", ")}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const r = await fetch(`/api/printers/${p.id}/test`, { method: "POST" });
                      const d = await r.json();
                      alert(d.ok ? d.message : d.error);
                    }}
                  >
                    Test
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "shifts" && (
        <section className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-medium">Otwarte zmiany</h2>
          <p className="mb-3 text-sm text-muted-foreground">Kto ma otwartą zmianę, od kiedy, obrót.</p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left">Kelner</th>
                  <th className="p-2 text-left">Od</th>
                  <th className="p-2 text-right">Gotówka start</th>
                  <th className="p-2 text-right">Obrót</th>
                </tr>
              </thead>
              <tbody>
                {openShifts.map((s: { userName: string; startedAt: string; cashStart: number; turnover: number }) => (
                  <tr key={s.startedAt + s.userName} className="border-b">
                    <td className="p-2 font-medium">{s.userName}</td>
                    <td className="p-2">{format(new Date(s.startedAt), "d MMM HH:mm", { locale: pl })}</td>
                    <td className="p-2 text-right">{Number(s.cashStart).toFixed(2)} zł</td>
                    <td className="p-2 text-right">{Number(s.turnover).toFixed(2)} zł</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {openShifts.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Brak otwartych zmian.</p>}
        </section>
      )}

      {/* Quick links to other settings pages */}
      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">Więcej ustawień</h2>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/settings/table-layout" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <LayoutGrid className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="font-medium">Układ stolików</p>
              <p className="text-xs text-muted-foreground">Drag & drop na mapie</p>
            </div>
          </Link>
          <Link href="/settings/rooms" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Building2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="font-medium">Sale i stoliki</p>
              <p className="text-xs text-muted-foreground">CRUD sal, stolików</p>
            </div>
          </Link>
          <Link href="/settings/categories" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Tags className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium">Kategorie</p>
              <p className="text-xs text-muted-foreground">Menu, kolejność, kolory</p>
            </div>
          </Link>
          <Link href="/settings/modifiers" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Utensils className="h-5 w-5 text-rose-500" />
            <div>
              <p className="font-medium">Modyfikatory</p>
              <p className="text-xs text-muted-foreground">Dodatki, opcje</p>
            </div>
          </Link>
          <Link href="/settings/tax-rates" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Percent className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Stawki VAT</p>
              <p className="text-xs text-muted-foreground">A, B, C, D</p>
            </div>
          </Link>
          <Link href="/settings/menu-import" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <FileSpreadsheet className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">Import menu</p>
              <p className="text-xs text-muted-foreground">CSV, Excel</p>
            </div>
          </Link>
          <Link href="/settings/vouchers" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Gift className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Vouchery</p>
              <p className="text-xs text-muted-foreground">Karty podarunkowe</p>
            </div>
          </Link>
          <Link href="/settings/loyalty" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Heart className="h-5 w-5 text-pink-500" />
            <div>
              <p className="font-medium">Program lojalnościowy</p>
              <p className="text-xs text-muted-foreground">Punkty, nagrody</p>
            </div>
          </Link>
          <Link href="/settings/kds" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Monitor className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-medium">KDS</p>
              <p className="text-xs text-muted-foreground">Stacje kuchenne</p>
            </div>
          </Link>
          <Link href="/settings/schedule" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <CalendarDays className="h-5 w-5 text-cyan-500" />
            <div>
              <p className="font-medium">Grafik pracy</p>
              <p className="text-xs text-muted-foreground">Zmiany, dostępność</p>
            </div>
          </Link>
          <Link href="/settings/training" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <GraduationCap className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium">Tryb szkoleniowy</p>
              <p className="text-xs text-muted-foreground">Demo, ćwiczenia</p>
            </div>
          </Link>
          <Link href="/settings/terminal" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Smartphone className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Terminal płatniczy</p>
              <p className="text-xs text-muted-foreground">PolCard Go, SoftPOS</p>
            </div>
          </Link>
          <Link href="/settings/printers" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Printer className="h-5 w-5 text-slate-500" />
            <div>
              <p className="font-medium">Drukarki</p>
              <p className="text-xs text-muted-foreground">Kuchenne, bonówka</p>
            </div>
          </Link>
          <Link href="/settings/delivery" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Truck className="h-5 w-5 text-orange-500" />
            <div>
              <p className="font-medium">Dostawy</p>
              <p className="text-xs text-muted-foreground">Strefy, kierowcy</p>
            </div>
          </Link>
          <Link href="/settings/sets" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Package className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">Zestawy</p>
              <p className="text-xs text-muted-foreground">Nadgrupy, składniki</p>
            </div>
          </Link>
          <Link href="/settings/displays" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Tv className="h-5 w-5 text-pink-500" />
            <div>
              <p className="font-medium">Panele TV</p>
              <p className="text-xs text-muted-foreground">Ekrany dla klientów</p>
            </div>
          </Link>
          <Link href="/settings/card-readers" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <CreditCard className="h-5 w-5 text-teal-500" />
            <div>
              <p className="font-medium">Czytniki kart</p>
              <p className="text-xs text-muted-foreground">NFC, RFID, Dallas</p>
            </div>
          </Link>
          <Link href="/manager" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Wrench className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium">Menadżer</p>
              <p className="text-xs text-muted-foreground">Numerator, kopie, fiskalizacja</p>
            </div>
          </Link>
          <Link href="/reports/extended" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="font-medium">Raporty rozszerzone</p>
              <p className="text-xs text-muted-foreground">Stoliki, zmiana</p>
            </div>
          </Link>
          <Link href="/kds/archive" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <Archive className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">Archiwum KDS</p>
              <p className="text-xs text-muted-foreground">Historia, statystyki czasu</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
