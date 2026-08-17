import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  to = "/",
  inverted = false,
}: {
  className?: string;
  to?: string;
  inverted?: boolean;
}) {
  return (
    <Link to={to} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="bg-brand grid size-9 shrink-0 place-items-center rounded-xl shadow-soft transition-transform group-hover:scale-105">
        <Compass className="size-5 text-primary-foreground" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight",
          inverted ? "text-primary-foreground" : "text-foreground",
        )}
      >
        CoJourney <span className="text-secondary">AI</span>
      </span>
    </Link>
  );
}
