import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, ShieldCheck, Users } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnonToken, usePublicTrip } from "@/lib/tripsync/public";

export const Route = createFileRoute("/join/$token/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "You're Invited — TripSync AI" },
      { name: "description", content: "Share your availability, budget and interests anonymously for your group trip." },
      { property: "og:title", content: "You're invited to plan a trip" },
      { property: "og:description", content: "Tap to share your dates, budget and interests. No login needed." },
    ],
  }),
  component: JoinPage,
});

export function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-hero-glow flex min-h-screen flex-col items-center px-4 py-8">
      <Logo className="mb-6" />
      <div className="w-full max-w-lg">{children}</div>
      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Powered by TripSync AI · Responses are anonymous
      </p>
    </div>
  );
}

export function InviteError({ title, text }: { title: string; text: string }) {
  return (
    <JoinShell>
      <div className="card-surface p-8 text-center">
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Go to TripSync AI</Link>
        </Button>
      </div>
    </JoinShell>
  );
}

function JoinPage() {
  const { token } = Route.useParams();
  const anon = useAnonToken();
  const { data, isLoading } = usePublicTrip(token, anon);

  if (isLoading || !data) {
    return (
      <JoinShell>
        <Skeleton className="h-72 rounded-2xl" />
      </JoinShell>
    );
  }

  if (!data.found || !data.trip) {
    return (
      <InviteError
        title="Invitation not found"
        text="Sorry, this invitation link is invalid or has expired."
      />
    );
  }

  const trip = data.trip;
  const votingOpen = (data.plans?.length ?? 0) > 0;

  return (
    <JoinShell>
      <div className="card-surface overflow-hidden">
        <div className="bg-brand px-6 py-8 text-center text-primary-foreground">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70">
            You're invited to join
          </p>
          <h1 className="font-display mt-2 text-2xl font-bold">{trip.trip_name}</h1>
        </div>
        <div className="space-y-5 p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> Destination
              </dt>
              <dd className="mt-1 font-semibold">{trip.destination}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" /> Duration
              </dt>
              <dd className="mt-1 font-semibold">{trip.duration} days</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="size-3.5" /> Group size
              </dt>
              <dd className="mt-1 font-semibold">{trip.participant_count} people</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" /> Responses
              </dt>
              <dd className="mt-1 font-semibold">{data.response_count ?? 0} so far</dd>
            </div>
          </dl>

          {trip.organizer_message ? (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              “{trip.organizer_message}”
            </p>
          ) : null}

          {data.already_responded ? (
            <div className="space-y-3">
              <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
                You've already submitted your preferences.
              </p>
              {votingOpen ? (
                <Button asChild size="lg" className="w-full">
                  <Link to="/join/$token/vote" params={{ token }}>
                    Vote on the plans
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : trip.status === "finalized" ? (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              This trip is no longer accepting responses.
            </p>
          ) : (
            <Button asChild size="lg" className="w-full">
              <Link to="/join/$token/form" params={{ token }}>
                Join Trip
              </Link>
            </Button>
          )}

          {votingOpen && !data.already_responded ? (
            <Button asChild variant="outline" className="w-full">
              <Link to="/join/$token/vote" params={{ token }}>
                Skip to voting
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </JoinShell>
  );
}
