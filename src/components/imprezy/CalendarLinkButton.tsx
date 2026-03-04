"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function CalendarLinkButton({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <Button variant="outline" size="sm" className="h-12" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-4 w-4" />
        Otwórz w Google Calendar
      </a>
    </Button>
  );
}
