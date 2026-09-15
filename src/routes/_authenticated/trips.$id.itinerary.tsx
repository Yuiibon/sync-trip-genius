import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Copy,
  Download,
  ExternalLink,
  MapPin,
  Navigation,
  Printer,
  Route as RouteIcon,
  Sparkles,
} from "lucide-react";

import { EmptyState } from "@/components/app/EmptyState";
import { ScoreRing } from "@/components/app/ScoreRing";
import { TripHeader } from "@/components/app/TripHeader";
import { ItineraryMap } from "@/components/Itinerary/ItineraryMap";
import { SendEmailModal } from "@/components/Itinerary/SendEmailModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/tripsync/constants";
import type { GeneratedItinerary } from "@/lib/tripsync/engine";
import {
  ensureDestinationLockedPlans,
  getItinerary,
  getPlans,
  getResponses,
  getTrip,
} from "@/lib/tripsync/queries";
import { geocodeItineraryStops } from "@/lib/tripsync/maps.functions";
import { dayPoints, mapsDirectionsUrl, mapsRouteUrl, mapsSearchUrl } from "@/lib/tripsync/maps";
import { inviteUrl, itineraryMessage } from "@/lib/tripsync/invite";
import { WhatsAppShareButton } from "@/components/app/WhatsAppShareButton";


export const Route = createFileRoute("/_authenticated/trips/$id/itinerary")({
  head: () => ({
    meta: [
      { title: "Final Itinerary — Co-Journey" },
      { name: "description", content: "The day-by-day plan, budget breakdown and packing list for your group trip." },
      { property: "og:title", content: "Final Itinerary — Co-Journey" },
      { property: "og:description", content: "Your group's finalized trip, day by day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
      const [trip, responses, savedPlans] = await Promise.all([
        getTrip(id),
        getResponses(id),
        getPlans(id),
      ]);
      const plans = await ensureDestinationLockedPlans(trip, responses, savedPlans);
      const itinerary = await getItinerary(id);
      return { trip, plans, itinerary };
    },
  });

  const [selectedDay, setSelectedDay] = useState(1);
  const [activeStop, setActiveStop] = useState<number | null>(null);

  const plan = data?.plans.find((p) => p.is_selected) ?? null;
  const content = (data?.itinerary?.content ?? null) as GeneratedItinerary | null;
  const destination = plan?.destination ?? data?.trip.destination ?? "";
  const day = content?.days.find((d) => d.day === selectedDay) ?? content?.days[0] ?? null;

  const points = useMemo(
    () => (day ? dayPoints(day.items, destination) : []),
    [day, destination],
  );

  const geocode = useServerFn(geocodeItineraryStops);
  const geo = useQuery({
    queryKey: ["geocode", points.map((p) => p.query)],
    enabled: points.length > 0,
    staleTime: Infinity,
    retry: false,
    queryFn: () => geocode({ data: { queries: points.slice(0, 12).map((p) => p.query) } }),
  });

  const mapPoints = points.map((p) => {
    const hit = geo.data?.places.find((x) => x.query === p.query);
    if (!hit || hit.lat == null || hit.lng == null) return p;
    return {
      ...p,
      lat: hit.lat,
      lng: hit.lng,
      ...(hit.placeId ? { placeId: hit.placeId } : {}),
      ...(hit.address ? { address: hit.address } : {}),
      label: hit.name ?? p.label,
    };
  });

  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;
  const { trip, itinerary } = data;


  if (!itinerary || !plan || !content || !day) {
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

  const url = inviteUrl(trip.invite_token);
  const doc: GeneratedItinerary = content;

  function downloadItinerary() {
    if (!plan) return;

    const lines = [
      `${trip.trip_name} — ${plan.destination}`,
      `${plan.duration} days · ${formatINR(plan.estimated_budget)} per person · ${plan.compatibility_score}% group match`,
      "",
      doc.summary,
      "",
      ...doc.days.flatMap((d) => [
        `Day ${d.day} — ${d.title}`,
        ...d.items.map((i) => `  ${i.time}: ${i.text}`),
        "",
      ]),
      "Budget breakdown:",
      ...doc.budget_breakdown.map((b) => `  ${b.label}: ${formatINR(b.amount)}`),
      `  Total: ${formatINR(plan.estimated_budget)}`,
      "",
      "Packing list:",
      ...doc.packing_list.map((p) => `  - ${p}`),
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

      <div className="flex flex-wrap gap-2">
        <WhatsAppShareButton
          size="sm"
          label="Share Finalized Trip to WhatsApp"
          message={itineraryMessage(plan.destination)}
          url={url}
        />
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Export PDF / Print
        </Button>
        <SendEmailModal tripId={trip.id} tripName={trip.trip_name} />
        <Button asChild variant="outline" size="sm">
          <a href={mapsRouteUrl(mapPoints)} target="_blank" rel="noopener noreferrer">
            <RouteIcon className="size-4" /> Open Full Google Route
          </a>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card-surface p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Day by day</h2>
            <Button asChild size="sm" variant="outline">
              <a href={mapsRouteUrl(mapPoints)} target="_blank" rel="noopener noreferrer">
                <RouteIcon className="size-4" /> Open Day {day.day} route
              </a>
            </Button>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
            {content.days.map((d) => (
              <button
                key={d.day}
                type="button"
                onClick={() => {
                  setSelectedDay(d.day);
                  setActiveStop(null);
                }}
                className={cn(
                  "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  d.day === day.day
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Day {d.day}
              </button>
            ))}
          </nav>

          <h3 className="mt-5 text-sm font-semibold">
            Day {day.day} — {day.title}
          </h3>

          <ol className="mt-3 space-y-3">
            {day.items.map((item, i) => {
      const point = mapPoints[i];
      if (!point) return null;
              return (
                <li
                  key={i}
                  onMouseEnter={() => setActiveStop(i)}
                  onMouseLeave={() => setActiveStop((cur) => (cur === i ? null : cur))}
                  onClick={() => setActiveStop(i)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3.5 transition-colors",
                    activeStop === i ? "border-secondary bg-secondary/5" : "hover:bg-muted/60",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">{item.time}</p>
                      <p className="text-sm">{item.text}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          <a href={mapsSearchUrl(point)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3.5" /> View on Google Maps
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                          <a
                            href={mapsDirectionsUrl(point)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation className="size-3.5" /> Get Directions
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="space-y-5">
          <section className="card-surface p-6">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-secondary" />
              <h2 className="font-display text-lg font-semibold">Day {day.day} map</h2>
            </div>
            <ItineraryMap
              className="mt-3 h-64"
              points={mapPoints}
              destination={plan.destination}
              activeIndex={activeStop}
              onActiveChange={setActiveStop}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {geo.isFetching
                ? "Locating stops…"
                : "Hover a stop to highlight it on the map."}
            </p>
          </section>

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
            <WhatsAppShareButton
              className="w-full"
              message={itineraryMessage(plan.destination)}
              url={url}
            />
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
