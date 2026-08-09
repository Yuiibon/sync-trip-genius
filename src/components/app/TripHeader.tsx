import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { StatusBadge } from "@/components/app/TripCard";
import { formatINR } from "@/lib/tripsync/constants";
import type { Trip } from "@/lib/tripsync/queries";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "Overview" },
  { key: "responses", label: "Responses" },
  { key: "plans", label: "AI Plans" },
  { key: "itinerary", label: "Itinerary" },
] as const;

export function TripHeader({ trip }: { trip: Trip }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{trip.trip_name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {trip.destination}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> {trip.duration} days
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {trip.participant_count} participants
            </span>
            <span>
              {formatINR(trip.budget_min)} – {formatINR(trip.budget_max)}
            </span>
          </div>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {TABS.map((tab) => {
          const to = tab.key ? `/trips/${trip.id}/${tab.key}` : `/trips/${trip.id}`;
          const active = pathname.replace(/\/$/, "") === to;
          return (
            <Link
              key={tab.key}
              to={to}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
