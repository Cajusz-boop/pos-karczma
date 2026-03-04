"use client";

import { cn } from "@/lib/utils";

type Status = "DRAFT" | "CONFIRMED" | "CANCELLED";

const LABELS: Record<Status, string> = {
  DRAFT: "Do uzupełnienia",
  CONFIRMED: "Potwierdzone",
  CANCELLED: "Odwołane",
};

const STYLES: Record<Status, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function EventStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status]
      )}
    >
      {status === "DRAFT" && "🟡"}
      {status === "CONFIRMED" && "🟢"}
      {status === "CANCELLED" && "❌"}
      <span className="ml-1">{LABELS[status]}</span>
    </span>
  );
}
