import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Copy, Download, MapPin, MessageCircle, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { ScoreRing } from "@/components/app/ScoreRing";
import { TripHeader } from "@/components/app/TripHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/tripsync/constants";
import type { GeneratedItinerary } from "@/lib/tripsync/engine";
import { getItinerary, getPlans, getTrip } from "@/lib/tripsync/queries";
import { inviteUrl, whatsappShareUrl } from "@/lib/tripsync/invite";

export const Route = createFileRoute("/_authenticated/trips/$id/itinerary")({
  head: () => ({
    meta: [
      { title: "Final Itinerary — TripSync AI" },
      { name: "description", content: "The day-by-day plan, budget breakdown and packing list for your group trip." },
      { property: "og:title", content: "Final Itinerary — TripSync AI" },
      { property: "og:description", content: "Your group's finalized trip, day by day." },
    ],
  }),
  component: ItineraryPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function ItineraryPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["trip", id, "itinerary"],
    queryFn: async () => {
      const [trip, plans, itinerary] = await Promise.all([getTrip(id), getPlans(id), getItinerary(id)]);
      return { trip, plans, itinerary };
    },
  });

  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;
  const { trip, plans, itinerary } = data;
  const plan = plans.find((p) => p.is_selected) ?? null;

  if (!itinerary || !plan) {
    return (
      <div className="space-y-8">
        <TripHeader trip={trip} />
        <EmptyState
          icon={Sparkles}
          title="No itinerary yet"
          description="Finalize one of the AI plans and the full day-by-day itinerary is generated instantly."
          action={
            <Button asChild>
              <Link to="/trips/$id/plans" params={{ id }}>
                Go to AI plans
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const content = itinerary.content as unknown as GeneratedItinerary;
  const url = inviteUrl(trip.invite_token);

  function downloadItinerary() {
    const lines = [
      `${trip.trip_name} — ${plan!.destination}`,
      `${plan!.duration} days · ${formatINR(plan!.estimated_budget)} per person · ${plan!.compatibility_score}% group match`,
      "",
      content.summary,
      "",
      ...content.days.flatMap((d) => [
        `Day ${d.day} — ${d.title}`,
        ...d.items.map((i) => `  ${i.time}: ${i.text}`),
        "",
      ]),
      "Budget breakdown:",
      ...content.budget_breakdown.map((b) => `  ${b.label}: ${formatINR(b.amount)}`),
      `  Total: ${formatINR(plan!.estimated_budget)}`,
      "",
      "Packing list:",
      ...content.packing_list.map((p) => `  - ${p}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${trip.trip_name.replace(/\s+/g, "-").toLowerCase()}-itinerary.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-8">
      <TripHeader trip={trip} />

      <section className="bg-brand relative overflow-hidden rounded-3xl p-8 text-primary-foreground shadow-lift">
        <div className="pointer-events-none absolute -right-12 -top-12 size-52 rounded-full bg-secondary/25 blur-3xl" />
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Your Trip Is Ready 🎉</h2>
        <p className="mt-2 max-w-2xl text-sm text-primary-foreground/80">{content.summary}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Destination", plan.destination],
            ["Duration", `${plan.duration} days`],
            ["Estimated cost", `${formatINR(plan.estimated_budget)}/person`],
            ["Group size", `${trip.participant_count}`],
            ["Best match", `${plan.compatibility_score}%`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-primary-foreground/10 p-3">
              <p className="text-[11px] uppercase tracking-wide text-primary-foreground/70">{k}</p>
              <p className="mt-1 truncate text-sm font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card-surface p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Day by day</h2>
          <ol className="mt-5 space-y-6">
            {content.days.map((day) => (
              <li key={day.day} className="relative border-l-2 border-border pl-5">
                <span className="absolute -left-[7px] top-1 size-3 rounded-full bg-secondary" />
                <h3 className="text-sm font-semibold">
                  Day {day.day} — {day.title}
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {day.items.map((item, i) => (
                    <li key={i} className="grid grid-cols-[70px_minmax(0,1fr)] gap-3 text-sm">
                      <span className="text-xs font-medium text-muted-foreground">{item.time}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-5">
          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-semibold">Budget breakdown</h2>
            <div className="mx-auto mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={content.budget_breakdown} dataKey="amount" nameKey="label" innerRadius={45} outerRadius={72}>
                    {content.budget_breakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {content.budget_breakdown.map((b, i) => (
                <li key={b.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {b.label}
                  </span>
                  <span className="font-medium">{formatINR(b.amount)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatINR(plan.estimated_budget)}/person</span>
              </li>
            </ul>
          </section>

          <section className="card-surface p-6">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-secondary" />
              <h2 className="font-display text-lg font-semibold">Map</h2>
            </div>
            <div className="mt-3 grid h-44 place-items-center rounded-xl border border-dashed bg-muted text-center text-xs text-muted-foreground">
              <div className="px-6">
                <p className="font-medium text-foreground">{plan.destination}</p>
                <p className="mt-1">
                  Interactive map ready for Google Maps / Mapbox once credentials are added.
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {plan.activities.slice(0, 5).map((a) => (
                <li key={a}>📍 {a}</li>
              ))}
            </ul>
          </section>

          <section className="card-surface space-y-2 p-6">
            <h2 className="font-display text-lg font-semibold">Share trip</h2>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Trip link copied");
              }}
            >
              <Copy className="size-4" /> Copy Trip Link
            </Button>
            <Button asChild className="w-full">
              <a href={whatsappShareUrl(url, trip.trip_name)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> Share on WhatsApp
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={downloadItinerary}>
              <Download className="size-4" /> Download Itinerary
            </Button>
          </section>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <section className="card-surface p-6">
          <h2 className="font-display text-base font-semibold">Packing checklist</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {content.packing_list.map((p) => (
              <li key={p}>☐ {p}</li>
            ))}
          </ul>
        </section>
        <section className="card-surface p-6">
          <h2 className="font-display text-base font-semibold">Food recommendations</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {content.food.map((f) => (
              <li key={f}>🍽 {f}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Stay: {content.accommodation} · Travel: {content.transportation}
          </p>
        </section>
        <section className="card-surface p-6">
          <h2 className="font-display text-base font-semibold">Travel tips</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {content.tips.map((t) => (
              <li key={t}>💡 {t}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex justify-center">
        <ScoreRing value={plan.compatibility_score} label="Final group match" />
      </div>
    </div>
  );
}
