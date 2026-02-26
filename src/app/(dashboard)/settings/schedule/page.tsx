"use client";

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
  Calendar,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface ScheduleEntry {
  id: string;
  userId: string;
  userName: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  role: string | null;
  note: string | null;
  isConfirmed: boolean;
}

interface UserOption {
  id: string;
  name: string;
}

function getWeekDates(baseDate: Date): string[] {
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const DAY_NAMES = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  // Form
  const [fUserId, setFUserId] = useState("");
  const [fDate, setFDate] = useState("");
  const [fStart, setFStart] = useState("08:00");
  const [fEnd, setFEnd] = useState("16:00");
  const [fRole, setFRole] = useState("");
  const [fNote, setFNote] = useState("");
  const [saving, setSaving] = useState(false);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(baseDate);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schedule?from=${weekStart}&to=${weekEnd}`);
      const data = await res.json();
      setSchedules(data.schedules ?? []);
      setUsers(data.users ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [weekStart, weekEnd]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const openAdd = (userId: string, date: string) => {
    setFUserId(userId); setFDate(date); setFStart("08:00"); setFEnd("16:00"); setFRole(""); setFNote("");
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!fUserId || !fDate) return;
    setSaving(true);
    try {
      await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: fUserId, date: fDate, shiftStart: fStart, shiftEnd: fEnd,
          role: fRole.trim() || undefined, note: fNote.trim() || undefined,
        }),
      });
      setEditOpen(false); fetchSchedule();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
    fetchSchedule();
  };

  const getEntry = (userId: string, date: string) =>
    schedules.find((s) => s.userId === userId && s.date === date);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <Calendar className="h-7 w-7 text-teal-500" />
          <h1 className="text-2xl font-bold">Grafik pracy</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>Dziś</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSchedule} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium min-w-[120px]">Pracownik</th>
              {weekDates.map((date, i) => {
                const d = new Date(date);
                const isToday = date === new Date().toISOString().slice(0, 10);
                const isWeekend = i >= 5;
                return (
                  <th key={date} className={cn(
                    "px-2 py-2 text-center font-medium min-w-[100px]",
                    isToday && "bg-teal-50 dark:bg-teal-950/20",
                    isWeekend && "bg-muted/30"
                  )}>
                    <div className="text-xs text-muted-foreground">{DAY_NAMES[i]}</div>
                    <div className={cn(isToday && "font-bold text-teal-600")}>{d.getDate()}.{String(d.getMonth() + 1).padStart(2, "0")}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="sticky left-0 bg-background px-3 py-2 font-medium">{user.name}</td>
                {weekDates.map((date, i) => {
                  const entry = getEntry(user.id, date);
                  const isWeekend = i >= 5;
                  return (
                    <td key={date} className={cn(
                      "px-1 py-1 text-center",
                      isWeekend && "bg-muted/10"
                    )}>
                      {entry ? (
                        <div className="group relative rounded bg-teal-100 px-1 py-1 text-xs dark:bg-teal-900/30">
                          <p className="font-bold text-teal-700 dark:text-teal-400">
                            {entry.shiftStart}–{entry.shiftEnd}
                          </p>
                          {entry.role && <p className="text-[10px] text-muted-foreground">{entry.role}</p>}
                          <button
                            type="button"
                            className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-white group-hover:block"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex h-8 w-full items-center justify-center rounded border border-dashed border-transparent text-muted-foreground/30 hover:border-teal-300 hover:text-teal-500"
                          onClick={() => openAdd(user.id, date)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Dodaj zmianę</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {users.find((u) => u.id === fUserId)?.name} — {fDate ? new Date(fDate).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" }) : ""}
            </p>
            <div className="flex gap-3">
              <div className="flex-1"><label className="mb-1 block text-xs font-medium">Od</label>
                <Input type="time" value={fStart} onChange={(e) => setFStart(e.target.value)} /></div>
              <div className="flex-1"><label className="mb-1 block text-xs font-medium">Do</label>
                <Input type="time" value={fEnd} onChange={(e) => setFEnd(e.target.value)} /></div>
            </div>
            <div className="flex gap-3">
              {["08:00–16:00", "10:00–18:00", "14:00–22:00", "16:00–00:00"].map((preset) => {
                const [s, e] = preset.split("–");
                return (
                  <Button key={preset} variant="outline" size="sm" className="flex-1 text-xs"
                    onClick={() => { setFStart(s); setFEnd(e); }}>
                    {preset}
                  </Button>
                );
              })}
            </div>
            <div><label className="mb-1 block text-xs font-medium">Rola</label>
              <Input value={fRole} onChange={(e) => setFRole(e.target.value)} placeholder="np. Kelner, Kucharz" /></div>
            <div><label className="mb-1 block text-xs font-medium">Notatka</label>
              <Input value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder="opcjonalnie" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Anuluj</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Zapisywanie…" : "Zapisz"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
