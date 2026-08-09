import { supabase } from "@/integrations/supabase/client";
import type { ParticipantResponse, ScoredPlan, TripInput } from "./engine";

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
