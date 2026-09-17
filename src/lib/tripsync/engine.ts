/**
 * Co-Journey — group compatibility engine.
 *
 * Pure, deterministic scoring layer over the structured responses collected
 * from participants. These functions are intentionally framework-free and
 * side-effect-free so they can later be replaced by (or delegated to) a
 * Python/FastAPI service running scikit-learn models. Keep the input and
 * output shapes stable: they are the API contract with the future ML backend.
 *
 *   analyzeTripResponses()      -> aggregate group signal
 *   calculateCompatibilityScore() -> score a candidate plan against the group
 *   generateRecommendations()   -> rank candidate plans, return top 3
 *   generateItinerary()         -> day-by-day plan + budget + packing list
 */

import { BUDGET_RANGES, INTERESTS, interestLabel } from "./constants";

export type ParticipantResponse = {
  id: string;
  available_dates: string[];
  budget_range: string | null;
  interests: string[];
  travel_style: string | null;
  accommodation: string | null;
  transportation: string | null;
  additional_preferences: string | null;
};

export type TripInput = {
  trip_name: string;
  destination: string;
  duration: number;
  participant_count: number;
  budget_min: number;
  budget_max: number;
  start_date?: string | null;
  end_date?: string | null;
};

export type Distribution = { id: string; label: string; count: number; pct: number };

export type TripAnalysis = {
  responseCount: number;
  expected: number;
  availability: { date: string; count: number; pct: number }[];
  bestWindow: { dates: string[]; pct: number } | null;
  interests: Distribution[];
  budget: Distribution[];
  styles: Distribution[];
  accommodations: Distribution[];
  transportation: Distribution[];
  medianBudget: number;
  notes: string[];
};

export type CandidatePlan = {
  key: string;
  plan_name: string;
  destination: string;
  duration: number;
  estimated_budget: number;
  activities: string[];
  tags: string[];
};

export type ScoredPlan = CandidatePlan & {
  dates: string;
  compatibility_score: number;
  score_availability: number;
  score_budget: number;
  score_interests: number;
  reasoning: string[];
};

const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

function distribution(values: (string | null | undefined)[], labeler?: (v: string) => string) {
  const total = values.filter(Boolean).length;
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([id, count]) => ({ id, label: labeler ? labeler(id) : id, count, pct: pct(count, total) }))
    .sort((a, b) => b.count - a.count);
}

function budgetMidpoint(id: string | null): number | null {
  const r = BUDGET_RANGES.find((b) => b.id === id);
  return r ? (r.min + r.max) / 2 : null;
}

