import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Map, Plus } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { ShareDialog } from "@/components/app/ShareDialog";
import { TripCard } from "@/components/app/TripCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/routes/_authenticated/dashboard";
import type { Trip } from "@/lib/tripsync/queries";

export const Route = createFileRoute("/_authenticated/trips/")({
  head: () => ({
    meta: [
      { title: "My Trips — TripSync AI" },
      { name: "description", content: "Every group trip you organize, with live response progress." },
      { property: "og:title", content: "My Trips — TripSync AI" },
      { property: "og:description", content: "Every group trip you organize, in one list." },
    ],
  }),
  component: TripsPage,
});

function TripsPage() {
  const { data, isLoading } = useDashboardData();
  const [share, setShare] = useState<Trip | null>(null);
  const trips = data?.trips ?? [];

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">My Trips</h1>
          <p className="mt-1 text-sm text-muted-foreground">{trips.length} trips organized</p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/trips/new">
            <Plus className="size-4" /> Create Trip
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No trips yet"
          description="Create your first trip and invite your group."
          action={
            <Button asChild>
              <Link to="/trips/new">
                <Plus className="size-4" /> Create Trip
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              responseCount={data?.counts[trip.id] ?? 0}
              onShare={setShare}
            />
          ))}
        </div>
      )}

      <ShareDialog
        open={!!share}
        onOpenChange={(v) => !v && setShare(null)}
        token={share?.invite_token ?? null}
        tripName={share?.trip_name ?? ""}
      />
    </div>
  );
}
