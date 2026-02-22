"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, HardDrive, Monitor, Cpu, Database, Wifi, CheckCircle2, AlertCircle, Info, Trash2, RefreshCw, Clock, Server, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface ScannerReport {
  id: string;
  key: string;
  hostname: string;
  timestamp: string;
  platform: {
    system?: string;
    release?: string;
    machine?: string;
    edition?: string;
    build?: string;
  };
  checks: Record<string, { status?: string; detail?: string; version?: string; total_gb?: number; free_gb?: number; running?: boolean; is_admin?: boolean; enabled?: boolean; issues?: number[]; info?: Record<string, unknown> }>;
  bistro: Array<{
    path: string;
    version?: string;
    size_mb?: number;
    database_size_mb?: number;
    config_files?: string[];
    data_files?: Record<string, number>;
    printers?: Array<{ name?: string; type?: string; address?: string; port?: string; section?: string }>;
    operators?: Array<{ name?: string; role?: string; has_pin?: string }>;
  }>;
  recommendations: string[];
  network: {
    hostname?: string;
    local_ip?: string;
    gateway?: string;
    dns?: string[];
    interfaces?: Array<{ type: string; address: string }>;
    firewall?: { enabled?: boolean; profiles?: Record<string, boolean> };
  } | Array<{ name: string; value: string }>;
  hardware: {
    cpu?: { name?: string; cores?: number; arch?: string };
    memory?: { total_gb?: number; available_gb?: number; used_percent?: number };
    disk?: { total_gb?: number; free_gb?: number; used_percent?: number };
    displays?: Array<{ name: string; resolution: string }>;
    com_ports?: Array<{ port: string; description: string; source?: string }>;
    tcp_printers?: Array<{ address: string; type: string }>;
  };
  printers?: {
    com_ports?: Array<{ port: string; description: string; source?: string }>;
    windows?: Array<{ name: string; port: string; driver: string }>;
    network?: Array<{ address: string; port: number; type: string; full_address: string }>;
  };
  software?: {
    nodejs?: { installed?: boolean; version?: string };
    npm?: { installed?: boolean; version?: string };
    git?: { installed?: boolean; version?: string };
    python?: { version?: string; path?: string };
  };
  databases?: {
    mysql?: { running?: boolean; version?: string; service?: boolean };
    redis?: { running?: boolean; version?: string };
  };
  ports?: Record<string, { description: string; in_use: boolean; should_be_free: boolean; status: string }>;
}

