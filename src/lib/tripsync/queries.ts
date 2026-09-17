import { supabase } from "@/integrations/supabase/client";
import {
  analyzeTripResponses,
  generateItinerary,
  generateRecommendations,
  type ParticipantResponse,
  type ScoredPlan,
  type TripInput,
} from "./engine";

export type Trip = {
  id: string;
  organizer_id: string;
  trip_name: string;
  destination: string;
  duration: number;
  start_date: string | null;
  end_date: string | null;
  participant_count: number;
  budget_min: number;
  budget_max: number;
  status: string;
  invite_token: string;
  organizer_message: string | null;
  created_at: string;
};

export type TripPlan = {
  id: string;
  trip_id: string;
  plan_name: string;
  destination: string;
  dates: string | null;
  estimated_budget: number;
  duration: number;
  activities: string[];
  compatibility_score: number;
  score_availability: number;
  score_budget: number;
  score_interests: number;
  reasoning: string[];
  is_selected: boolean;
};

export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Trip[];
}

export async function getTrip(id: string): Promise<Trip> {
  const { data, error } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Trip not found");
  return data as Trip;
}

/** Removes a trip and every record attached to it. */
export async function deleteTrip(id: string) {
  const { error: itinError } = await supabase.from("itineraries").delete().eq("trip_id", id);
  if (itinError) throw itinError;
  const { error: voteError } = await supabase.from("votes").delete().eq("trip_id", id);
  if (voteError) throw voteError;
  const { error: planError } = await supabase.from("trip_plans").delete().eq("trip_id", id);
  if (planError) throw planError;
  const { error: respError } = await supabase
    .from("participant_responses")
    .delete()
    .eq("trip_id", id);
  if (respError) throw respError;
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

export async function getResponses(tripId: string): Promise<ParticipantResponse[]> {
  const { data, error } = await supabase
    .from("participant_responses")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ParticipantResponse[];
}

export async function getPlans(tripId: string): Promise<TripPlan[]> {
  const { data, error } = await supabase
    .from("trip_plans")
    .select("*")
    .eq("trip_id", tripId)
    .order("compatibility_score", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TripPlan[];
}

export async function getVoteTally(tripId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("votes").select("plan_id").eq("trip_id", tripId);
  if (error) throw error;
  const tally: Record<string, number> = {};
  for (const row of data ?? []) tally[row.plan_id] = (tally[row.plan_id] ?? 0) + 1;
  return tally;
}

export async function savePlans(tripId: string, plans: ScoredPlan[]) {
  const { error: delError } = await supabase.from("trip_plans").delete().eq("trip_id", tripId);
  if (delError) throw delError;
  const { error } = await supabase.from("trip_plans").insert(
    plans.map((p) => ({
      trip_id: tripId,
      plan_name: p.plan_name,
      destination: p.destination,
      dates: p.dates,
      estimated_budget: p.estimated_budget,
      duration: p.duration,
      activities: p.activities,
      compatibility_score: p.compatibility_score,
      score_availability: p.score_availability,
      score_budget: p.score_budget,
      score_interests: p.score_interests,
      reasoning: p.reasoning,
    })),
  );
  if (error) throw error;
  const { error: statusError } = await supabase
    .from("trips")
    .update({ status: "plans_ready" })
    .eq("id", tripId);
  if (statusError) throw statusError;
}

function normalizedDestination(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/** Repairs legacy plans that were generated for cities other than the selected destination. */
export async function ensureDestinationLockedPlans(
  trip: Trip,
  responses: ParticipantResponse[],
  plans: TripPlan[],
): Promise<TripPlan[]> {
  const expected = normalizedDestination(trip.destination);
  const isCurrent =
    plans.length === 3 && plans.every((plan) => normalizedDestination(plan.destination) === expected);
  if (isCurrent || plans.length === 0) return plans;

  const analysis = analyzeTripResponses(responses, toTripInput(trip));
  const replacements = generateRecommendations(toTripInput(trip), analysis);

  if (plans.length !== 3) {
    const { error: itineraryError } = await supabase.from("itineraries").delete().eq("trip_id", trip.id);
    if (itineraryError) throw itineraryError;
    const { error: votesError } = await supabase.from("votes").delete().eq("trip_id", trip.id);
    if (votesError) throw votesError;
    await savePlans(trip.id, replacements);
    return getPlans(trip.id);
  }

  const selectedIndex = Math.max(0, plans.findIndex((plan) => plan.is_selected));
  for (let index = 0; index < plans.length; index += 1) {
    const current = plans[index];
    const replacement = replacements[index];
    if (!current || !replacement) continue;
    const { error } = await supabase
      .from("trip_plans")
      .update({
        plan_name: replacement.plan_name,
        destination: replacement.destination,
        dates: replacement.dates,
        estimated_budget: replacement.estimated_budget,
        duration: replacement.duration,
        activities: replacement.activities,
        compatibility_score: replacement.compatibility_score,
        score_availability: replacement.score_availability,
        score_budget: replacement.score_budget,
        score_interests: replacement.score_interests,
        reasoning: replacement.reasoning,
      })
      .eq("id", current.id);
    if (error) throw error;
  }

  const selectedPlan = plans[selectedIndex];
  const selectedReplacement = replacements[selectedIndex];
  if (selectedPlan?.is_selected && selectedReplacement) {
    const itinerary = generateItinerary(selectedReplacement, analysis);
    const { error } = await supabase.from("itineraries").upsert(
      {
        trip_id: trip.id,
        plan_id: selectedPlan.id,
        content: JSON.parse(JSON.stringify(itinerary)),
        budget_breakdown: { items: itinerary.budget_breakdown, total: selectedReplacement.estimated_budget },
        packing_list: itinerary.packing_list,
      },
      { onConflict: "trip_id" },
    );
    if (error) throw error;
  }

  return getPlans(trip.id);
}

export async function getItinerary(tripId: string) {
  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("trip_id", tripId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function toTripInput(trip: Trip): TripInput {
  return {
    trip_name: trip.trip_name,
    destination: trip.destination,
    duration: trip.duration,
    participant_count: trip.participant_count,
    budget_min: trip.budget_min,
    budget_max: trip.budget_max,
    start_date: trip.start_date,
    end_date: trip.end_date,
  };
}
