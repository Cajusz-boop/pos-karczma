"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { useTokenReader } from "@/lib/hooks/useTokenReader";
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
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  KeyRound,
  Users,
  Link2,
  Unlink,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface UserRow {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  authMethod: string;
  tokenId: string | null;
  tokenType: string | null;
  isOwner: boolean;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const TOKEN_TYPES = [
  { value: "NFC", label: "NFC / Dallas iButton" },
  { value: "BARCODE", label: "Kod kreskowy" },
  { value: "CARD", label: "Karta" },
];

interface RoleOption {
  id: string;
  name: string;
  permissions: unknown;
}

const AUTH_METHODS = [
  { value: "PIN", label: "PIN" },
  { value: "NFC", label: "NFC" },
  { value: "BARCODE", label: "Kod kreskowy" },
  { value: "CARD", label: "Karta" },
];

/* ─── Main Page ──────────────────────────────────────────────────────── */

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [pinUserId, setPinUserId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPin, setFormPin] = useState("");
  const [formRoleId, setFormRoleId] = useState("");
  const [formIsOwner, setFormIsOwner] = useState(false);
  const [formAuthMethod, setFormAuthMethod] = useState("PIN");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  // PIN change form
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Token pairing
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [pairUserId, setPairUserId] = useState<string | null>(null);
  const [pairUserName, setPairUserName] = useState("");
  const [pairTokenId, setPairTokenId] = useState("");
  const [pairTokenType, setPairTokenType] = useState("NFC");
  const [pairListening, setPairListening] = useState(false);
  const [pairDetected, setPairDetected] = useState(false);

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const r = await fetch("/api/users?all=true");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
  });

  const { data: roles = [] } = useQuery<RoleOption[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const r = await fetch("/api/roles");
      if (!r.ok) throw new Error("Błąd");
      return r.json();
    },
  });

  const filteredUsers = useMemo(() => {
    let list = users;
    if (!showInactive) {
      list = list.filter((u) => u.isActive);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.roleName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, showInactive, search]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  // Create user
  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: formName,
        pin: formPin,
        roleId: formRoleId,
        isOwner: formIsOwner,
        authMethod: formAuthMethod,
        expiresAt: formExpiresAt || null,
      };
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd tworzenia użytkownika");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      closeDialog();
    },
  });

  // Update user
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingUser) return;
      const body: Record<string, unknown> = {};
      if (formName !== editingUser.name) body.name = formName;
      if (formRoleId !== editingUser.roleId) body.roleId = formRoleId;
      if (formIsOwner !== editingUser.isOwner) body.isOwner = formIsOwner;
      if (formAuthMethod !== editingUser.authMethod) body.authMethod = formAuthMethod;
      const expires = formExpiresAt || null;
      const existingExpires = editingUser.expiresAt ? editingUser.expiresAt.split("T")[0] : null;
      if (expires !== existingExpires) body.expiresAt = expires;

      if (Object.keys(body).length === 0) return;

      const r = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd aktualizacji");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      closeDialog();
    },
  });

  // Change PIN
  const changePinMutation = useMutation({
    mutationFn: async () => {
      if (!pinUserId) return;
      const r = await fetch(`/api/users/${pinUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd zmiany PIN");
      }
      return r.json();
    },
    onSuccess: () => {
      setPinDialogOpen(false);
      setPinUserId(null);
      setNewPin("");
      setConfirmPin("");
    },
  });

  // Soft delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd");
      }
    },
    onSuccess: invalidate,
  });

  // Restore
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!r.ok) throw new Error("Błąd");
    },
    onSuccess: invalidate,
  });

  // Pair token
  const pairTokenMutation = useMutation({
    mutationFn: async () => {
      if (!pairUserId || !pairTokenId) return;
      const r = await fetch(`/api/users/${pairUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: pairTokenId, tokenType: pairTokenType }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "Błąd parowania");
      }
      return r.json();
    },
    onSuccess: () => {
      invalidate();
      setPairDialogOpen(false);
      setPairUserId(null);
      setPairTokenId("");
      setPairDetected(false);
    },
  });

  // Unpair token
  const unpairTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: null, tokenType: null }),
      });
      if (!r.ok) throw new Error("Błąd");
    },
    onSuccess: invalidate,
  });

  // Token reader for pairing
  const handlePairTokenDetected = useCallback((tokenId: string) => {
    setPairTokenId(tokenId);
    setPairDetected(true);
    setPairListening(false);
  }, []);

  useTokenReader({
    onToken: handlePairTokenDetected,
    enabled: pairDialogOpen && pairListening,
  });

  const openCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormPin("");
    setFormRoleId(roles[0]?.id ?? "");
    setFormIsOwner(false);
    setFormAuthMethod("PIN");
    setFormExpiresAt("");
    setDialogOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormPin("");
    setFormRoleId(u.roleId);
    setFormIsOwner(u.isOwner);
    setFormAuthMethod(u.authMethod);
    setFormExpiresAt(u.expiresAt ? u.expiresAt.split("T")[0] : "");
    setDialogOpen(true);
  };

  const openPinChange = (userId: string) => {
    setPinUserId(userId);
    setNewPin("");
    setConfirmPin("");
    setPinDialogOpen(true);
  };

  const openPairDialog = (u: UserRow) => {
    setPairUserId(u.id);
    setPairUserName(u.name);
    setPairTokenId(u.tokenId ?? "");
    setPairTokenType(u.tokenType ?? "NFC");
    setPairDetected(false);
    setPairListening(false);
    setPairDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = () => {
    if (editingUser) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isFormValid = editingUser
    ? formName.trim().length > 0 && formRoleId
    : formName.trim().length > 0 && formPin.length >= 4 && /^\d+$/.test(formPin) && formRoleId;

  const isPinValid = newPin.length >= 4 && /^\d+$/.test(newPin) && newPin === confirmPin;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pl-PL");
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Użytkownicy</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy użytkownik
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj użytkownika…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showInactive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
          {showInactive ? "Pokaż nieaktywnych" : "Ukryj nieaktywnych"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {filteredUsers.length} {filteredUsers.length === 1 ? "użytkownik" : "użytkowników"}
        </span>
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="mb-2 h-10 w-10" />
          <p>Brak użytkowników{search ? " pasujących do wyszukiwania" : ""}</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left font-medium">Imię i nazwisko</th>
                <th className="p-2 text-left font-medium">Rola</th>
                <th className="p-2 text-center font-medium">Metoda auth</th>
                <th className="p-2 text-center font-medium">Admin</th>
                {showInactive && <th className="p-2 text-center font-medium">Aktywny</th>}
                <th className="p-2 text-left font-medium hidden md:table-cell">Wygasa</th>
                <th className="p-2 text-left font-medium hidden lg:table-cell">Utworzony</th>
                <th className="p-2 text-right font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/30",
                    !u.isActive && "opacity-50"
                  )}
                >
                  <td className="p-2 font-medium">{u.name}</td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      <Shield className="h-3 w-3" />
                      {u.roleName}
                    </span>
                  </td>
                  <td className="p-2 text-center text-xs">
                    {AUTH_METHODS.find((m) => m.value === u.authMethod)?.label ?? u.authMethod}
                  </td>
                  <td className="p-2 text-center">
                    {u.isOwner ? (
                      <ShieldCheck className="mx-auto h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {showInactive && (
                    <td className="p-2 text-center">
                      {u.isActive ? (
                        <span className="text-green-600 text-xs font-medium">Tak</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => restoreMutation.mutate(u.id)}
                        >
                          Przywróć
                        </Button>
                      )}
                    </td>
                  )}
                  <td className="p-2 hidden md:table-cell text-muted-foreground text-xs">
                    {u.expiresAt ? formatDate(u.expiresAt) : "—"}
                  </td>
                  <td className="p-2 hidden lg:table-cell text-muted-foreground text-xs">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 w-7 p-0", u.tokenId ? "text-green-600" : "")}
                        onClick={() => openPairDialog(u)}
                        title={u.tokenId ? `Kapsułka: ${u.tokenId}` : "Sparuj kapsułkę"}
                      >
                        {u.tokenId ? <Link2 className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openPinChange(u.id)}
                        title="Zmień PIN"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(u)}
                        title="Edytuj"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {u.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Czy na pewno chcesz dezaktywować "${u.name}"?`)) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          title="Dezaktywuj"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? `Edytuj: ${editingUser.name}` : "Nowy użytkownik"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                Imię i nazwisko <span className="text-destructive">*</span>
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="np. Jan Kowalski"
                maxLength={100}
              />
            </div>

            {!editingUser && (
              <div>
                <label className="text-sm font-medium">
                  PIN (min. 4 cyfry) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="****"
                  maxLength={8}
                />
                {formPin && formPin.length < 4 && (
                  <p className="mt-0.5 text-xs text-destructive">PIN musi mieć min. 4 cyfry</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  Rola <span className="text-destructive">*</span>
                </label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(e.target.value)}
                >
                  <option value="">— wybierz —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Metoda autoryzacji</label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={formAuthMethod}
                  onChange={(e) => setFormAuthMethod(e.target.value)}
                >
                  {AUTH_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="isOwner"
                  checked={formIsOwner}
                  onChange={(e) => setFormIsOwner(e.target.checked)}
                  className="h-4 w-4 rounded border"
                />
                <label htmlFor="isOwner" className="text-sm font-medium cursor-pointer">
                  Administrator (właściciel)
                </label>
              </div>
              <div>
                <label className="text-sm font-medium">Data wygaśnięcia (opcjonalnie)</label>
                <Input
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                />
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Dla pracowników sezonowych
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Anuluj
            </Button>
            <Button
              disabled={
                !isFormValid ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              onClick={handleSubmit}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Zapisywanie…"
                : editingUser
                ? "Zapisz zmiany"
                : "Dodaj użytkownika"}
            </Button>
          </DialogFooter>
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-destructive">
              {(createMutation.error ?? updateMutation.error)?.message ?? "Wystąpił błąd"}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Pair Token Dialog */}
      <Dialog open={pairDialogOpen} onOpenChange={setPairDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kapsułka — {pairUserName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current token info */}
            {pairTokenId && !pairListening && !pairDetected && (
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-sm font-medium">Aktualny token:</p>
                <p className="font-mono text-xs text-muted-foreground">{pairTokenId}</p>
                <p className="text-xs text-muted-foreground">
                  Typ: {TOKEN_TYPES.find((t) => t.value === pairTokenType)?.label ?? pairTokenType}
                </p>
              </div>
            )}

            {/* Listening mode */}
            {pairListening && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-20 w-20 animate-ping rounded-full bg-primary/10" style={{ animationDuration: "2s" }} />
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/30 bg-primary/5">
                    <Link2 className="h-7 w-7 text-primary/60 animate-pulse" />
                  </div>
                </div>
                <p className="text-sm font-medium">Przyłóż kapsułkę do czytnika…</p>
                <Button variant="outline" size="sm" onClick={() => setPairListening(false)}>
                  Anuluj
                </Button>
              </div>
            )}

            {/* Detected token */}
            {pairDetected && (
              <div className="rounded-md border border-green-500/30 bg-green-50 p-3 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Wykryto token!
                </p>
                <p className="font-mono text-xs">{pairTokenId}</p>
              </div>
            )}

            {/* Manual input / type selection */}
            {!pairListening && (
              <>
                <div>
                  <label className="text-sm font-medium">Typ tokenu</label>
                  <select
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={pairTokenType}
                    onChange={(e) => setPairTokenType(e.target.value)}
                  >
                    {TOKEN_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">ID tokenu</label>
                  <div className="flex gap-2">
                    <Input
                      value={pairTokenId}
                      onChange={(e) => { setPairTokenId(e.target.value); setPairDetected(false); }}
                      placeholder="np. 01A2B3C4D5E6F7"
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPairListening(true); setPairDetected(false); }}
                      title="Odczytaj z czytnika"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Wpisz ręcznie lub kliknij ikonę i przyłóż kapsułkę
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            {pairTokenId && !pairListening && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (pairUserId && confirm("Usunąć powiązanie kapsułki?")) {
                    unpairTokenMutation.mutate(pairUserId);
                    setPairDialogOpen(false);
                  }
                }}
              >
                Odepnij
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setPairDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              disabled={!pairTokenId.trim() || pairListening || pairTokenMutation.isPending}
              onClick={() => pairTokenMutation.mutate()}
            >
              {pairTokenMutation.isPending ? "Zapisywanie…" : "Sparuj"}
            </Button>
          </DialogFooter>
          {pairTokenMutation.isError && (
            <p className="text-sm text-destructive">
              {pairTokenMutation.error?.message ?? "Wystąpił błąd"}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Change PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Zmień PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nowy PIN (min. 4 cyfry)</label>
              <Input
                type="password"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="****"
                maxLength={8}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Potwierdź PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="****"
                maxLength={8}
              />
              {confirmPin && newPin !== confirmPin && (
                <p className="mt-0.5 text-xs text-destructive">PIN-y się nie zgadzają</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinDialogOpen(false)}>
              Anuluj
            </Button>
            <Button
              disabled={!isPinValid || changePinMutation.isPending}
              onClick={() => changePinMutation.mutate()}
            >
              {changePinMutation.isPending ? "Zapisywanie…" : "Zmień PIN"}
            </Button>
          </DialogFooter>
          {changePinMutation.isError && (
            <p className="text-sm text-destructive">
              {changePinMutation.error?.message ?? "Wystąpił błąd"}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
