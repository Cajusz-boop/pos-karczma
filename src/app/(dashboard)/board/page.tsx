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
  Megaphone,
  Plus,
  RefreshCw,
  Pin,
  Trash2,
  AlertTriangle,
  Info,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  pinned: boolean;
  author: { id: string; name: string };
  expiresAt: string | null;
  createdAt: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "border-l-stone-300",
  NORMAL: "border-l-blue-400",
  HIGH: "border-l-amber-400",
  URGENT: "border-l-red-500 bg-red-50/50 dark:bg-red-950/10",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Niski",
  NORMAL: "Normalny",
  HIGH: "Ważne",
  URGENT: "Pilne",
};

export default function BoardPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [fTitle, setFTitle] = useState("");
  const [fContent, setFContent] = useState("");
  const [fPriority, setFPriority] = useState("NORMAL");
  const [fPinned, setFPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleCreate = async () => {
    if (!fTitle.trim() || !fContent.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fTitle.trim(),
          content: fContent.trim(),
          priority: fPriority,
          pinned: fPinned,
        }),
      });
      setCreateOpen(false);
      setFTitle(""); setFContent(""); setFPriority("NORMAL"); setFPinned(false);
      fetchAnnouncements();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Usunąć ogłoszenie?")) return;
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    fetchAnnouncements();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold">Tablica ogłoszeń</h1>
            <p className="text-sm text-muted-foreground">Komunikaty dla zespołu</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowe ogłoszenie
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className={cn("rounded-xl border-l-4 border p-4", PRIORITY_STYLES[a.priority])}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin className="h-4 w-4 text-amber-500" />}
                  {a.priority === "URGENT" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  {a.priority === "HIGH" && <Info className="h-4 w-4 text-amber-500" />}
                  <h3 className="font-semibold">{a.title}</h3>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{a.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.author.name} • {new Date(a.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {a.expiresAt && ` • Wygasa: ${new Date(a.expiresAt).toLocaleDateString("pl-PL")}`}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDelete(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!loading && announcements.length === 0 && (
        <div className="py-12 text-center">
          <Megaphone className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Brak ogłoszeń</p>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nowe ogłoszenie</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="mb-1 block text-sm font-medium">Tytuł *</label>
              <Input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="np. Zmiana menu od poniedziałku" autoFocus /></div>
            <div><label className="mb-1 block text-sm font-medium">Treść *</label>
              <textarea
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[100px]"
                value={fContent}
                onChange={(e) => setFContent(e.target.value)}
                placeholder="Szczegóły ogłoszenia…"
              /></div>
            <div className="flex gap-3">
              <div className="flex-1"><label className="mb-1 block text-sm font-medium">Priorytet</label>
                <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={fPriority} onChange={(e) => setFPriority(e.target.value)}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={fPinned} onChange={(e) => setFPinned(e.target.checked)} className="h-4 w-4 rounded" />
                  <Pin className="h-4 w-4" />
                  Przypnij
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Anuluj</Button>
            <Button onClick={handleCreate} disabled={saving || !fTitle.trim() || !fContent.trim()}>
              {saving ? "Publikowanie…" : "Opublikuj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
