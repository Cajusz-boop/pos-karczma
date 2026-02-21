"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type AuthUser } from "@/store/useAuthStore";
import { useTokenReader } from "@/lib/hooks/useTokenReader";
import { useWebNfc } from "@/lib/hooks/useWebNfc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type UserItem = {
  id: string;
  name: string;
  roleId: string;
  roleName: string;
  isOwner: boolean;
};

type LoginMode = "token" | "pin";

export function LoginClient() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  const [mode, setMode] = useState<LoginMode>("token");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [cashStart, setCashStart] = useState("0");
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftError, setShiftError] = useState("");

  // Token login state
  const [tokenError, setTokenError] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenSuccess, setTokenSuccess] = useState(false);

  const loadUsers = useCallback(() => {
    if (currentUser) return;
    setUsersLoading(true);
    setUsersError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const url = typeof window !== "undefined" ? `${window.location.origin}/api/auth/users` : "/api/auth/users";
    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 500 ? "Błąd serwera (sprawdź bazę danych)" : `Błąd ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          setUsers([]);
          setUsersError("Nieprawidłowa odpowiedź serwera");
        }
      })
      .catch((err) => {
        setUsers([]);
        if (err.name === "AbortError") {
          setUsersError("Przekroczono czas oczekiwania. Sprawdź połączenie i spróbuj ponownie.");
        } else {
          setUsersError(err instanceof Error ? err.message : "Nie można załadować użytkowników");
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setUsersLoading(false);
      });
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !pendingUser) {
      router.replace("/pos");
      return;
    }
    if (!currentUser) loadUsers();
  }, [currentUser, pendingUser, router, loadUsers]);

  const checkShiftAndRedirect = useCallback(
    async (user: AuthUser) => {
      if (user.isOwner) {
        router.replace("/pos");
        return;
      }
      try {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const res = await fetch(`${base}/api/shifts?userId=${user.id}&status=OPEN`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          router.replace("/pos");
        } else {
          setPendingUser(user);
          setShiftDialogOpen(true);
          setCashStart("0");
          setShiftError("");
        }
      } catch {
        router.replace("/pos");
      }
    },
    [router]
  );

  const openShiftSubmit = useCallback(async () => {
    if (!pendingUser) return;
    setShiftLoading(true);
    setShiftError("");
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/shifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUser.id, cashStart: parseFloat(cashStart) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShiftError(data.error ?? "Błąd otwarcia zmiany");
        setShiftLoading(false);
        return;
      }
      setShiftDialogOpen(false);
      setPendingUser(null);
      router.replace("/pos");
    } catch {
      setShiftError("Błąd połączenia");
    } finally {
      setShiftLoading(false);
    }
  }, [pendingUser, cashStart, router]);

  // Token login handler (shared by Dallas iButton, NFC, barcode)
  const handleTokenLogin = useCallback(
    async (tokenId: string) => {
      if (tokenLoading) return;
      setTokenError("");
      setTokenLoading(true);
      setTokenSuccess(false);
      try {
        const base = typeof window !== "undefined" ? window.location.origin : "";
        const res = await fetch(`${base}/api/auth/token-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setTokenError(data.error ?? "Błąd logowania tokenem");
          setTokenLoading(false);
          return;
        }
        setTokenSuccess(true);
        const user: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          roleId: data.user.roleId,
          roleName: data.user.roleName,
          isOwner: data.user.isOwner,
        };
        setCurrentUser(user);
        await checkShiftAndRedirect(user);
      } catch {
        setTokenError("Błąd połączenia");
      } finally {
        setTokenLoading(false);
      }
    },
    [tokenLoading, setCurrentUser, checkShiftAndRedirect]
  );

  // Keyboard wedge reader (Dallas iButton, barcode scanner)
  useTokenReader({
    onToken: handleTokenLogin,
    enabled: !open && !shiftDialogOpen,
  });

  // Web NFC for Chrome Android
  const { supported: nfcSupported, scanning: nfcScanning, error: nfcError } = useWebNfc({
    onToken: handleTokenLogin,
    enabled: !open && !shiftDialogOpen,
  });

  // Clear token error after 5 seconds
  useEffect(() => {
    if (!tokenError) return;
    const timer = setTimeout(() => setTokenError(""), 5000);
    return () => clearTimeout(timer);
  }, [tokenError]);

  // PIN login handlers
  const openPinDialog = (user: UserItem) => {
    setSelectedUser(user);
    setPin("");
    setError("");
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelectedUser(null);
    setPin("");
    setError("");
  };

  const addDigit = (d: string) => {
    if (pin.length >= 4) return;
    setPin((p) => p + d);
    setError("");
  };

  const backspace = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const submitPin = useCallback(async () => {
    if (!selectedUser || pin.length !== 4) {
      setError("Wpisz 4 cyfry PIN");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Błąd logowania");
        setLoading(false);
        return;
      }
      const user: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        roleId: data.user.roleId,
        roleName: data.user.roleName,
        isOwner: data.user.isOwner,
      };
      setCurrentUser(user);
      closeDialog();
      await checkShiftAndRedirect(user);
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }, [selectedUser, pin, setCurrentUser, checkShiftAndRedirect]);

  const keypad = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0"];

  return (
    <>
      {/* Mode toggle */}
      <div className="mb-6 flex items-center gap-2 rounded-lg bg-muted p-1">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            mode === "token"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setMode("token")}
        >
          Kapsułka / NFC
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            mode === "pin"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setMode("pin")}
        >
          PIN
        </button>
      </div>

      {/* Token mode — capsule/NFC waiting screen */}
      {mode === "token" && (
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Pulsing capsule animation */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulse rings - pointer-events-none to not block tab clicks */}
            <div className="pointer-events-none absolute h-40 w-40 animate-ping rounded-full bg-primary/5" style={{ animationDuration: "3s" }} />
            <div className="pointer-events-none absolute h-32 w-32 animate-ping rounded-full bg-primary/10" style={{ animationDuration: "2s" }} />

            {/* Capsule icon */}
            <div
              className={cn(
                "relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all duration-500",
                tokenLoading
                  ? "border-primary bg-primary/20 scale-110"
                  : tokenSuccess
                  ? "border-green-500 bg-green-500/20 scale-110"
                  : tokenError
                  ? "border-destructive bg-destructive/10"
                  : "border-primary/30 bg-primary/5"
              )}
            >
              {tokenLoading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              ) : tokenSuccess ? (
                <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-10 w-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              )}
            </div>
          </div>

          {/* Status text */}
          <div className="space-y-2 text-center">
            {tokenLoading && (
              <p className="text-lg font-medium animate-pulse">Logowanie…</p>
            )}
            {tokenSuccess && (
              <p className="text-lg font-medium text-green-600">Zalogowano!</p>
            )}
            {!tokenLoading && !tokenSuccess && (
              <>
                <p className="text-lg font-medium">Przyłóż kapsułkę</p>
                <p className="text-sm text-muted-foreground">
                  Dallas iButton, karta NFC lub zeskanuj kod kreskowy
                </p>
              </>
            )}
            {tokenError && (
              <p className="text-sm text-destructive animate-in fade-in">{tokenError}</p>
            )}
            {nfcError && (
              <p className="text-xs text-destructive">{nfcError}</p>
            )}
          </div>

          {/* NFC status badge */}
          {nfcSupported && (
            <div className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              nfcScanning
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            )}>
              <span className={cn(
                "h-2 w-2 rounded-full",
                nfcScanning ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
              )} />
              {nfcScanning ? "NFC aktywne" : "NFC nieaktywne"}
            </div>
          )}

          {/* Fallback link */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setMode("pin")}
          >
            Zaloguj się kodem PIN
          </Button>
        </div>
      )}

      {/* PIN mode — user selection grid */}
      {mode === "pin" && (
        <div className="w-full max-w-md">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {usersLoading && (
              <p className="col-span-full text-center text-muted-foreground">Ładowanie użytkowników…</p>
            )}
            {!usersLoading && usersError && (
              <div className="col-span-full space-y-2 text-center">
                <p className="text-destructive">{usersError}</p>
                <Button variant="outline" size="sm" onClick={loadUsers}>
                  Ponów
                </Button>
              </div>
            )}
            {!usersLoading && !usersError && users.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">Brak aktywnych użytkowników.</p>
            )}
            {!usersLoading && !usersError && users.map((user) => (
              <Button
                key={user.id}
                variant="outline"
                size="lg"
                className="h-20 text-lg"
                onClick={() => openPinDialog(user)}
              >
                {user.name}
              </Button>
            ))}
          </div>

          {/* Token hint in PIN mode */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground/60">
              Możesz też przyłożyć kapsułkę Dallas / kartę NFC
            </p>
            {tokenError && (
              <p className="mt-1 text-sm text-destructive">{tokenError}</p>
            )}
          </div>
        </div>
      )}

      {/* PIN Dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              PIN — {selectedUser?.name ?? ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              readOnly
              placeholder="••••"
              className="text-center text-2xl tracking-[0.5em]"
              aria-label="PIN"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {keypad.map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  size="lg"
                  className="h-12 text-lg"
                  onClick={() => addDigit(d)}
                  disabled={loading}
                >
                  {d}
                </Button>
              ))}
              <Button
                variant="outline"
                size="lg"
                className="h-12"
                onClick={backspace}
                disabled={loading}
              >
                &#x232B;
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12"
                onClick={() => setPin("")}
                disabled={loading}
              >
                C
              </Button>
              <Button
                size="lg"
                className="col-span-2 h-12"
                onClick={submitPin}
                disabled={loading || pin.length !== 4}
              >
                {loading ? "Logowanie…" : "Zaloguj"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={shiftDialogOpen} onOpenChange={(o) => !o && setShiftDialogOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Otwórz zmianę</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Deklaracja stanu gotówki na start zmiany.</p>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Stan gotówki (zł)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={cashStart}
              onChange={(e) => setCashStart(e.target.value)}
              placeholder="0"
            />
          </div>
          {shiftError && <p className="text-sm text-destructive">{shiftError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShiftDialogOpen(false)} disabled={shiftLoading}>
              Anuluj
            </Button>
            <Button onClick={openShiftSubmit} disabled={shiftLoading}>
              {shiftLoading ? "Otwieranie…" : "Otwórz zmianę"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
