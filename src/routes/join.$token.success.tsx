import { createFileRoute, Link } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";

import { JoinShell } from "@/routes/join.$token.index";
import { Button } from "@/components/ui/button";
import { useAnonToken, usePublicTrip } from "@/lib/tripsync/public";

export const Route = createFileRoute("/join/$token/success")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Preferences Submitted — CoJourney" },
      { name: "description", content: "Your anonymous preferences were added to the group plan." },
      { property: "og:title", content: "Preferences submitted" },
      { property: "og:description", content: "Your anonymous preferences were added to the group plan." },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { token } = Route.useParams();
  const anon = useAnonToken();
  const { data } = usePublicTrip(token, anon);
  const votingOpen = (data?.plans?.length ?? 0) > 0;

  return (
    <JoinShell>
      <div className="card-surface p-8 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-success/12 text-success">
          <PartyPopper className="size-8" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-bold">You're all set! 🎉</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your preferences have been anonymously added to the group plan.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't need to do anything else. We'll find the best plan for everyone.
        </p>
        <div className="mt-7 grid gap-2">
          {votingOpen ? (
            <Button asChild size="lg">
              <Link to="/join/$token/vote" params={{ token }}>
                Vote on the plans
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/join/$token" params={{ token }}>
              Back to trip
            </Link>
          </Button>
        </div>
      </div>
    </JoinShell>
  );
}
