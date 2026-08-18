import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, PartyPopper } from "lucide-react";
import { z } from "zod";

import { InviteShare } from "@/components/app/ShareDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { makeInviteToken } from "@/lib/tripsync/invite";

export const Route = createFileRoute("/_authenticated/trips/new")({
  head: () => ({
    meta: [
      { title: "Create a Trip — Co-Journey" },
      { name: "description", content: "Set up a group trip and generate a shareable invitation link." },
      { property: "og:title", content: "Create a Trip — Co-Journey" },
      { property: "og:description", content: "Set up a group trip in under a minute." },
    ],
  }),
  component: NewTripPage,
});

const schema = z.object({
  trip_name: z.string().trim().min(3, "Give the trip a name").max(80),
  destination: z.string().trim().min(2, "Where are you thinking of going?").max(120),
  participant_count: z.coerce.number().int().min(2, "At least 2 participants").max(100),
  duration: z.coerce.number().int().min(1).max(30),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget_min: z.coerce.number().int().min(0).max(1000000),
  budget_max: z.coerce.number().int().min(0).max(1000000),
  organizer_message: z.string().trim().max(300).optional(),
});

const SUGGESTIONS = [
  "Goa, India",
  "Pondicherry, India",
  "Ooty, India",
  "Manali, India",
  "Jaipur, India",
  "Rishikesh, India",
  "Andaman Islands, India",
];

function NewTripPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ id: string; token: string; name: string } | null>(null);
  const [form, setForm] = useState({
    trip_name: "",
    destination: "",
    participant_count: "8",
    duration: "4",
    start_date: "",
    end_date: "",
    budget_min: "8000",
    budget_max: "12000",
    organizer_message: "Help us find the trip plan that works best for everyone.",
    participants: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function next() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the details");
      return;
    }
    if (parsed.data.budget_max < parsed.data.budget_min) {
      toast.error("Maximum budget must be higher than the minimum");
      return;
    }
    setStep(2);
  }

  async function generateLink() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the details");
      setStep(1);
      return;
    }
    setLoading(true);
    const token = makeInviteToken(parsed.data.destination);
    const { data, error } = await supabase
      .from("trips")
      .insert({
        trip_name: parsed.data.trip_name,
        destination: parsed.data.destination,
        duration: parsed.data.duration,
        participant_count: parsed.data.participant_count,
        budget_min: parsed.data.budget_min,
        budget_max: parsed.data.budget_max,
        start_date: parsed.data.start_date || null,
        end_date: parsed.data.end_date || null,
        organizer_message: parsed.data.organizer_message || null,
        invite_token: token,
        status: "collecting",
      })
      .select()
      .single();
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCreated({ id: data.id, token: data.invite_token, name: data.trip_name });
    setStep(3);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Create a trip</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three quick steps. Your group never needs an account.
        </p>
      </header>

      <ol className="flex items-center gap-2">
        {["Basics", "Participants", "Invite"].map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                step > i ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
            {i < 2 ? <span className="h-px flex-1 bg-border" /> : null}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <div className="card-surface space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="trip_name">Trip name</Label>
            <Input
              id="trip_name"
              placeholder="College Friends Goa Trip"
              value={form.trip_name}
              onChange={(e) => set("trip_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              list="destination-options"
              placeholder="Goa, India"
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
            />
            <datalist id="destination-options">
              {SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("destination", s)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  {s.split(",")[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="participant_count">Number of participants</Label>
              <Input
                id="participant_count"
                type="number"
                min={2}
                value={form.participant_count}
                onChange={(e) => set("participant_count", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Number of days</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Approx. start date</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Approx. end date</Label>
              <Input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_min">Budget per person (min)</Label>
              <Input
                id="budget_min"
                type="number"
                value={form.budget_min}
                onChange={(e) => set("budget_min", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">Budget per person (max)</Label>
              <Input
                id="budget_max"
                type="number"
                value={form.budget_max}
                onChange={(e) => set("budget_max", e.target.value)}
              />
            </div>
          </div>
          <Button className="w-full" size="lg" onClick={next}>
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="card-surface space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="participants">Participant names (optional)</Label>
            <Textarea
              id="participants"
              rows={4}
              placeholder="Aditi, Rohan, Meera…"
              value={form.participants}
              onChange={(e) => set("participants", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Only for your own reference. No phone numbers needed — the invitation travels as a
              WhatsApp link.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizer_message">Message shown on the invitation</Label>
            <Textarea
              id="organizer_message"
              rows={2}
              value={form.organizer_message}
              onChange={(e) => set("organizer_message", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setStep(1)} className="sm:w-auto">
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button className="flex-1" size="lg" onClick={generateLink} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Generate Invitation Link
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && created ? (
        <div className="card-surface space-y-5 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-success/12 text-success">
              <PartyPopper className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">Your trip is live</h2>
              <p className="text-sm text-muted-foreground">
                Share this link — responses land in your dashboard instantly.
              </p>
            </div>
          </div>
          <InviteShare token={created.token} tripName={created.name} />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate({ to: "/trips/$id", params: { id: created.id } })}
          >
            Go to trip
          </Button>
        </div>
      ) : null}
    </div>
  );
}