function ReportCard({ report, onDelete }: { report: ScannerReport; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  
  const checksStatus = Object.values(report.checks);
  const criticalCount = checksStatus.filter(c => c?.status === 'fail').length;
  const warnCount = checksStatus.filter(c => c?.status === 'warn').length;
  
  // Obsłuż nowy format platform z edition
  const platformName = report.platform.edition || `${report.platform.system} ${report.platform.release}`;

  return (
    <div className="rounded-lg border">
      <div 
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <Server className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-semibold">{report.hostname}</p>
            <p className="text-sm text-muted-foreground">
              {platformName} • {report.platform.machine}
              {report.platform.build && ` (Build ${report.platform.build})`}
            </p>
            <p className="text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {format(new Date(report.timestamp), "d MMM yyyy, HH:mm", { locale: pl })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                {criticalCount} błędów
              </span>
            )}
            {warnCount > 0 && (
              <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {warnCount} ostrzeżeń
              </span>
            )}
            {criticalCount === 0 && warnCount === 0 && (
              <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                OK
              </span>
            )}
            {report.bistro.length > 0 && (
              <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Bistro: {report.bistro.length}
              </span>
            )}
          </div>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>
      
      {expanded && (
        <div className="border-t p-4 space-y-4">
          {/* Hardware info (new v3 format) */}
          {report.hardware?.cpu && (
            <div>
              <h4 className="font-medium mb-2">Sprzęt</h4>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {report.hardware.cpu && (
                  <div className="rounded bg-muted p-2">
                    <p className="text-xs text-muted-foreground">Procesor</p>
                    <p className="text-sm font-medium">{report.hardware.cpu.name}</p>
                    <p className="text-xs text-muted-foreground">{report.hardware.cpu.cores} rdzeni</p>
                  </div>
                )}
                {report.hardware.memory && (
                  <div className="rounded bg-muted p-2">
                    <p className="text-xs text-muted-foreground">RAM</p>
                    <p className="text-sm font-medium">{report.hardware.memory.total_gb?.toFixed(1)} GB</p>
                    <p className="text-xs text-muted-foreground">Wolne: {report.hardware.memory.available_gb?.toFixed(1)} GB</p>
                  </div>
                )}
                {report.hardware.disk && (
                  <div className="rounded bg-muted p-2">
                    <p className="text-xs text-muted-foreground">Dysk</p>
                    <p className="text-sm font-medium">{report.hardware.disk.free_gb?.toFixed(1)} GB wolne</p>
                    <p className="text-xs text-muted-foreground">z {report.hardware.disk.total_gb?.toFixed(1)} GB ({report.hardware.disk.used_percent}% zajęte)</p>
                  </div>
                )}
                {report.hardware.displays?.map((d, i) => (
                  <div key={i} className="rounded bg-muted p-2">
                    <p className="text-xs text-muted-foreground">Monitor {i + 1}</p>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.resolution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sprawdzenia */}
          <div>
            <h4 className="font-medium mb-2">Sprawdzenia systemu</h4>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {Object.entries(report.checks).map(([key, value]) => {
                if (key === 'ports') return null;
                const status = value?.status;
                const bgColor = status === 'ok' ? 'bg-green-50 dark:bg-green-950' : 
                               status === 'warn' ? 'bg-amber-50 dark:bg-amber-950' : 
                               status === 'fail' ? 'bg-red-50 dark:bg-red-950' : 'bg-muted';
                
                let detail = value?.detail || value?.version || '';
                if (key === 'memory' && value?.total_gb) detail = `${value.total_gb.toFixed(1)} GB`;
                if (key === 'disk' && value?.free_gb) detail = `${value.free_gb.toFixed(1)} GB wolne`;
                if (key === 'nodejs' && value?.version) detail = `v${value.version}`;
                if (key === 'admin') detail = value?.is_admin ? 'Administrator' : 'Użytkownik';
                if (key === 'firewall') detail = value?.enabled ? 'Włączony' : 'Wyłączony';
                
                return (
                  <div key={key} className={`rounded p-2 ${bgColor}`}>
                    <p className="text-sm font-medium capitalize">{key}</p>
                    <p className="text-xs text-muted-foreground">{detail || '-'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Porty - obsłuż oba formaty */}
          {(report.ports || report.checks.ports) && (
            <div>
              <h4 className="font-medium mb-2">Porty sieciowe</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(report.ports || report.checks.ports as Record<string, { in_use: boolean; description: string; should_be_free?: boolean; status?: string }>).map(([port, info]) => {
                  const status = info.status || (info.in_use ? 'ok' : 'info');
                  const bgClass = status === 'warn' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                                 info.in_use ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted';
                  return (
                    <span key={port} className={`rounded px-2 py-1 text-xs ${bgClass}`}>
                      {port} ({info.description}) {info.in_use ? '✓' : '-'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sieć - obsłuż oba formaty */}
          {(report.network && (Array.isArray(report.network) ? report.network.length > 0 : report.network.local_ip)) && (
            <div>
              <h4 className="font-medium mb-2">Sieć</h4>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(report.network) ? (
                  report.network.map((n, i) => (
                    <span key={i} className="rounded bg-muted px-2 py-1 text-xs">
                      {n.name}: <strong>{n.value}</strong>
                    </span>
                  ))
                ) : (
                  <>
                    {report.network.hostname && (
                      <span className="rounded bg-muted px-2 py-1 text-xs">
                        Hostname: <strong>{report.network.hostname}</strong>
                      </span>
                    )}
                    {report.network.local_ip && (
                      <span className="rounded bg-muted px-2 py-1 text-xs">
                        IP: <strong>{report.network.local_ip}</strong>
                      </span>
                    )}
                    {report.network.gateway && (
                      <span className="rounded bg-muted px-2 py-1 text-xs">
                        Brama: <strong>{report.network.gateway}</strong>
                      </span>
                    )}
                    {report.network.dns && report.network.dns.length > 0 && (
                      <span className="rounded bg-muted px-2 py-1 text-xs">
                        DNS: <strong>{report.network.dns.join(', ')}</strong>
                      </span>
                    )}
                    {report.network.firewall?.enabled && (
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        Firewall: włączony
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Drukarki - obsłuż oba formaty */}
          {(report.printers || report.hardware?.com_ports?.length || report.hardware?.tcp_printers?.length) && (
            <div>
              <h4 className="font-medium mb-2">Drukarki i czytniki</h4>
              <div className="space-y-2 text-sm">
                {/* COM ports */}
                {(report.printers?.com_ports || report.hardware?.com_ports)?.map((p, i) => (
                  <p key={`com-${i}`} className="text-muted-foreground">
                    <span className="rounded bg-muted px-1 text-xs">COM</span> {p.port}: {p.description}
                  </p>
                ))}
                {/* Windows printers (new) */}
                {report.printers?.windows?.map((p, i) => (
                  <p key={`win-${i}`} className="text-muted-foreground">
                    <span className="rounded bg-blue-100 px-1 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">Windows</span> {p.name} @ {p.port}
                  </p>
                ))}
                {/* Network printers */}
                {(report.printers?.network || report.hardware?.tcp_printers)?.map((p, i) => (
                  <p key={`net-${i}`} className="text-muted-foreground">
                    <span className="rounded bg-green-100 px-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">Sieć</span> {'full_address' in p ? p.full_address : p.address} ({p.type})
                  </p>
                ))}
                {!report.printers?.com_ports?.length && !report.printers?.windows?.length && !report.printers?.network?.length && 
                 !report.hardware?.com_ports?.length && !report.hardware?.tcp_printers?.length && (
                  <p className="text-muted-foreground">Nie wykryto drukarek ani czytników</p>
                )}
              </div>
            </div>
          )}

          {/* Bistro Simplex */}
          {report.bistro.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                Wykryte instalacje Bistro Simplex
              </h4>
              {report.bistro.map((b, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-sm font-medium">{b.path}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {b.version && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs dark:bg-blue-900">v{b.version}</span>
                    )}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {(b.size_mb || b.database_size_mb)?.toFixed(1) || '?'} MB
                    </span>
                  </div>
                  {b.config_files && b.config_files.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Konfiguracja: {b.config_files.slice(0, 3).join(', ')}
                      {b.config_files.length > 3 && ` +${b.config_files.length - 3}`}
                    </p>
                  )}
                  {b.data_files && Object.keys(b.data_files).length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Dane: {Object.entries(b.data_files).slice(0, 4).map(([ext, cnt]) => `${ext}: ${cnt}`).join(', ')}
                    </p>
                  )}
                  {b.printers && b.printers.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs font-medium">Drukarki ({b.printers.length}):</p>
                      {b.printers.slice(0, 5).map((p, j) => (
                        <p key={j} className="text-xs text-muted-foreground ml-2">
                          • {p.name || p.section || 'Drukarka'}: {p.type || '?'} @ {p.address || p.port || 'brak'}
                        </p>
                      ))}
                      {b.printers.length > 5 && (
                        <p className="text-xs text-muted-foreground ml-2">
                          ... i {b.printers.length - 5} więcej
                        </p>
                      )}
                    </div>
                  )}
                  {b.operators && b.operators.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs font-medium">Operatorzy ({b.operators.length}):</p>
                      {b.operators.slice(0, 5).map((o, j) => (
                        <p key={j} className="text-xs text-muted-foreground ml-2">
                          • {o.name} ({o.role || 'brak roli'}){o.has_pin ? ' 🔑' : ''}
                        </p>
                      ))}
                      {b.operators.length > 5 && (
                        <p className="text-xs text-muted-foreground ml-2">
                          ... i {b.operators.length - 5} więcej
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Rekomendacje */}
          {report.recommendations.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <h4 className="font-medium mb-2 text-amber-800 dark:text-amber-200">Rekomendacje</h4>
              <ul className="space-y-1">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-300">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Akcje */}
          <div className="flex justify-end pt-2">
            <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="mr-1 h-4 w-4" />
              Usuń raport
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ToolsPage() {
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState("");

  // Pobierz URL serwera
  useState(() => {
    if (typeof window !== "undefined") {
      setServerUrl(window.location.origin);
    }
  });

  // Pobierz raporty
  const { data: reports = [], isLoading: reportsLoading, refetch: refetchReports } = useQuery<ScannerReport[]>({
    queryKey: ["scanner-reports"],
    queryFn: async () => {
      const res = await fetch("/api/tools/scanner/reports");
      if (!res.ok) throw new Error("Błąd");
      return res.json();
    },
  });

  // Usuń raport
  const deleteReport = useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch(`/api/tools/scanner/reports?key=${encodeURIComponent(key)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Błąd usuwania");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scanner-reports"] });
    },
  });

  const downloadScanner = async () => {
    setDownloading(true);
    setDownloadError(null);
    
    try {
      const response = await fetch("/api/tools/scanner");
      
      if (!response.ok) {
        throw new Error("Błąd pobierania");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pos_skaner_pakiet.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setDownloadError("Nie udało się pobrać skanera. Spróbuj ponownie.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container max-w-3xl space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Narzędzia instalacyjne</h1>
          <p className="text-sm text-muted-foreground">
            Narzędzia do przygotowania nowego stanowiska POS
          </p>
        </div>
      </div>

      {/* Skaner środowiskowy */}
      <section className="rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
            <HardDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Skaner środowiskowy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Narzędzie do sprawdzenia gotowości komputera przed instalacją POS Karczma.
              Wykrywa również istniejące instalacje Bistro Simplex.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded bg-muted/50 p-3">
                <Monitor className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">System i zasoby</p>
                  <p className="text-xs text-muted-foreground">RAM, dysk, Windows</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded bg-muted/50 p-3">
                <Cpu className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Oprogramowanie</p>
                  <p className="text-xs text-muted-foreground">Node.js, npm, Python</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded bg-muted/50 p-3">
                <Database className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Bazy danych</p>
                  <p className="text-xs text-muted-foreground">MySQL, Redis</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded bg-muted/50 p-3">
                <Wifi className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Porty i drukarki</p>
                  <p className="text-xs text-muted-foreground">COM, TCP/IP, sieć</p>
                </div>
              </div>
            </div>

            {/* Bistro Simplex */}
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Wykrywanie Bistro Simplex
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                    Skaner automatycznie znajdzie istniejące instalacje Bistro Simplex
                    i odczyta konfigurację drukarek, operatorów oraz ustawień - 
                    ułatwi to migrację na nowy system.
                  </p>
                </div>
              </div>
            </div>

            {/* Wymagania */}
            <div className="mt-4 rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Wymagania na docelowym komputerze:</p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="https://www.python.org/downloads/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.372 0 6 2.69 6 2.69v2.81h6v1H4s-4-.452-4 6c0 6.452 3.477 6.22 3.477 6.22H5.5v-3c0-3.867 3.477-3.72 3.477-3.72h5.973s3.29.052 3.29-3.22V3.69S18.628 0 12 0zm-2.59 1.5a.975.975 0 11-.002 1.95.975.975 0 01.002-1.95z"/>
                    <path d="M12 24c6.628 0 6-2.69 6-2.69v-2.81h-6v-1h8s4 .452 4-6c0-6.452-3.477-6.22-3.477-6.22H18.5v3c0 3.867-3.477 3.72-3.477 3.72h-5.973s-3.29-.052-3.29 3.22v5.09S5.372 24 12 24zm2.59-1.5a.975.975 0 110-1.95.975.975 0 010 1.95z"/>
                  </svg>
                  Python 3.10+
                </a>
                <span className="flex items-center gap-2 rounded bg-muted px-3 py-1.5 text-sm">
                  <Monitor className="h-4 w-4" />
                  Windows 10/11
                </span>
              </div>
            </div>

            {/* Download button */}
            <div className="mt-6">
              <Button 
                onClick={downloadScanner} 
                disabled={downloading}
                className="gap-2"
                size="lg"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Pobieranie..." : "Pobierz skaner (ZIP)"}
              </Button>
              
              {downloadError && (
                <p className="mt-2 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {downloadError}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Instrukcja */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Jak użyć skanera</h2>
        
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <div>
              <p className="font-medium">Pobierz pakiet ZIP</p>
              <p className="text-sm text-muted-foreground">
                Kliknij przycisk powyżej i zapisz plik na pendrive lub udostępnij przez sieć
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <div>
              <p className="font-medium">Rozpakuj na docelowym komputerze</p>
              <p className="text-sm text-muted-foreground">
                Kliknij prawym → &quot;Wyodrębnij wszystko&quot; lub przeciągnij pliki do folderu
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <div>
              <p className="font-medium">Zainstaluj Python (jeśli brak)</p>
              <p className="text-sm text-muted-foreground">
                Pobierz z{" "}
                <a 
                  href="https://www.python.org/downloads/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  python.org/downloads
                </a>
              </p>
              <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-800 dark:bg-amber-950">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  ⚠️ WAŻNE podczas instalacji Pythona:
                </p>
                <ul className="mt-1 list-inside list-disc text-amber-700 dark:text-amber-300">
                  <li>Zaznacz <strong>&quot;Add Python to PATH&quot;</strong> (na dole okna instalatora)</li>
                  <li>Kliknij &quot;Install Now&quot;</li>
                </ul>
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              4
            </span>
            <div>
              <p className="font-medium">Uruchom skaner</p>
              <p className="text-sm text-muted-foreground">
                Kliknij dwukrotnie na <code className="rounded bg-muted px-1">uruchom_skaner.bat</code>
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              5
            </span>
            <div>
              <p className="font-medium">Sprawdź wyniki</p>
              <p className="text-sm text-muted-foreground">
                Skaner utworzy plik JSON z raportem. Prześlij go aby omówić wymagania.
              </p>
            </div>
          </li>
        </ol>
      </section>

      {/* Legenda wyników */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Legenda wyników skanera</h2>
        
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded bg-green-50 p-3 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">[OK]</p>
              <p className="text-sm text-green-700 dark:text-green-300">Wymaganie spełnione</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded bg-amber-50 p-3 dark:bg-amber-950">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">[!] Ostrzeżenie</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">System może działać</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded bg-red-50 p-3 dark:bg-red-950">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">[X] Błąd</p>
              <p className="text-sm text-red-700 dark:text-red-300">Wymagane do naprawy</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded bg-blue-50 p-3 dark:bg-blue-950">
            <Info className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">[*] Znaleziono</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Np. instalację Bistro</p>
            </div>
          </div>
        </div>
      </section>

      {/* Odebrane raporty */}
      <section className="rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Odebrane raporty ze skanerów</h2>
            <p className="text-sm text-muted-foreground">
              Raporty przesłane automatycznie z innych komputerów
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchReports()} disabled={reportsLoading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${reportsLoading ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <Server className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">Brak odebranych raportów</p>
            <p className="text-sm text-muted-foreground">
              Po uruchomieniu skanera na innym komputerze, raport pojawi się tutaj automatycznie
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportCard 
                key={report.key} 
                report={report} 
                onDelete={() => deleteReport.mutate(report.key)}
              />
            ))}
          </div>
        )}

        {/* Instrukcja dla skanera */}
        <div className="mt-4 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium mb-2">Adres serwera do wpisania w skanerze:</p>
          <code className="block rounded bg-muted px-3 py-2 text-sm font-mono select-all">
            {typeof window !== "undefined" ? window.location.origin : "http://adres-serwera:3000"}
          </code>
          <p className="mt-2 text-xs text-muted-foreground">
            Skaner zapyta o ten adres po zakończeniu skanowania. Wpisz go, aby automatycznie przesłać raport.
          </p>
        </div>
      </section>
    </div>
  );
}