/** Aggregates every anonymous response into a single group signal. */
export function analyzeTripResponses(
  responses: ParticipantResponse[],
  trip: TripInput,
): TripAnalysis {
  const n = responses.length;

  const dateMap = new Map<string, number>();
  for (const r of responses) for (const d of r.available_dates ?? []) {
    dateMap.set(d, (dateMap.get(d) ?? 0) + 1);
  }
  const availability = [...dateMap.entries()]
    .map(([date, count]) => ({ date, count, pct: pct(count, n) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Best consecutive window of `duration` days by average availability.
  let bestWindow: TripAnalysis["bestWindow"] = null;
  const sortedDates = availability.map((a) => a.date);
  const need = Math.max(1, Math.min(trip.duration, sortedDates.length));
  for (let i = 0; i + need <= sortedDates.length; i++) {
    const slice = availability.slice(i, i + need);
    const contiguous = slice.every((d, idx) => {
      if (idx === 0) return true;
      const prev = new Date(slice[idx - 1]!.date).getTime();
      return new Date(d.date).getTime() - prev <= 1000 * 60 * 60 * 24 * 1.5;
    });
    if (!contiguous) continue;
    const avg = Math.round(slice.reduce((s, d) => s + d.pct, 0) / slice.length);
    if (!bestWindow || avg > bestWindow.pct) {
      bestWindow = { dates: slice.map((d) => d.date), pct: avg };
    }
  }
  if (!bestWindow && availability.length) {
    const top = [...availability].sort((a, b) => b.pct - a.pct).slice(0, need);
    bestWindow = {
      dates: top.map((d) => d.date).sort(),
      pct: Math.round(top.reduce((s, d) => s + d.pct, 0) / top.length),
    };
  }

  const interestCounts = new Map<string, number>();
  for (const r of responses) for (const i of r.interests ?? []) {
    interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1);
  }
  const interests = [...interestCounts.entries()]
    .map(([id, count]) => ({ id, label: interestLabel(id), count, pct: pct(count, n) }))
    .sort((a, b) => b.count - a.count);

  const budgets = responses.map((r) => r.budget_range);
  const mids = budgets.map(budgetMidpoint).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const medianBudget = mids.length
    ? mids[Math.floor(mids.length / 2)]!
    : (trip.budget_min + trip.budget_max) / 2;

  return {
    responseCount: n,
    expected: trip.participant_count,
    availability,
    bestWindow,
    interests,
    budget: distribution(budgets, (id) => BUDGET_RANGES.find((b) => b.id === id)?.label ?? id),
    styles: distribution(responses.map((r) => r.travel_style)),
    accommodations: distribution(responses.map((r) => r.accommodation)),
    transportation: distribution(responses.map((r) => r.transportation)),
    medianBudget,
    notes: responses.map((r) => r.additional_preferences).filter((v): v is string => !!v),
  };
}

/** Weighted compatibility of a candidate plan with the aggregated group signal. */
export function calculateCompatibilityScore(plan: CandidatePlan, analysis: TripAnalysis) {
  const availabilityScore = analysis.bestWindow?.pct ?? 0;

  // Budget: how many participants can absorb the plan price.
  const withBudget = analysis.budget.reduce((s, b) => s + b.count, 0);
  let comfortable = 0;
  for (const b of analysis.budget) {
    const range = BUDGET_RANGES.find((r) => r.id === b.id);
    if (!range) continue;
    if (plan.estimated_budget <= range.max * 1.05) comfortable += b.count;
  }
  const budgetScore = withBudget ? Math.round((comfortable / withBudget) * 100) : 70;

  // Interests: share of group interest weight covered by the plan's tags.
  const totalWeight = analysis.interests.reduce((s, i) => s + i.count, 0);
  const covered = analysis.interests
    .filter((i) => plan.tags.includes(i.id))
    .reduce((s, i) => s + i.count, 0);
  const interestScore = totalWeight ? Math.round((covered / totalWeight) * 100) : 60;

  const overall = Math.round(availabilityScore * 0.35 + budgetScore * 0.3 + interestScore * 0.35);

  return {
    availability: availabilityScore,
    budget: budgetScore,
    interests: interestScore,
    overall: Math.max(0, Math.min(100, overall)),
  };
}

const CATALOG: CandidatePlan[] = [
  {
    key: "goa",
    plan_name: "Goa Adventure",
    destination: "Goa, India",
    duration: 4,
    estimated_budget: 10200,
    activities: ["Water sports at Baga", "Beach hopping", "Scuba diving", "Night market", "Sunset cruise"],
    tags: ["beach", "water", "nightlife", "adventure", "food", "photography"],
  },
  {
    key: "pondicherry",
    plan_name: "Pondicherry Escape",
    destination: "Pondicherry, India",
    duration: 3,
    estimated_budget: 7500,
    activities: ["Promenade beach", "French Quarter cafes", "Heritage walk", "Cycling tour", "Auroville"],
    tags: ["beach", "food", "history", "photography", "nature"],
  },
  {
    key: "ooty",
    plan_name: "Ooty Nature Trip",
    destination: "Ooty, India",
    duration: 3,
    estimated_budget: 6800,
    activities: [
      "Doddabetta Peak",
      "Government Botanical Garden, Ooty",
      "Ooty Lake Boat House",
      "The Tea Factory and The Tea Museum",
      "Nilgiri Mountain Railway, Udagamandalam",
    ],
    tags: ["nature", "trekking", "photography", "camping"],
  },
  {
    key: "manali",
    plan_name: "Manali High Trail",
    destination: "Manali, India",
    duration: 5,
    estimated_budget: 13500,
    activities: ["Solang valley adventure", "Hampta trail", "Old Manali cafes", "River rafting", "Camping night"],
    tags: ["trekking", "adventure", "nature", "camping", "photography"],
  },
  {
    key: "jaipur",
    plan_name: "Jaipur Heritage Run",
    destination: "Jaipur, India",
    duration: 3,
    estimated_budget: 8200,
    activities: ["Amber Fort", "Bazaar shopping", "Rooftop dining", "City Palace", "Hot air balloon"],
    tags: ["history", "shopping", "food", "photography"],
  },
  {
    key: "rishikesh",
    plan_name: "Rishikesh Rapids",
    destination: "Rishikesh, India",
    duration: 3,
    estimated_budget: 6500,
    activities: ["White water rafting", "Bungee jumping", "Riverside camping", "Ganga aarti", "Cliff jumping"],
    tags: ["adventure", "water", "camping", "nature"],
  },
  {
    key: "andaman",
    plan_name: "Andaman Blue",
    destination: "Port Blair & Havelock, India",
    duration: 5,
    estimated_budget: 21000,
    activities: ["Radhanagar beach", "Scuba certification", "Sea walk", "Island hopping", "Snorkelling"],
    tags: ["beach", "water", "adventure", "photography", "nature"],
  },
  {
    key: "mumbai",
    plan_name: "Mumbai City Lights",
    destination: "Mumbai, India",
    duration: 3,
    estimated_budget: 9500,
    activities: ["Marine Drive", "Street food crawl", "Colaba shopping", "Elephanta caves", "Club night"],
    tags: ["food", "shopping", "nightlife", "history", "themeparks"],
  },
];

function seasonalDates(analysis: TripAnalysis, duration: number) {
  if (analysis.bestWindow?.dates.length) {
    const d = analysis.bestWindow.dates;
    const fmt = (s: string) =>
      new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return d.length > 1 ? `${fmt(d[0]!)} – ${fmt(d[d.length - 1]!)}` : fmt(d[0]!);
  }
  return `Flexible · ${duration} days`;
}

function buildReasoning(
  plan: CandidatePlan,
  scores: ReturnType<typeof calculateCompatibilityScore>,
  analysis: TripAnalysis,
): string[] {
  const out: string[] = [];
  const matched = Math.round((scores.availability / 100) * analysis.responseCount);
  if (analysis.bestWindow) {
    out.push(
      `✓ Matches ${matched}/${analysis.responseCount} participants' availability on the suggested dates`,
    );
  }
  if (scores.budget >= 70) out.push(`✓ Fits the majority budget at ₹${plan.estimated_budget.toLocaleString("en-IN")} per person`);
  else out.push(`⚠ Above the comfortable budget for ${100 - scores.budget}% of the group`);

  const topCovered = analysis.interests.filter((i) => plan.tags.includes(i.id)).slice(0, 3);
  if (topCovered.length) {
    out.push(`✓ Covers ${scores.interests}% of selected interests including ${topCovered.map((i) => i.label).join(", ")}`);
  }
  const missed = analysis.interests.filter((i) => !plan.tags.includes(i.id) && i.pct >= 40)[0];
  if (missed) out.push(`⚠ Light on ${missed.label}, chosen by ${missed.pct}% of the group`);
  if (analysis.styles[0]) out.push(`✓ Suits a mostly ${analysis.styles[0].label.toLowerCase()} travel style`);
  return out;
}

function sameDestinationVariants(
  base: CandidatePlan,
  trip: TripInput,
  analysis: TripAnalysis,
): CandidatePlan[] {
  const city = trip.destination.split(",")[0]?.trim() || trip.destination.trim();
  const duration = trip.duration || base.duration;
  const midpoint = Math.max(1, Math.round(analysis.medianBudget));
  const withinTripBudget = (amount: number) =>
    Math.max(trip.budget_min, Math.min(trip.budget_max, Math.round(amount / 100) * 100));
  const activities = base.activities.length
    ? base.activities
    : [`Top sights in ${city}`, `Local food tour in ${city}`, `Nature experience in ${city}`];

  return [
    {
      ...base,
      key: `${base.key}-balanced`,
      plan_name: `${city} Highlights`,
      destination: trip.destination.trim(),
      duration,
      estimated_budget: withinTripBudget(midpoint),
      activities,
    },
    {
      ...base,
      key: `${base.key}-explorer`,
      plan_name: `${city} Explorer`,
      destination: trip.destination.trim(),
      duration,
      estimated_budget: withinTripBudget(midpoint * 1.08),
      activities: [...activities.slice(1), activities[0]].filter((item): item is string => Boolean(item)),
      tags: [...new Set([...base.tags, "adventure", "photography"])],
    },
    {
      ...base,
      key: `${base.key}-relaxed`,
      plan_name: `${city} Slow & Scenic`,
      destination: trip.destination.trim(),
      duration,
      estimated_budget: withinTripBudget(midpoint * 0.92),
      activities: [...activities].reverse(),
      tags: [...new Set([...base.tags, "nature", "food"])],
    },
  ];
}

/** Scores three styles within the organizer's selected destination. */
export function generateRecommendations(trip: TripInput, analysis: TripAnalysis): ScoredPlan[] {
  const home = trip.destination.trim();
  const homeKey = home.toLowerCase();
  const catalogHome = CATALOG.find((c) => homeKey.includes(c.key));

  const topTags = analysis.interests.slice(0, 5).map((i) => i.id);
  const fallbackTags = topTags.length ? topTags : ["beach", "food", "nature"];

  const primary: CandidatePlan = catalogHome
    ? { ...catalogHome, duration: trip.duration || catalogHome.duration }
    : {
        key: "primary",
        plan_name: `${home.split(",")[0]} Group Trip`,
        destination: home,
        duration: trip.duration || 3,
        estimated_budget: Math.round(analysis.medianBudget),
        activities: fallbackTags.map(
          (t) => `${interestLabel(t)} experience in ${home.split(",")[0]}`,
        ),
        tags: fallbackTags,
      };

  const candidates = sameDestinationVariants(primary, trip, analysis);

  const scored = candidates
    .map((plan) => {
      const scores = calculateCompatibilityScore(plan, analysis);
      return {
        ...plan,
        dates: seasonalDates(analysis, plan.duration),
        compatibility_score: Math.min(99, scores.overall),
        score_availability: scores.availability,
        score_budget: scores.budget,
        score_interests: scores.interests,
        reasoning: buildReasoning(plan, scores, analysis),
      } satisfies ScoredPlan;
    })
    .sort((a, b) => b.compatibility_score - a.compatibility_score);

  return scored.slice(0, 3);
}

export type ItineraryDay = { day: number; title: string; items: { time: string; text: string }[] };
export type GeneratedItinerary = {
  summary: string;
  days: ItineraryDay[];
  budget_breakdown: { label: string; amount: number }[];
  packing_list: string[];
  tips: string[];
  food: string[];
  accommodation: string;
  transportation: string;
};

/** Arrival / departure hub for the group's preferred way of travelling. */
function transportHub(city: string, transport: string) {
  const t = transport.toLowerCase();
  if (t.includes("train")) return { hub: `${city} Railway Station`, mode: "train" };
  if (t.includes("flight") || t.includes("air")) return { hub: `${city} Airport`, mode: "flight" };
  if (t.includes("bus")) return { hub: `${city} Bus Stand`, mode: "bus" };
  if (t.includes("car") || t.includes("cab")) return { hub: `${city} city centre`, mode: "road trip" };
  return { hub: `${city} Bus Stand`, mode: "shared transport" };
}

/** Builds the final day-by-day itinerary for the winning plan. */
export function generateItinerary(
  plan: { plan_name: string; destination: string; duration: number; estimated_budget: number; activities: string[] },
  analysis: TripAnalysis,
): GeneratedItinerary {
  const city = plan.destination.split(",")[0]!.trim();
  const days: ItineraryDay[] = [];
  const acts = plan.activities.length ? plan.activities : ["Local sightseeing"];
  const total = Math.max(2, plan.duration);

  const transportPref = analysis.transportation[0]?.label ?? "Train";
  const stayPref = analysis.accommodations[0]?.label ?? "Hotel";
  const { hub, mode } = transportHub(city, transportPref);
  const stay = `${stayPref === "No Preference" ? "Hotel" : stayPref} in ${city}`;
  const act = (i: number) => acts[((i % acts.length) + acts.length) % acts.length] ?? `Central ${city}`;

  for (let d = 1; d <= total; d++) {
    if (d === 1) {
      days.push({
        day: 1,
        title: `Arrival by ${mode} & easy start`,
        items: [
          {
            time: "07:30 AM",
            text: `Group meet-up at ${hub} — wait near the main exit, headcount and share the group location pin`,
          },
          {
            time: "08:30 AM",
            text: `Transfer from ${hub} to ${stay} — pre-booked cab, keep IDs handy`,
          },
          {
            time: "09:30 AM",
            text: `Check-in at ${stay} — drop bags, freshen up, room allotment`,
          },
          { time: "10:30 AM", text: `Breakfast near ${stay} — local specialities, budget ₹150–250 each` },
          { time: "11:30 AM", text: `${act(0)} — first sightseeing stop, allow about 2 hours` },
          { time: "02:00 PM", text: `Lunch in ${city} — sit-down thali, 1 hour break` },
          { time: "03:30 PM", text: `${act(1)} — afternoon stop, best light for photos` },
          { time: "06:00 PM", text: `${act(2)} — relaxed evening walk` },
          { time: "08:30 PM", text: `Group dinner in ${city} — trip briefing and plan for tomorrow` },
        ],
      });
    } else if (d === total) {
      days.push({
        day: d,
        title: "Last stops & return",
        items: [
          { time: "07:30 AM", text: `Breakfast at ${stay} — pack bags before leaving the room` },
          { time: "09:00 AM", text: `${act(d + 1)} — final sightseeing stop` },
          { time: "11:00 AM", text: `Checkout from ${stay} — settle bills, store luggage at reception` },
          { time: "12:00 PM", text: `${act(d + 2)} — souvenir shopping and last group photo` },
          { time: "02:00 PM", text: `Lunch in ${city} before heading out` },
          { time: "03:30 PM", text: `Transfer to ${hub} — reach 45 minutes early for the return ${mode}` },
        ],
      });
    } else {
      const a1 = act(d - 1);
      const a2 = act(d);
      const a3 = act(d + 1);
      days.push({
        day: d,
        title: a1,
        items: [
          { time: "07:30 AM", text: `Breakfast at ${stay} — leave by 8:30 AM to beat the crowd` },
          { time: "09:00 AM", text: `${a1} — main stop of the day, roughly 2–3 hours` },
          { time: "12:30 PM", text: `Lunch in ${city} — local restaurant close to the next stop` },
          { time: "02:00 PM", text: `${a2} — afternoon activity` },
          { time: "05:00 PM", text: `${a3} — sunset point / evening stroll` },
          { time: "08:00 PM", text: `Dinner in ${city} — settle the day's shared expenses` },
        ],
      });
    }
  }

  const b = plan.estimated_budget;
  const budget_breakdown = [
    { label: "Accommodation", amount: Math.round(b * 0.34) },
    { label: "Transportation", amount: Math.round(b * 0.25) },
    { label: "Food", amount: Math.round(b * 0.2) },
    { label: "Activities", amount: Math.round(b * 0.14) },
    { label: "Miscellaneous", amount: Math.round(b * 0.07) },
  ];

  const topInterests = analysis.interests.slice(0, 3).map((i) => i.label.toLowerCase());
  const summary =
    `${total} days in ${city} built around what the group actually voted for` +
    (topInterests.length ? ` — ${topInterests.join(", ")}` : "") +
    `. Costs are kept close to ₹${b.toLocaleString("en-IN")} per person, with the itinerary paced so nobody is rushed.`;

  const packing_list = [
    "Government ID + copies",
    "Comfortable walking shoes",
    "Power bank and charging cable",
    "Light layers for evenings",
    "Sunscreen and sunglasses",
    "Basic medical kit",
    "Reusable water bottle",
    ...(analysis.interests.some((i) => i.id === "beach" || i.id === "water")
      ? ["Swimwear and quick-dry towel"]
      : []),
    ...(analysis.interests.some((i) => i.id === "trekking" || i.id === "camping")
      ? ["Trek pants and a small backpack"]
      : []),
  ];

  const tips = [
    "Book stays and transport at least three weeks ahead for the best group rate.",
    "Split shared costs in one app so nobody chases payments later.",
    "Keep one buffer slot each day — group plans always run late.",
    ...(analysis.notes.length ? [`Group notes to respect: ${analysis.notes.slice(0, 3).join("; ")}`] : []),
  ];

  const food = [
    `Signature local thali in ${city}`,
    "One street-food crawl evening",
    "A vegetarian-friendly cafe for the group breakfast",
    "One sit-down celebration dinner",
  ];

  return {
    summary,
    days,
    budget_breakdown,
    packing_list,
    tips,
    food,
    accommodation: analysis.accommodations[0]?.label ?? "Hotel",
    transportation: analysis.transportation[0]?.label ?? "Train",
  };
}

export const ALL_INTEREST_IDS = INTERESTS.map((i) => i.id);
