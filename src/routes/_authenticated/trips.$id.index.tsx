import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Sparkles } from "lucide-react";

import { InviteShare } from "@/components/app/ShareDialog";
import { TripHeader } from "@/components/app/TripHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlans, getResponses, getTrip } from "@/lib/tripsync/queries";

export const Route = createFileRoute("/_authenticated/trips/$id/")({
  head: () => ({
    meta: [
      { title: "Trip Overview — CoJourney" },
      { name: "description", content: "Share the invite link and track group responses for this trip." },
      { property: "og:title", content: "Trip Overview — CoJourney" },
      { property: "og:description", content: "Share the invite link and track responses." },
    ],
  }),
  component: TripOverview,
});

function TripOverview() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["trip", id, "overview"],
    queryFn: async () => {
      const [trip, responses, plans] = await Promise.all([
        getTrip(id),
        getResponses(id),
        getPlans(id),
      ]);
      return { trip, responses, plans };
    },
  });

  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;

  const { trip, responses, plans } = data;
  const pct = Math.min(100, Math.round((responses.length / trip.participant_count) * 100));

  return (
    <div className="space-y-8">
      <TripHeader trip={trip} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Invitation link</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            One link for the preference form and, later, plan voting. No login required.
          </p>
          <InviteShare token={trip.invite_token} tripName={trip.trip_name} />
        </div>

        <div className="card-surface p-6">
          <h2 className="font-display text-lg font-semibold">Response progress</h2>
          <p className="mt-3 text-3xl font-bold">
            {responses.length}
            <span className="text-base font-medium text-muted-foreground">
              {" "}
              / {trip.participant_count}
            </span>
          </p>
          <Progress value={pct} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">{pct}% of the group has answered</p>
          <div className="mt-5 grid gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/trips/$id/responses" params={{ id }}>
                <BarChart3 className="size-4" /> View analysis
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/trips/$id/plans" params={{ id }}>
                <Sparkles className="size-4" />
                {plans.length ? "View AI plans" : "Generate AI plans"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
