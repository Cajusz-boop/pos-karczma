"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, User, Calendar, LogIn, LogOut } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

type TimeEntryRow = {
  id: string;
  clockIn: string;
  clockOut: string | null;
  breakMin: number;
  note: string | null;
};

type EmployeeData = {
  userId: string;
  userName: string;
  entries: TimeEntryRow[];
  totalHours: number;
};

type TimeTrackingResponse = {
  dateFrom: string;
  dateTo: string;
  employees: EmployeeData[];
};

export default function TimeTrackingClient() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [range, setRange] = useState<"week" | "month" | "custom">("week");
  const [dateFrom, setDateFrom] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(() =>
    format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
  );

  const { data, isLoading } = useQuery<TimeTrackingResponse>({
    queryKey: ["time-tracking", range, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("range", range);
      if (range === "custom") {
        params.set("dateFrom", dateFrom);
        params.set("dateTo", dateTo);
      }
      const r = await fetch(`/api/time-tracking?${params}`);
      if (!r.ok) throw new Error("Błąd pobierania rejestru czasu");
      return r.json();
    },
  });

  const clockMutation = useMutation({
    mutationFn: async (action: "clock-in" | "clock-out") => {
      if (!currentUser) throw new Error("Zaloguj się");
      const r = await fetch("/api/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, action }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Błąd");
      return d;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-tracking"] });
    },
  });

  const currentUserHasOpenEntry = currentUser
    ? data?.employees
        ?.find((e) => e.userId === currentUser.id)
        ?.entries.some((ent) => !ent.clockOut)
    : false;

  const handleRangeChange = (r: "week" | "month" | "custom") => {
    setRange(r);
    const now = new Date();
    if (r === "week") {
      setDateFrom(format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
      setDateTo(format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"));
    } else if (r === "month") {
      setDateFrom(format(startOfMonth(now), "yyyy-MM-dd"));
      setDateTo(format(endOfMonth(now), "yyyy-MM-dd"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Clock className="h-6 w-6" />
          Rejestr czasu pracy
        </h1>
        {currentUser && (
          <div className="flex gap-2">
            <Button
              variant={currentUserHasOpenEntry ? "outline" : "default"}
              size="sm"
              onClick={() => clockMutation.mutate("clock-in")}
              disabled={
                currentUserHasOpenEntry || clockMutation.isPending
              }
            >
              <LogIn className="mr-2 h-4 w-4" />
              Wejście
            </Button>
            <Button
              variant={currentUserHasOpenEntry ? "default" : "outline"}
              size="sm"
              onClick={() => clockMutation.mutate("clock-out")}
              disabled={
                !currentUserHasOpenEntry || clockMutation.isPending
              }
            >
              <LogOut className="mr-2 h-4 w-4" />
              Wyjście
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Zakres:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={range === "week" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleRangeChange("week")}
          >
            Ten tydzień
          </Button>
          <Button
            variant={range === "month" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleRangeChange("month")}
          >
            Ten miesiąc
          </Button>
          <Button
            variant={range === "custom" ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleRangeChange("custom")}
          >
            Niestandardowy
          </Button>
        </div>
        {range === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        )}
      </div>

      {data && (
        <p className="text-sm text-muted-foreground">
          {format(new Date(data.dateFrom), "d MMM yyyy", { locale: pl })} –{" "}
          {format(new Date(data.dateTo), "d MMM yyyy", { locale: pl })}
        </p>
      )}

      {clockMutation.error && (
        <p className="text-sm text-destructive">{String(clockMutation.error.message)}</p>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Ładowanie…</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left">Pracownik</th>
                <th className="p-2 text-left">Wejście</th>
                <th className="p-2 text-left">Wyjście</th>
                <th className="p-2 text-right">Godziny (suma)</th>
              </tr>
            </thead>
            <tbody>
              {data?.employees?.map((emp) => (
                <tr key={emp.userId} className="border-b">
                  <td className="p-2">
                    <span className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {emp.userName}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      {emp.entries.map((ent) => (
                        <div key={ent.id}>
                          {format(new Date(ent.clockIn), "dd.MM HH:mm", {
                            locale: pl,
                          })}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      {emp.entries.map((ent) => (
                        <div key={ent.id}>
                          {ent.clockOut
                            ? format(new Date(ent.clockOut), "dd.MM HH:mm", {
                                locale: pl,
                              })
                            : "— (w trakcie)"}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-2 text-right tabular-nums font-medium">
                    {emp.totalHours.toFixed(2)} h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.employees?.length && (
            <p className="p-4 text-center text-muted-foreground">
              Brak wpisów w wybranym zakresie.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
