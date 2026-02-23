"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, RefreshCw, Play, HelpCircle } from "lucide-react";
import Link from "next/link";

type TemplatesData = {
  printer: { id: string; name: string; charsPerLine: number };
  templates: Record<string, string>;
  defaults: Record<string, string>;
  variables: Array<{ name: string; description: string }>;
};

const TEMPLATE_SECTIONS = [
  { key: "header", label: "Nagłówek", description: "Początek wydruku" },
  { key: "footer", label: "Stopka", description: "Koniec wydruku" },
  { key: "item", label: "Pozycja", description: "Pojedynczy produkt" },
  { key: "storno", label: "Storno", description: "Anulowana pozycja" },
  { key: "addon", label: "Dodatek", description: "Modyfikator/dodatek" },
  { key: "set", label: "Zestaw", description: "Pozycja zestawu" },
  { key: "component", label: "Składnik", description: "Składnik zestawu" },
  { key: "course", label: "Danie", description: "Separator kursu" },
  { key: "timer", label: "Minutnik", description: "Info o opóźnieniu" },
  { key: "fire", label: "Ogień", description: "Priorytet" },
  { key: "separator", label: "Separator", description: "Linia oddzielająca" },
];

export default function PrinterTemplatesClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [localTemplates, setLocalTemplates] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("header");
  const [showVariables, setShowVariables] = useState(false);

  const { data, isLoading } = useQuery<TemplatesData>({
    queryKey: ["printer-templates", id],
    queryFn: () => fetch(`/api/printers/${id}/templates`).then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (templates: Record<string, string>) =>
      fetch(`/api/printers/${id}/templates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templates),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printer-templates", id] });
      setLocalTemplates({});
      alert("Szablony zapisane");
    },
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/printers/${id}/templates`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printer-templates", id] });
      setLocalTemplates({});
      alert("Szablony przywrócone do domyślnych");
    },
  });

  const testMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/printers/${id}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMode: true }),
      }).then((r) => r.json()),
    onSuccess: (result) => {
      if (result.error) {
        alert(`Błąd: ${result.error}`);
      } else {
        alert("Wydruk testowy wysłany");
      }
    },
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <p>Ładowanie...</p>
      </div>
    );
  }

  const templates = { ...data.templates, ...localTemplates };
  const hasChanges = Object.keys(localTemplates).length > 0;

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById("template-editor") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = templates[activeTab] || "";
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      setLocalTemplates((prev) => ({ ...prev, [activeTab]: newValue }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settings" className="p-2 hover:bg-gray-700 rounded">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Szablony: {data.printer.name}</h1>
              <p className="text-sm text-gray-400">{data.printer.charsPerLine} znaków/linię</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Test
            </button>
            <button
              onClick={() => {
                if (confirm("Przywrócić wszystkie szablony do domyślnych?")) {
                  resetMutation.mutate();
                }
              }}
              disabled={resetMutation.isPending}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => saveMutation.mutate(localTemplates)}
              disabled={!hasChanges || saveMutation.isPending}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Zapisz
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-48 bg-gray-800 border-r border-gray-700 min-h-[calc(100vh-65px)]">
          <nav className="p-2 space-y-1">
            {TEMPLATE_SECTIONS.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveTab(section.key)}
                className={`w-full text-left px-3 py-2 rounded ${
                  activeTab === section.key ? "bg-blue-600" : "hover:bg-gray-700"
                }`}
              >
                <div className="font-medium">{section.label}</div>
                <div className="text-xs text-gray-400">{section.description}</div>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">
                {TEMPLATE_SECTIONS.find((s) => s.key === activeTab)?.label}
              </h2>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2 text-sm"
              >
                <HelpCircle className="w-4 h-4" />
                Zmienne
              </button>
            </div>

            {showVariables && (
              <div className="mb-4 bg-gray-700 rounded p-3">
                <h3 className="text-sm font-medium mb-2">Dostępne zmienne (kliknij aby wstawić)</h3>
                <div className="flex flex-wrap gap-2">
                  {data.variables.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => insertVariable(v.name)}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs font-mono"
                      title={v.description}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              id="template-editor"
              value={templates[activeTab] || ""}
              onChange={(e) => setLocalTemplates((prev) => ({ ...prev, [activeTab]: e.target.value }))}
              className="w-full h-64 bg-gray-900 border border-gray-600 rounded p-3 font-mono text-sm resize-y"
              placeholder={`Szablon dla: ${activeTab}`}
            />

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Podgląd (domyślny):</h3>
              <pre className="bg-gray-900 border border-gray-600 rounded p-3 font-mono text-xs text-gray-400 overflow-x-auto">
                {data.defaults[activeTab] || "(brak)"}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
