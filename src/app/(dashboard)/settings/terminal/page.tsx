"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Smartphone, CreditCard, Check, Loader2, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TerminalProvider = "DEMO" | "STRIPE" | "POLCARD";

interface TerminalConfig {
  provider: TerminalProvider;
  apiKey?: string;
  merchantId?: string;
  terminalId?: string;
}

interface TerminalStatus {
  connected: boolean;
  provider: string;
  terminalId?: string;
  message?: string;
}

export default function TerminalSettingsPage() {
  const [config, setConfig] = useState<TerminalConfig>({ provider: "DEMO" });
  const [status, setStatus] = useState<TerminalStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config?key=payment_terminal");
      const data = await res.json();
      if (data.value) {
        setConfig(data.value as TerminalConfig);
      }
    } catch (e) {
      console.error("Failed to fetch terminal config:", e);
    }
  };

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/terminal");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, provider: "UNKNOWN", message: "Błąd połączenia" });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "payment_terminal", value: config }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Błąd zapisu konfiguracji");
      }
      setSuccess(true);
      fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Terminal płatniczy</h1>
          <p className="text-muted-foreground">Konfiguracja SoftPOS i terminala zewnętrznego</p>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : status?.connected ? (
              <Wifi className="h-5 w-5 text-emerald-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Status terminala
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  status.connected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  {status.connected ? "Połączony" : "Rozłączony"}
                </span>
                <span className="text-sm text-muted-foreground">Provider: {status.provider}</span>
              </div>
              {status.terminalId && (
                <p className="text-sm">Terminal ID: <code className="bg-muted px-1 rounded">{status.terminalId}</code></p>
              )}
              {status.message && (
                <p className="text-sm text-muted-foreground">{status.message}</p>
              )}
            </div>
          )}
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchStatus} disabled={loading}>
            Odśwież status
          </Button>
        </CardContent>
      </Card>

      {/* Provider selection */}
      <Card>
        <CardHeader>
          <CardTitle>Wybierz dostawcę</CardTitle>
          <CardDescription>Wybierz metodę akceptacji płatności kartą</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-colors",
                config.provider === "DEMO" ? "border-blue-500 bg-blue-50" : "border-muted hover:border-muted-foreground/30"
              )}
              onClick={() => setConfig({ ...config, provider: "DEMO" })}
            >
              <Smartphone className="h-8 w-8 mb-2 text-blue-500" />
              <p className="font-semibold">Demo</p>
              <p className="text-xs text-muted-foreground">Symulacja płatności do testów</p>
            </button>

            <button
              type="button"
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-colors",
                config.provider === "POLCARD" ? "border-emerald-500 bg-emerald-50" : "border-muted hover:border-muted-foreground/30"
              )}
              onClick={() => setConfig({ ...config, provider: "POLCARD" })}
            >
              <Smartphone className="h-8 w-8 mb-2 text-emerald-500" />
              <p className="font-semibold">PolCard Go</p>
              <p className="text-xs text-muted-foreground">SoftPOS — telefon jako terminal</p>
            </button>

            <button
              type="button"
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-colors",
                config.provider === "STRIPE" ? "border-purple-500 bg-purple-50" : "border-muted hover:border-muted-foreground/30"
              )}
              onClick={() => setConfig({ ...config, provider: "STRIPE" })}
            >
              <CreditCard className="h-8 w-8 mb-2 text-purple-500" />
              <p className="font-semibold">Stripe Terminal</p>
              <p className="text-xs text-muted-foreground">Stripe Tap to Pay / Reader</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* PolCard Go configuration */}
      {config.provider === "POLCARD" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-500" />
              Konfiguracja PolCard Go
            </CardTitle>
            <CardDescription>
              Wprowadź dane otrzymane od Fiserv / PolCard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="merchantId">Merchant ID</Label>
                <Input
                  id="merchantId"
                  placeholder="np. 1234567890"
                  value={config.merchantId || ""}
                  onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Identyfikator punktu handlowego z umowy PolCard</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="terminalId">Terminal ID</Label>
                <Input
                  id="terminalId"
                  placeholder="np. TID001"
                  value={config.terminalId || ""}
                  onChange={(e) => setConfig({ ...config, terminalId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Identyfikator terminala (opcjonalny)</p>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 space-y-2">
              <p className="text-sm font-medium text-blue-800">Jak to działa?</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Zainstaluj aplikację PolCard Go ze sklepu Google Play na telefonie z NFC</li>
                <li>Zaloguj się do aplikacji danymi otrzymanymi od PolCard</li>
                <li>W POS wybierz płatność kartą i tryb &quot;PolCard Go&quot;</li>
                <li>Aplikacja PolCard Go otworzy się automatycznie</li>
                <li>Gość przykłada kartę do telefonu</li>
                <li>Po zaakceptowaniu płatność wraca do POS</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stripe configuration */}
      {config.provider === "STRIPE" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              Konfiguracja Stripe Terminal
            </CardTitle>
            <CardDescription>
              Wprowadź klucz API ze swojego konta Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Secret API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk_live_..."
                value={config.apiKey || ""}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Znajdziesz go w Stripe Dashboard → Developers → API keys
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo info */}
      {config.provider === "DEMO" && (
        <Card>
          <CardHeader>
            <CardTitle>Tryb demonstracyjny</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              W trybie DEMO wszystkie płatności kartą są automatycznie akceptowane.
              Używaj tego trybu do testów i szkoleń.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50 text-emerald-700">
          <Check className="h-5 w-5" />
          Konfiguracja zapisana pomyślnie
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Zapisz konfigurację
        </Button>
      </div>
    </div>
  );
}
