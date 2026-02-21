"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Save,
  RefreshCw,
  ArrowLeft,
  Merge,
  Unlink,
  Undo2,
} from "lucide-react";
import Link from "next/link";

interface TableData {
  id: string;
  number: number;
  seats: number;
  shape: string;
  positionX: number;
  positionY: number;
}

interface RoomData {
  id: string;
  name: string;
  tables: TableData[];
}

const GRID_SIZE = 20;
const TABLE_W = 80;
const TABLE_H = 60;

function snapToGrid(val: number): number {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

export default function TableLayoutPage() {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergedGroups, setMergedGroups] = useState<string[][]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms?all=true");
      const data = await res.json();
      setRooms(data ?? []);
      if (data?.length > 0 && !selectedRoom) {
        setSelectedRoom(data[0].id);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [selectedRoom]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // Initialize positions from room data
  useEffect(() => {
    const room = rooms.find((r) => r.id === selectedRoom);
    if (!room) return;
    const map = new Map<string, { x: number; y: number }>();
    room.tables.forEach((t) => {
      map.set(t.id, { x: t.positionX || 0, y: t.positionY || 0 });
    });
    setPositions(map);
    setDirty(false);
    setSelected(new Set());
  }, [selectedRoom, rooms]);

  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const tables = currentRoom?.tables ?? [];

  const handleMouseDown = (tableId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const pos = positions.get(tableId) ?? { x: 0, y: 0 };
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging(tableId);
    setDragOffset({
      x: e.clientX - rect.left - pos.x,
      y: e.clientY - rect.top - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = snapToGrid(Math.max(0, e.clientX - rect.left - dragOffset.x));
    const y = snapToGrid(Math.max(0, e.clientY - rect.top - dragOffset.y));
    setPositions((prev) => {
      const next = new Map(prev);
      next.set(dragging, { x, y });
      return next;
    });
    setDirty(true);
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleTableClick = (tableId: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(tableId)) next.delete(tableId); else next.add(tableId);
        return next;
      });
    } else {
      setSelected(new Set([tableId]));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Array.from(positions.entries()).map(([tableId, pos]) => ({
        tableId,
        positionX: pos.x,
        positionY: pos.y,
      }));

      for (const u of updates) {
        await fetch("/api/rooms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(u),
        });
      }
      setDirty(false);
      fetchRooms();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const handleReset = () => {
    const room = rooms.find((r) => r.id === selectedRoom);
    if (!room) return;
    const map = new Map<string, { x: number; y: number }>();
    room.tables.forEach((t) => {
      map.set(t.id, { x: t.positionX || 0, y: t.positionY || 0 });
    });
    setPositions(map);
    setDirty(false);
  };

  const autoArrange = () => {
    const cols = Math.ceil(Math.sqrt(tables.length));
    const map = new Map<string, { x: number; y: number }>();
    tables.sort((a, b) => a.number - b.number).forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      map.set(t.id, { x: col * (TABLE_W + 40) + 40, y: row * (TABLE_H + 40) + 40 });
    });
    setPositions(map);
    setDirty(true);
  };

  const handleMergeTables = () => {
    if (selected.size < 2) return;
    const ids = Array.from(selected);
    // Position merged tables next to each other
    const firstPos = positions.get(ids[0]) ?? { x: 40, y: 40 };
    const newPositions = new Map(positions);
    ids.forEach((id, i) => {
      newPositions.set(id, {
        x: firstPos.x + i * (TABLE_W + 4),
        y: firstPos.y,
      });
    });
    setPositions(newPositions);
    setMergedGroups((prev) => {
      // Remove any existing groups that overlap with new selection
      const filtered = prev.filter((g) => !g.some((id) => ids.includes(id)));
      return [...filtered, ids];
    });
    setDirty(true);
    setSelected(new Set());
  };

  const handleUnmerge = () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    setMergedGroups((prev) => prev.filter((g) => !g.some((id) => ids.includes(id))));
    setDirty(true);
    setSelected(new Set());
  };

  const getMergeGroup = (tableId: string): string[] | undefined => {
    return mergedGroups.find((g) => g.includes(tableId));
  };

  const getTableShape = (shape: string) => {
    switch (shape) {
      case "ROUND": return "rounded-full";
      case "SQUARE": return "rounded-lg aspect-square";
      case "BAR": return "rounded-lg";
      default: return "rounded-lg";
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/settings/rooms">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <LayoutGrid className="h-6 w-6 text-indigo-500" />
          <h1 className="text-lg font-bold">Edytor układu stolików</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border bg-background px-3 py-2 text-sm font-medium"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.tables.length} stolików)</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={autoArrange}>
            <Merge className="mr-1.5 h-4 w-4" />
            Auto-układ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMergeTables}
            disabled={selected.size < 2}
            title="Zaznacz 2+ stoliki (Ctrl+klik) i połącz"
          >
            <Merge className="mr-1.5 h-4 w-4" />
            Połącz ({selected.size})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnmerge}
            disabled={selected.size === 0 || !Array.from(selected).some((id) => getMergeGroup(id))}
            title="Rozłącz zaznaczone stoliki"
          >
            <Unlink className="mr-1.5 h-4 w-4" />
            Rozłącz
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!dirty}>
            <Undo2 className="mr-1.5 h-4 w-4" />
            Cofnij
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || saving} className="gap-1.5">
            <Save className="h-4 w-4" />
            {saving ? "Zapisywanie…" : "Zapisz układ"}
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div
          ref={canvasRef}
          className="relative min-h-[600px] min-w-[800px]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {tables.map((table) => {
            const pos = positions.get(table.id) ?? { x: 0, y: 0 };
            const isSelected = selected.has(table.id);
            const isDragging = dragging === table.id;

            return (
              <div
                key={table.id}
                className={cn(
                  "absolute flex cursor-grab flex-col items-center justify-center border-2 bg-background shadow-sm transition-shadow select-none",
                  getTableShape(table.shape),
                  isDragging && "cursor-grabbing shadow-lg z-10",
                  isSelected ? "border-indigo-500 ring-2 ring-indigo-300"
                    : getMergeGroup(table.id) ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-muted-foreground/30",
                )}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: table.shape === "ROUND" || table.shape === "SQUARE" ? TABLE_H : TABLE_W,
                  height: TABLE_H,
                }}
                onMouseDown={(e) => handleMouseDown(table.id, e)}
                onClick={(e) => handleTableClick(table.id, e)}
              >
                <span className="text-lg font-black">{table.number}</span>
                <span className="text-[10px] text-muted-foreground">{table.seats} os.</span>
                {getMergeGroup(table.id) && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
                    M
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <footer className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <span>Przeciągnij stoliki na mapę • Ctrl+klik = zaznacz wiele • Zaznacz 2+ → Połącz • Siatka: {GRID_SIZE}px</span>
        <span>
          {dirty && <span className="mr-2 font-medium text-amber-600">Niezapisane zmiany</span>}
          {tables.length} stolików
        </span>
      </footer>
    </div>
  );
}
