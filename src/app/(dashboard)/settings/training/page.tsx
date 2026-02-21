"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  ArrowLeft,
  Play,
  Square,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function TrainingPage() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/training");
      const data = await res.json();
      setActive(data.trainingMode === true);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      const data = await res.json();
      setActive(data.trainingMode === true);
    } catch { /* ignore */ } finally { setToggling(false); }
  };

  const handleReset = async () => {
    if (!confirm("Czy na pewno usunąć wszystkie dane szkoleniowe? Tej operacji nie można cofnąć.")) return;
    setResetting(true);
    setResetResult(null);
    try {
      const res = await fetch("/api/training", { method: "DELETE" });
      const data = await res.json();
      setResetResult(data.message || `Usunięto ${data.deleted} zamówień`);
      setActive(false);
    } catch {
      setResetResult("Błąd resetowania");
    } finally { setResetting(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <GraduationCap className="h-7 w-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold">Tryb szkoleniowy</h1>
          <p className="text-sm text-muted-foreground">Ćwiczenie obsługi systemu bez wpływu na dane</p>
        </div>
      </div>

      {/* Status */}
      <div className={cn(
        "rounded-2xl border-2 p-6 text-center",
        active
          ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20"
          : "border-muted"
      )}>
        <GraduationCap className={cn("mx-auto mb-3 h-16 w-16", active ? "text-amber-500" : "text-muted-foreground/30")} />
        <p className="text-2xl font-black">
          {active ? "Tryb szkoleniowy AKTYWNY" : "Tryb szkoleniowy wyłączony"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {active
            ? "Zamówienia są oznaczane jako szkoleniowe i można je usunąć jednym kliknięciem."
            : "Włącz tryb szkoleniowy, aby nowi pracownicy mogli ćwiczyć obsługę systemu."}
        </p>
      </div>

      {/* Toggle button */}
      <Button
        size="lg"
        className={cn("w-full gap-2 text-lg", active && "bg-red-600 hover:bg-red-700")}
        onClick={handleToggle}
        disabled={toggling || loading}
      >
        {active ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        {toggling ? "Przełączanie…" : active ? "Wyłącz tryb szkoleniowy" : "Włącz tryb szkoleniowy"}
      </Button>

      {/* Reset */}
      {active && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3 dark:bg-red-950/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="font-semibold text-red-700 dark:text-red-400">Resetuj dane szkoleniowe</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Usuwa wszystkie zamówienia utworzone w trybie szkoleniowym.
            Prawdziwe dane nie zostaną naruszone.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={handleReset}
            disabled={resetting}
          >
            <Trash2 className="h-4 w-4" />
            {resetting ? "Usuwanie…" : "Usuń dane szkoleniowe"}
          </Button>
          {resetResult && (
            <p className="text-sm text-emerald-600">{resetResult}</p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg bg-muted/30 p-4 text-sm space-y-2">
        <p className="font-medium">Jak działa tryb szkoleniowy:</p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Zamówienia są oznaczane tagiem [SZKOLENIE] w notatce</li>
          <li>Na dole ekranu pojawia się żółty pasek informacyjny</li>
          <li>Wszystkie funkcje działają normalnie (kasa, KDS, płatności)</li>
          <li>Po zakończeniu szkolenia — wyłącz tryb i zresetuj dane</li>
          <li>Dane szkoleniowe nie wpływają na raporty (po usunięciu)</li>
        </ul>
      </div>
    </div>
  );
}
