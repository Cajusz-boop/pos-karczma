"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

export function TrainingModeBanner() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/training");
        const data = await res.json();
        setActive(data.trainingMode === true);
      } catch {
        setActive(false);
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!active) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-sm font-bold text-amber-950">
      <GraduationCap className="h-4 w-4" />
      TRYB SZKOLENIOWY — dane nie są zapisywane na stałe
    </div>
  );
}
