"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Plus, Trash2, Settings, Usb, Radio } from "lucide-react";

interface CardReader {
  id: string;
  name: string;
  type: string;
  comPort: string | null;
  baudRate: number | null;
  dataBits: number | null;
  stopBits: number | null;
  parity: string | null;
  filePath: string | null;
  isActive: boolean;
  workstationId: string | null;
}

const READER_TYPES = [
  { id: "NFC", label: "NFC", icon: Radio },
  { id: "BARCODE", label: "Kod kreskowy", icon: CreditCard },
  { id: "CARD", label: "Karta magnetyczna", icon: CreditCard },
  { id: "MAGNETIC_COM", label: "Magnetyczny COM", icon: Usb },
  { id: "MAGNETIC_USB", label: "Magnetyczny USB", icon: Usb },
  { id: "RFID_CLAMSHELL", label: "RFID Clamshell", icon: Radio },
  { id: "DALLAS_DATAPROCESS", label: "Dallas Dataprocess", icon: CreditCard },
  { id: "DALLAS_DEMIURG", label: "Dallas Demiurg", icon: CreditCard },
  { id: "DALLAS_JARLTECH", label: "Dallas Jarltech", icon: CreditCard },
  { id: "DALLAS_MP00202", label: "Dallas MP00202", icon: CreditCard },
  { id: "FILE_READER", label: "Z pliku", icon: Settings },
];

export default function CardReadersPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CardReader>>({ type: "NFC" });

  const { data, isLoading } = useQuery({
    queryKey: ["card-readers"],
    queryFn: async () => {
      const res = await fetch("/api/card-readers");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CardReader>) => {
      const res = await fetch("/api/card-readers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-readers"] });
      setForm({ type: "NFC" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CardReader> & { id: string }) => {
      const res = await fetch("/api/card-readers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-readers"] });
      setEditingId(null);
      setForm({ type: "NFC" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/card-readers?id=${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["card-readers"] }),
  });

  const readers: CardReader[] = data?.readers ?? [];
  const typeDefaults = data?.typeDefaults ?? {};

  const handleTypeChange = (type: string) => {
    const defaults = typeDefaults[type] ?? {};
    setForm({ ...form, type, ...defaults });
  };

  const startEdit = (reader: CardReader) => {
    setEditingId(reader.id);
    setForm(reader);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ ...form, id: editingId } as CardReader & { id: string });
    } else if (form.name) {
      createMutation.mutate(form);
    }
  };

  const needsComConfig = ["MAGNETIC_COM", "RFID_CLAMSHELL", "DALLAS_DATAPROCESS", "DALLAS_DEMIURG", "DALLAS_JARLTECH", "DALLAS_MP00202"].includes(form.type ?? "");

  if (isLoading) {
    return <div className="p-6">Ładowanie...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-8 h-8" />
        <h1 className="text-2xl font-bold">Czytniki kart</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-4">{editingId ? "Edytuj czytnik" : "Nowy czytnik"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Nazwa</label>
            <input
              type="text"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Czytnik przy barze"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Typ</label>
            <select
              value={form.type ?? "NFC"}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {READER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {needsComConfig && (
            <>
              <div>
                <label className="block text-sm mb-1">Port COM</label>
                <input
                  type="text"
                  value={form.comPort ?? ""}
                  onChange={(e) => setForm({ ...form, comPort: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="COM1"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Baud rate</label>
                <select
                  value={form.baudRate ?? 9600}
                  onChange={(e) => setForm({ ...form, baudRate: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value={9600}>9600</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400</option>
                  <option value={57600}>57600</option>
                  <option value={115200}>115200</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Data bits</label>
                <select
                  value={form.dataBits ?? 8}
                  onChange={(e) => setForm({ ...form, dataBits: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value={7}>7</option>
                  <option value={8}>8</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Parity</label>
                <select
                  value={form.parity ?? "none"}
                  onChange={(e) => setForm({ ...form, parity: e.target.value })}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="none">None</option>
                  <option value="odd">Odd</option>
                  <option value="even">Even</option>
                </select>
              </div>
            </>
          )}

          {form.type === "FILE_READER" && (
            <div className="col-span-2">
              <label className="block text-sm mb-1">Ścieżka do pliku</label>
              <input
                type="text"
                value={form.filePath ?? ""}
                onChange={(e) => setForm({ ...form, filePath: e.target.value })}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="C:\czytnik\kod.txt"
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Aktywny
          </label>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={!form.name}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {editingId ? "Zapisz zmiany" : "Dodaj czytnik"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm({ type: "NFC" });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Anuluj
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {readers.map((reader) => {
          const typeInfo = READER_TYPES.find((t) => t.id === reader.type);
          const Icon = typeInfo?.icon ?? CreditCard;

          return (
            <div
              key={reader.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded flex items-center justify-center ${
                    reader.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold">{reader.name}</div>
                  <div className="text-sm text-gray-500">
                    {typeInfo?.label ?? reader.type}
                    {reader.comPort && ` | ${reader.comPort}`}
                    {reader.baudRate && ` @ ${reader.baudRate}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(reader)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Usunąć czytnik "${reader.name}"?`)) {
                      deleteMutation.mutate(reader.id);
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
        {readers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Brak skonfigurowanych czytników. Dodaj pierwszy powyżej.
          </div>
        )}
      </div>
    </div>
  );
}
