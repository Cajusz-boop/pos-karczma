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
  LayoutGrid,
  Plus,
  RefreshCw,
  ArrowLeft,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Snowflake,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface TableData {
  id: string;
  number: number;
  seats: number;
  shape: string;
  status: string;
  positionX: number;
  positionY: number;
}

interface RoomData {
  id: string;
  name: string;
  capacity: number;
  type: string;
  isSeasonal: boolean;
  sortOrder: number;
  tables: TableData[];
}

const ROOM_TYPES = [
  { value: "RESTAURANT", label: "Restauracja" },
  { value: "TERRACE", label: "Taras" },
  { value: "BANQUET", label: "Sala bankietowa" },
  { value: "BAR", label: "Bar" },
  { value: "VIP", label: "VIP" },
];

const TABLE_SHAPES = [
  { value: "RECTANGLE", label: "Prostokąt" },
  { value: "ROUND", label: "Okrągły" },
  { value: "SQUARE", label: "Kwadrat" },
  { value: "BAR", label: "Bar" },
];

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Room dialog
  const [roomOpen, setRoomOpen] = useState(false);
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [rName, setRName] = useState("");
  const [rCapacity, setRCapacity] = useState("50");
  const [rType, setRType] = useState("RESTAURANT");
  const [rSeasonal, setRSeasonal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Table dialog
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRoomId, setTableRoomId] = useState("");
  const [editTableId, setEditTableId] = useState<string | null>(null);
  const [tNumber, setTNumber] = useState("");
  const [tSeats, setTSeats] = useState("4");
  const [tShape, setTShape] = useState("RECTANGLE");

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms?all=true");
      const data = await res.json();
      setRooms(data ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const toggle = (id: string) => {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  // Room CRUD
  const openCreateRoom = () => {
    setEditRoomId(null); setRName(""); setRCapacity("50"); setRType("RESTAURANT"); setRSeasonal(false);
    setRoomOpen(true);
  };
  const openEditRoom = (r: RoomData) => {
    setEditRoomId(r.id); setRName(r.name); setRCapacity(String(r.capacity)); setRType(r.type); setRSeasonal(r.isSeasonal);
    setRoomOpen(true);
  };
  const saveRoom = async () => {
    if (!rName.trim()) return;
    setSaving(true);
    try {
      if (editRoomId) {
        await fetch("/api/rooms", { method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: editRoomId, name: rName.trim(), capacity: parseInt(rCapacity) || 50, type: rType, isSeasonal: rSeasonal }) });
      } else {
        await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: rName.trim(), capacity: parseInt(rCapacity) || 50, type: rType, isSeasonal: rSeasonal }) });
      }
      setRoomOpen(false); fetchRooms();
    } catch { /* ignore */ } finally { setSaving(false); }
  };
  const toggleRoom = async (id: string, isActive: boolean) => {
    await fetch("/api/rooms", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: id, isActive: !isActive }) });
    fetchRooms();
  };
  const deleteRoom = async (id: string) => {
    if (!confirm("Usunąć salę?")) return;
    const res = await fetch(`/api/rooms?roomId=${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    fetchRooms();
  };

  // Table CRUD
  const openAddTable = (roomId: string) => {
    setEditTableId(null); setTableRoomId(roomId);
    const room = rooms.find((r) => r.id === roomId);
    const maxNum = room ? Math.max(0, ...room.tables.map((t) => t.number)) : 0;
    setTNumber(String(maxNum + 1)); setTSeats("4"); setTShape("RECTANGLE");
    setTableOpen(true);
  };
  const openEditTable = (roomId: string, t: TableData) => {
    setEditTableId(t.id); setTableRoomId(roomId);
    setTNumber(String(t.number)); setTSeats(String(t.seats)); setTShape(t.shape);
    setTableOpen(true);
  };
  const saveTable = async () => {
    setSaving(true);
    try {
      if (editTableId) {
        await fetch("/api/rooms", { method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tableId: editTableId, number: parseInt(tNumber), seats: parseInt(tSeats), shape: tShape }) });
      } else {
        await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: tableRoomId, number: parseInt(tNumber), seats: parseInt(tSeats), shape: tShape }) });
      }
      setTableOpen(false); fetchRooms();
    } catch { /* ignore */ } finally { setSaving(false); }
  };
  const deleteTable = async (id: string) => {
    if (!confirm("Usunąć stolik?")) return;
    const res = await fetch(`/api/rooms?tableId=${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    fetchRooms();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <LayoutGrid className="h-7 w-7 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold">Sale i stoliki</h1>
            <p className="text-sm text-muted-foreground">{rooms.length} sal, {rooms.reduce((s, r) => s + r.tables.length, 0)} stolików</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRooms} disabled={loading}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button size="sm" onClick={openCreateRoom}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nowa sala
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {rooms.map((room) => (
          <div key={room.id} className="rounded-xl border">
            <button type="button" className="flex w-full items-center justify-between p-3 text-left" onClick={() => toggle(room.id)}>
              <div className="flex items-center gap-2">
                {expanded.has(room.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">{room.name}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{ROOM_TYPES.find((t) => t.value === room.type)?.label}</span>
                {room.isSeasonal && <Snowflake className="h-4 w-4 text-cyan-500" />}
                <span className="text-xs text-muted-foreground">{room.tables.length} stolików • {room.capacity} miejsc</span>
              </div>
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRoom(room.id, true)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRoom(room)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRoom(room.id)} disabled={room.tables.length > 0}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </button>
            {expanded.has(room.id) && (
              <div className="border-t px-3 pb-3 pt-2 space-y-1">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {room.tables.sort((a, b) => a.number - b.number).map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border p-2">
                      <div>
                        <p className="font-bold">#{t.number}</p>
                        <p className="text-xs text-muted-foreground">{t.seats} miejsc • {TABLE_SHAPES.find((s) => s.value === t.shape)?.label}</p>
                      </div>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTable(room.id, t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTable(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => openAddTable(room.id)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Dodaj stolik
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Room dialog */}
      <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editRoomId ? "Edytuj salę" : "Nowa sala"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="mb-1 block text-sm font-medium">Nazwa *</label>
              <Input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="np. Restauracja" autoFocus /></div>
            <div className="flex gap-3">
              <div className="flex-1"><label className="mb-1 block text-sm font-medium">Pojemność</label>
                <Input type="number" min="1" value={rCapacity} onChange={(e) => setRCapacity(e.target.value)} /></div>
              <div className="flex-1"><label className="mb-1 block text-sm font-medium">Typ</label>
                <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={rType} onChange={(e) => setRType(e.target.value)}>
                  {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rSeasonal} onChange={(e) => setRSeasonal(e.target.checked)} className="h-4 w-4 rounded" />
              <Snowflake className="h-4 w-4 text-cyan-500" />
              <span>Sezonowa</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomOpen(false)}>Anuluj</Button>
            <Button onClick={saveRoom} disabled={saving || !rName.trim()}>{saving ? "Zapisywanie…" : editRoomId ? "Zapisz" : "Utwórz"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table dialog */}
      <Dialog open={tableOpen} onOpenChange={setTableOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editTableId ? "Edytuj stolik" : "Nowy stolik"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1"><label className="mb-1 block text-sm font-medium">Numer *</label>
                <Input type="number" min="1" value={tNumber} onChange={(e) => setTNumber(e.target.value)} autoFocus /></div>
              <div className="flex-1"><label className="mb-1 block text-sm font-medium">Miejsca</label>
                <Input type="number" min="1" value={tSeats} onChange={(e) => setTSeats(e.target.value)} /></div>
            </div>
            <div><label className="mb-1 block text-sm font-medium">Kształt</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={tShape} onChange={(e) => setTShape(e.target.value)}>
                {TABLE_SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableOpen(false)}>Anuluj</Button>
            <Button onClick={saveTable} disabled={saving || !tNumber}>{saving ? "Zapisywanie…" : editTableId ? "Zapisz" : "Dodaj"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
