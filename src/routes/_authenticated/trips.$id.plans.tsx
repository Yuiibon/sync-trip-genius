import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Crown, Loader2, Lock, Sparkles, ThumbsUp, Users } from "lucide-react";

import { AnalysisLoader } from "@/components/app/AnalysisLoader";
import { EmptyState } from "@/components/app/EmptyState";
import { HotelPicker } from "@/components/app/HotelPicker";
import { ScoreRing } from "@/components/app/ScoreRing";
import { TripHeader } from "@/components/app/TripHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/tripsync/constants";
import { analyzeTripResponses, generateItinerary, generateRecommendations } from "@/lib/tripsync/engine";
import { hotelOptions, planTotalWithHotel, type HotelOption } from "@/lib/tripsync/hotels";
import { cn } from "@/lib/utils";
import {
  getPlans,
  getResponses,
  getTrip,
  getVoteTally,
  savePlans,
  setPlanHotel,
  toTripInput,
  type TripPlan,
} from "@/lib/tripsync/queries";

export const Route = createFileRoute("/_authenticated/trips/$id/plans")({
  head: () => ({
    meta: [
      { title: "AI Trip Plans — CoJourney" },
      { name: "description", content: "Three compatible trip plans scored on availability, budget and interests." },
      { property: "og:title", content: "AI Trip Plans — CoJourney" },
      { property: "og:description", content: "Compare scored group trip plans, pick a stay and lock in the winner." },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["trip", id, "plans"],
    queryFn: async () => {
      const [trip, responses, plans, votes] = await Promise.all([
        getTrip(id),
        getResponses(id),
        getPlans(id),
        getVoteTally(id),
      ]);
      return { trip, responses, plans, votes, analysis: analyzeTripResponses(responses, toTripInput(trip)) };
    },
  });

  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;
  const { trip, responses, plans, votes, analysis } = data;
  const totalVotes = Object.values(votes).reduce((s, v) => s + v, 0);
  const finalized = plans.find((p) => p.is_selected) ?? null;
  const winner =
    totalVotes > 0
      ? [...plans].sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0))[0]!
      : [...plans].sort((a, b) => b.compatibility_score - a.compatibility_score)[0] ?? null;

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const recs = generateRecommendations(toTripInput(trip), analysis);
      await new Promise((r) => setTimeout(r, 3600));
      await savePlans(trip.id, recs);
      await queryClient.invalidateQueries();
      toast.success("Analysis complete — 3 plans ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function selectHotel(plan: TripPlan, hotel: HotelOption) {
    try {
      await setPlanHotel(plan.id, hotel);
      await queryClient.invalidateQueries({ queryKey: ["trip", id, "plans"] });
      toast.success(`${hotel.name} set as the stay for ${plan.plan_name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the selected stay.");
    }
  }

  async function finalize(planId: string) {
    setFinalizing(true);
    try {
      const plan = plans.find((p) => p.id === planId)!;
      const hotel = plan.selected_hotel ?? hotelOptions(plan)[1]!;
      const total = planTotalWithHotel(plan, hotel);
      const base = generateItinerary({ ...plan, estimated_budget: total }, analysis);
      const itinerary = { ...base, accommodation: `${hotel.name} · ${hotel.rating.toFixed(1)}★` };
      await supabase.from("trip_plans").update({ is_selected: false }).eq("trip_id", trip.id);
      await supabase
        .from("trip_plans")
        .update({ is_selected: true, estimated_budget: total, selected_hotel: JSON.parse(JSON.stringify(hotel)) })
        .eq("id", planId);
      const { error } = await supabase.from("itineraries").upsert(
        {
          trip_id: trip.id,
          plan_id: planId,
          content: JSON.parse(JSON.stringify(itinerary)),
          budget_breakdown: { items: itinerary.budget_breakdown, total },
          packing_list: itinerary.packing_list,
        },
        { onConflict: "trip_id" },
      );
      if (error) throw error;
      await supabase.from("trips").update({ status: "finalized" }).eq("id", trip.id);
      await queryClient.invalidateQueries();
      navigate({ to: "/trips/$id/itinerary", params: { id: trip.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div className="space-y-8">
      <TripHeader trip={trip} />

      {analyzing ? (
        <AnalysisLoader />
      ) : responses.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No responses to analyze yet"
          description="The AI needs at least a couple of anonymous responses before it can score plans."
        />
      ) : plans.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-4 p-10 text-center">
          <span className="bg-brand grid size-14 place-items-center rounded-2xl">
            <Sparkles className="size-6 text-primary-foreground" />
          </span>
          <h2 className="font-display text-xl font-semibold">Ready to analyze</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {responses.length} anonymous responses collected. Generate three compatible plans scored
            on availability, budget and interest overlap.
          </p>
          <Button size="lg" onClick={runAnalysis}>
            <Sparkles className="size-4" /> Run AI analysis
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Analysis complete</h2>
              <p className="text-sm text-muted-foreground">
                {totalVotes} anonymous {totalVotes === 1 ? "vote" : "votes"} received so far.
                {winner && !finalized ? ` Leading: ${winner.plan_name}.` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={runAnalysis}>
                <Sparkles className="size-4" /> Regenerate
              </Button>
              {winner ? (
                <Button onClick={() => finalize(winner.id)} disabled={finalizing}>
                  {finalizing ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                  Lock In Winning Itinerary
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const hotels = hotelOptions(plan);
              const selectedHotel =
                hotels.find((h) => h.id === plan.selected_hotel?.id) ?? plan.selected_hotel ?? null;
              const total = planTotalWithHotel(plan, selectedHotel);
              const isWinner = plan.is_selected;
              return (
                <article
                  key={plan.id}
                  className={cn(
                    "card-surface flex flex-col p-6",
                    isWinner && "border-2 border-[oklch(0.78_0.15_85)] shadow-lift",
                  )}
                >
                  {isWinner ? (
                    <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[oklch(0.78_0.15_85)]/15 px-2.5 py-1 text-[11px] font-semibold text-[oklch(0.55_0.13_85)]">
                      <Crown className="size-3.5" /> FINALIZED PLAN
                    </span>
                  ) : null}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold">{plan.plan_name}</h3>
                      <p className="truncate text-sm text-muted-foreground">{plan.destination}</p>
                    </div>
                    <ScoreRing value={plan.compatibility_score} size={68} label="" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{plan.duration} days</span>
                    <span className="font-medium text-foreground">{formatINR(total)}/person</span>
                    {plan.dates ? <span>{plan.dates}</span> : null}
                  </div>

                  <dl className="mt-4 space-y-2">
                    {[
                      ["Availability", plan.score_availability],
                      ["Budget", plan.score_budget],
                      ["Interests", plan.score_interests],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <div className="flex justify-between text-xs">
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="font-medium">{value}%</dd>
                        </div>
                        <Progress value={value as number} className="mt-1 h-1.5" />
                      </div>
                    ))}
                  </dl>

                  <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    {plan.reasoning.slice(0, 4).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {plan.activities.slice(0, 4).map((a) => (
                      <span key={a} className="rounded-full bg-muted px-2.5 py-1 text-[11px]">
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <HotelPicker
                      hotels={hotels}
                      selectedId={selectedHotel?.id ?? null}
                      nights={Math.max(1, plan.duration - 1)}
                      onSelect={(hotel) => selectHotel(plan, hotel)}
                    />
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      <ThumbsUp className="size-3.5" /> {votes[plan.id] ?? 0} Votes
                    </span>
                    <Button size="sm" onClick={() => finalize(plan.id)} disabled={finalizing}>
                      {finalizing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      {isWinner ? "Re-finalize" : "Finalize"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Participants can vote — and switch their vote — using the same invitation link.
          </p>
        </>
      )}
    </div>
  );
}
