import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { EmptyState } from "@/components/app/EmptyState";
import { TripHeader } from "@/components/app/TripHeader";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { analyzeTripResponses } from "@/lib/tripsync/engine";
import { getResponses, getTrip, toTripInput } from "@/lib/tripsync/queries";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/trips/$id/responses")({
  head: () => ({
    meta: [
      { title: "Group Response Analysis — TripSync AI" },
      { name: "description", content: "Availability heatmap, interest split and budget distribution for your group." },
      { property: "og:title", content: "Group Response Analysis — TripSync AI" },
      { property: "og:description", content: "See what your group actually agreed on." },
    ],
  }),
  component: ResponsesPage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function ResponsesPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["trip", id, "responses"],
    queryFn: async () => {
      const [trip, responses] = await Promise.all([getTrip(id), getResponses(id)]);
      return { trip, responses, analysis: analyzeTripResponses(responses, toTripInput(trip)) };
    },
  });

  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;
  const { trip, analysis } = data;
  const pct = Math.min(100, Math.round((analysis.responseCount / trip.participant_count) * 100));

  return (
    <div className="space-y-8">
      <TripHeader trip={trip} />

      {analysis.responseCount === 0 ? (
        <EmptyState
          icon={Users}
          title="No responses yet"
          description="Share the invitation link in your group chat — answers appear here the moment they arrive."
        />
      ) : (
        <>
          <div className="card-surface p-6">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Response progress</span>
              <span>
                {analysis.responseCount} / {trip.participant_count} participants responded
              </span>
            </div>
            <Progress value={pct} className="mt-3 h-2.5" />
          </div>

          <section className="card-surface p-6">
            <h2 className="font-display text-lg font-semibold">Availability analysis</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {analysis.bestWindow
                ? `Best window: ${analysis.bestWindow.dates[0]} → ${analysis.bestWindow.dates[analysis.bestWindow.dates.length - 1]} (${analysis.bestWindow.pct}% available)`
                : "Not enough date data yet."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {analysis.availability.map((d) => {
                const best = analysis.bestWindow?.dates.includes(d.date);
                return (
                  <div
                    key={d.date}
                    className={`rounded-xl border p-3 text-center transition-colors ${
                      best ? "border-secondary/50 bg-secondary/10" : "border-border"
                    }`}
                    style={{ opacity: 0.45 + (d.pct / 100) * 0.55 }}
                  >
                    <p className="text-xs text-muted-foreground">
                      {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                    <p className="font-display mt-1 text-lg font-bold">{d.pct}%</p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card-surface p-6">
              <h2 className="font-display text-lg font-semibold">Interest analysis</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.interests.slice(0, 7)}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card-surface p-6">
              <h2 className="font-display text-lg font-semibold">Budget distribution</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analysis.budget} dataKey="pct" nameKey="label" innerRadius={55} outerRadius={90}>
                      {analysis.budget.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {analysis.budget.map((b, i) => (
                  <li key={b.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {b.label}
                    </span>
                    <span className="font-medium">{b.pct}%</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {analysis.notes.length ? (
            <section className="card-surface p-6">
              <h2 className="font-display text-lg font-semibold">Anonymous notes</h2>
              <ul className="mt-3 space-y-2">
                {analysis.notes.map((n, i) => (
                  <li key={i} className="rounded-xl bg-muted px-4 py-3 text-sm">
                    “{n}”
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
