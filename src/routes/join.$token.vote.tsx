import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ThumbsUp } from "lucide-react";

import { InviteError, JoinShell } from "@/routes/join.$token.index";
import { ScoreRing } from "@/components/app/ScoreRing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/tripsync/constants";
import { useAnonToken, usePublicTrip } from "@/lib/tripsync/public";

export const Route = createFileRoute("/join/$token/vote")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Vote On The Plans — CoJourney" },
      { name: "description", content: "Pick the trip plan that works best for you. Votes stay anonymous." },
      { property: "og:title", content: "Vote on the trip plans" },
      { property: "og:description", content: "Pick the plan that works best for you — anonymously." },
    ],
  }),
  component: VotePage,
});

function VotePage() {
  const { token } = Route.useParams();
  const anon = useAnonToken();
  const queryClient = useQueryClient();
  const { data, isLoading } = usePublicTrip(token, anon);
  const [voting, setVoting] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <JoinShell>
        <Skeleton className="h-96 rounded-2xl" />
      </JoinShell>
    );
  }
  if (!data.found || !data.trip) {
    return <InviteError title="Invitation not found" text="Sorry, this invitation link is invalid or has expired." />;
  }
  const plans = data.plans ?? [];
  if (!plans.length) {
    return (
      <InviteError
        title="Plans aren't ready yet"
        text="The organizer hasn't generated the trip options yet. Check back after everyone has responded."
      />
    );
  }
  const votedPlanId = data.voted_plan_id ?? null;

  async function vote(planId: string) {
    setVoting(planId);
    const { data: res, error } = await supabase.rpc("cast_plan_vote", {
      p_token: token,
      p_anon: anon,
      p_plan_id: planId,
    });
    setVoting(null);
    const result = res as unknown as { ok: boolean; error?: string } | null;
    if (error || !result?.ok) {
      toast.error(
        result?.error === "closed"
          ? "The organizer has already locked in the final plan."
          : "Something went wrong. Please try again.",
      );
      return;
    }
    toast.success("Vote recorded — you can change it any time.");
    await queryClient.invalidateQueries({ queryKey: ["public-trip"] });
  }

  return (
    <JoinShell>
      <div className="space-y-4">
        <div className="card-surface p-6 text-center">
          <h1 className="font-display text-xl font-bold">Choose the plan that works best for you</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votes are anonymous. One vote per person — you can switch it any time.
          </p>
        </div>

        {plans.map((plan) => {
          const mine = votedPlanId === plan.id;
          return (
          <article
            key={plan.id}
            className={
              "card-surface p-5" +
              (plan.is_selected ? " border-2 border-[oklch(0.78_0.15_85)]" : mine ? " border-2 border-secondary" : "")
            }
          >
            {plan.is_selected ? (
              <p className="mb-2 inline-flex rounded-full bg-[oklch(0.78_0.15_85)]/15 px-2.5 py-1 text-[11px] font-semibold text-[oklch(0.55_0.13_85)]">
                FINALIZED PLAN
              </p>
            ) : null}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">{plan.plan_name}</h2>
                <p className="truncate text-sm text-muted-foreground">{plan.destination}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.duration} days · {formatINR(plan.estimated_budget)}/person
                  {plan.dates ? ` · ${plan.dates}` : ""}
                </p>
              </div>
              <ScoreRing value={plan.compatibility_score} size={62} label="" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {plan.activities.slice(0, 4).map((a) => (
                <span key={a} className="rounded-full bg-muted px-2.5 py-1 text-[11px]">
                  {a}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                <ThumbsUp className="size-3.5" /> {plan.vote_count ?? 0} Votes
              </span>
              <Button
                className="flex-1"
                variant={mine ? "secondary" : "default"}
                onClick={() => vote(plan.id)}
                disabled={!!voting}
              >
                {voting === plan.id ? <Loader2 className="size-4 animate-spin" /> : <ThumbsUp className="size-4" />}
                {mine ? "Your vote" : "Vote for this plan"}
              </Button>
            </div>
          </article>
          );
        })}
      </div>
    </JoinShell>
  );
}
