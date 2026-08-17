import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { InviteError, JoinShell } from "@/routes/join.$token.index";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  ACCOMMODATIONS,
  BUDGET_RANGES,
  INTERESTS,
  TRANSPORTATION,
  TRAVEL_STYLES,
} from "@/lib/tripsync/constants";
import { useAnonToken, usePublicTrip } from "@/lib/tripsync/public";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/join/$token/form")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tell Us What Works For You — CoJourney" },
      { name: "description", content: "Submit your dates, budget and interests anonymously in under a minute." },
      { property: "og:title", content: "Tell us what works for you" },
      { property: "og:description", content: "Anonymous preferences for your group trip." },
    ],
  }),
  component: FormPage,
});

function dateWindow(start: string | null, days: number) {
  const base = start ? new Date(start) : new Date(Date.now() + 21 * 864e5);
  return Array.from({ length: Math.max(6, days + 4) }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function FormPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const anon = useAnonToken();
  const { data, isLoading } = usePublicTrip(token, anon);

  const [dates, setDates] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [style, setStyle] = useState<string>("Moderate");
  const [stay, setStay] = useState<string>("No Preference");
  const [transport, setTransport] = useState<string>("No Preference");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
  if (data.already_responded) {
    return <InviteError title="Already submitted" text="You've already submitted your preferences." />;
  }
  if (data.trip.status === "finalized") {
    return <InviteError title="Responses closed" text="This trip is no longer accepting responses." />;
  }

  const trip = data.trip;
  const options = dateWindow(trip.start_date, trip.duration);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit() {
    if (dates.length === 0) {
      toast.error("Pick at least one date you're available");
      return;
    }
    if (!budget) {
      toast.error("Choose a budget range");
      return;
    }
    if (interests.length === 0) {
      toast.error("Pick at least one interest");
      return;
    }


    setSaving(true);
    const { data: res, error } = await supabase.rpc("submit_participant_response", {
      p_token: token,
      p_anon: anon,
      p_dates: dates,
      p_budget: budget,
      p_interests: interests,
      p_style: style,
      p_accommodation: stay,
      p_transportation: transport,
      p_notes: notes.trim(),
    });
    setSaving(false);
    const result = res as unknown as { ok: boolean; error?: string } | null;
    if (error || !result?.ok) {
      toast.error(
        result?.error === "duplicate"
          ? "You've already submitted your preferences."
          : result?.error === "closed"
            ? "This trip is no longer accepting responses."
            : "Something went wrong. Please try again.",
      );
      return;
    }
    navigate({ to: "/join/$token/success", params: { token } });
  }

  return (
    <JoinShell>
      <div className="card-surface space-y-7 p-6">
        <div>
          <h1 className="font-display text-xl font-bold">Tell us what works for you</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your responses are collected anonymously and used only to find the best plan for the
            group.
          </p>
        </div>

        <section className="space-y-3">
          <Label>Availability</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {options.map((d) => {
              const on = dates.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(dates, setDates, d)}
                  className={cn(
                    "rounded-xl border p-2.5 text-center text-xs transition-all",
                    on
                      ? "border-secondary bg-secondary/12 font-semibold text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <span className="block">
                    {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <span className="block text-[10px] opacity-70">
                    {new Date(d).toLocaleDateString("en-IN", { weekday: "short" })}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <Label>Budget per person</Label>
          <div className="grid gap-2">
            {BUDGET_RANGES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBudget(b.id)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm transition-all",
                  budget === b.id
                    ? "border-secondary bg-secondary/12 font-semibold"
                    : "border-border hover:bg-muted",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <Label>Travel interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const on = interests.includes(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggle(interests, setInterests, i.id)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm transition-all",
                    on
                      ? "border-secondary bg-secondary/12 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {i.emoji} {i.label}
                </button>
              );
            })}
          </div>
        </section>

        <ChipGroup label="Travel style" options={[...TRAVEL_STYLES]} value={style} onChange={setStyle} />
        <ChipGroup label="Accommodation preference" options={[...ACCOMMODATIONS]} value={stay} onChange={setStay} />
        <ChipGroup label="Transportation preference" options={[...TRANSPORTATION]} value={transport} onChange={setTransport} />

        <section className="space-y-2">
          <Label htmlFor="notes">Anything else we should know?</Label>
          <Textarea
            id="notes"
            rows={3}
            maxLength={300}
            placeholder="Prefer less walking · Vegetarian food preferred"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        <Button size="lg" className="w-full" onClick={submit} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Submit My Preferences
        </Button>
      </div>
    </JoinShell>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <section className="space-y-3">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full border px-3 py-2 text-sm transition-all",
              value === o
                ? "border-secondary bg-secondary/12 font-semibold"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </section>
  );
}
