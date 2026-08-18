import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Map, Plus, Sparkles, Users, Wand2 } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { ShareDialog } from "@/components/app/ShareDialog";
import { StatCard } from "@/components/app/StatCard";
import { TripCard } from "@/components/app/TripCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { resetDemoData, seedDemoTrip } from "@/lib/tripsync/demo";
import { listTrips, type Trip } from "@/lib/tripsync/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Organizer Dashboard — TripSync AI" },
      {
        name: "description",
        content: "Track trips, response progress and AI-generated plans across all your groups.",
      },
      { property: "og:title", content: "Organizer Dashboard — TripSync AI" },
      { property: "og:description", content: "Track trips, responses and AI plans in one place." },
    ],
  }),
  component: DashboardPage,
});

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const trips = await listTrips();
      const [{ data: responses }, { data: plans }] = await Promise.all([
        supabase.from("participant_responses").select("trip_id"),
        supabase.from("trip_plans").select("trip_id"),
      ]);
      const counts: Record<string, number> = {};
      for (const r of responses ?? []) counts[r.trip_id] = (counts[r.trip_id] ?? 0) + 1;
      return {
        trips,
        counts,
        totalResponses: responses?.length ?? 0,
        totalPlans: plans?.length ?? 0,
      };
    },
  });
}

function DashboardPage() {
  const { displayName } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useDashboardData();
  const [share, setShare] = useState<Trip | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function loadDemo() {
    setSeeding(true);
    try {
      await seedDemoTrip();
      await queryClient.invalidateQueries();
      toast.success("Demo trip created with 8 anonymous responses");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSeeding(false);
    }
  }

  async function resetDemo() {
    try {
      const removed = await resetDemoData();
      await queryClient.invalidateQueries();
      toast.success(removed ? "Demo data cleared" : "No demo data to clear");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const trips = data?.trips ?? [];
  const active = trips.filter((t) => t.status !== "finalized").length;

  return (
    <div className="space-y-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">
            {displayName ? `Hey ${displayName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything your groups have told you, in one place.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={resetDemo} className="hidden sm:inline-flex">
            Reset demo
          </Button>
          <Button variant="outline" onClick={loadDemo} disabled={seeding}>
            {seeding ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Load demo
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[116px] rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={Map} label="Total Trips" value={trips.length} />
            <StatCard icon={Sparkles} label="Active Trips" value={active} hint="Still collecting or analyzing" />
            <StatCard icon={Users} label="Responses Collected" value={data?.totalResponses ?? 0} />
            <StatCard icon={Sparkles} label="Plans Generated" value={data?.totalPlans ?? 0} />
          </>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Trips</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/trips">View all</Link>
          </Button>
        </div>

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
            description="Create your first trip and invite your group with a single WhatsApp link."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link to="/trips/new">
                    <Plus className="size-4" /> Create Trip
                  </Link>
                </Button>
                <Button variant="outline" onClick={loadDemo} disabled={seeding}>
                  <Wand2 className="size-4" /> Load demo trip
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trips.slice(0, 6).map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                responseCount={data?.counts[trip.id] ?? 0}
                onShare={setShare}
              />
            ))}
          </div>
        )}
      </section>

      <ShareDialog
        open={!!share}
        onOpenChange={(v) => !v && setShare(null)}
        token={share?.invite_token ?? null}
        tripName={share?.trip_name ?? ""}
        destination={share?.destination ?? undefined}
      />
    </div>
  );
}
