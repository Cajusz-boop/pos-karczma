"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Calendar,
  Warehouse,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChefHat,
  Clock,
  Menu,
  X,
  Package,
  Users,
  CalendarCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { href: "/pos", label: "POS", icon: LayoutDashboard },
  { href: "/kitchen", label: "Kuchnia (KDS)", icon: ChefHat },
  { href: "/orders", label: "Zamówienia", icon: ShoppingCart },
  { href: "/delivery", label: "Dostawy", icon: Truck },
  { href: "/products", label: "Produkty", icon: Package },
  { href: "/time-tracking", label: "Czas pracy", icon: Clock },
  { href: "/banquets", label: "Bankiety", icon: UtensilsCrossed },
  { href: "/reservations", label: "Rezerwacje", icon: Calendar },
  { href: "/warehouse", label: "Magazyn", icon: Warehouse },
  { href: "/invoices", label: "Faktury", icon: FileText },
  { href: "/day-close", label: "Zamknięcie dnia", icon: CalendarCheck },
  { href: "/reports", label: "Raporty", icon: BarChart3 },
  { href: "/manager", label: "Menadżer", icon: Wrench },
  { href: "/users", label: "Użytkownicy", icon: Users },
  { href: "/settings", label: "Ustawienia", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isOwner = currentUser?.isOwner ?? false;
  const isPosView = pathname === "/pos" || pathname.startsWith("/pos/");
  const isKitchenView = pathname === "/kitchen";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
  }, [mounted, currentUser, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!mounted || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Ładowanie…</p>
        </div>
      </div>
    );
  }

  // Kitchen view: completely fullscreen (for TV display), no chrome at all
  if (isKitchenView) {
    return <>{children}</>;
  }

  // POS view for waiter: minimal chrome, no sidebar
  if (isPosView && !isOwner) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // POS view for owner: minimal header with admin access
  if (isPosView) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex h-10 items-center justify-between border-b bg-card px-3">
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-10 flex-shrink-0">
              <Image src="/logo.png" alt="Łabędź" fill className="object-contain object-left" unoptimized />
            </div>
            <span className="text-sm font-semibold text-foreground">Karczma Łabędź</span>
            <span className="text-xs text-muted-foreground">|</span>
            <Link href="/reports" className="text-xs text-muted-foreground hover:text-foreground">
              Raporty
            </Link>
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground">
              Ustawienia
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">{time}</span>
            <span className="text-xs font-medium">{currentUser.name}</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Kitchen view for owner is handled above (fullscreen for all users)

  // Admin views: full sidebar navigation
  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r bg-card transition-transform duration-200 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-12 items-center justify-between gap-2 border-b px-4">
          <div className="relative h-8 w-11 flex-shrink-0">
            <Image src="/logo.png" alt="Łabędź" fill className="object-contain object-left" unoptimized />
          </div>
          <span className="text-sm font-bold truncate">Karczma Łabędź</span>
          <button
            type="button"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 text-sm",
                    active && "bg-muted font-semibold"
                  )}
                  size="sm"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sm text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Wyloguj
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-medium">{currentUser.name}</span>
            {currentUser.isOwner && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                Admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {time}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
              <LogOut className="mr-1 h-4 w-4" />
              Wyloguj
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
