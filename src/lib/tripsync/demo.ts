import { supabase } from "@/integrations/supabase/client";
import { BUDGET_RANGES, INTERESTS } from "./constants";
import { makeInviteToken } from "./invite";

const STYLES = ["Budget", "Moderate", "Comfortable", "Luxury"];
const STAYS = ["Hostel", "Budget Hotel", "Hotel", "Resort", "No Preference"];
const TRANSPORT = ["Bus", "Train", "Flight", "Car", "No Preference"];
const NOTES = [
  "Prefer less walking",
  "Vegetarian food preferred",
  "Want adventure activities",
  "Would love a sunrise spot",
  "Please keep one relaxed day",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickMany<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]!);
  }
  return out;
}

function upcomingDates(count: number) {
  const base = new Date();
  base.setDate(base.getDate() + 21);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

/** Creates a realistic populated demo trip with anonymous responses. */
export async function seedDemoTrip() {
  const token = makeInviteToken("Goa");
  const window = upcomingDates(8);

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      trip_name: "Weekend Goa Escape",
      destination: "Goa, India",
      duration: 4,
      participant_count: 10,
      budget_min: 8000,
      budget_max: 12000,
      start_date: window[0]!,
      end_date: window[window.length - 1]!,
      status: "collecting",
      invite_token: token,
      organizer_message: "Help us find the trip plan that works best for everyone.",
    })
    .select()
    .single();
  if (error) throw error;

  const weights: Record<string, number> = {
    beach: 0.85,
    food: 0.9,
    adventure: 0.7,
    water: 0.65,
    nightlife: 0.5,
    photography: 0.55,
    shopping: 0.4,
    trekking: 0.35,
    nature: 0.45,
    history: 0.3,
    camping: 0.2,
    themeparks: 0.15,
  };

  for (let i = 0; i < 8; i++) {
    const interests = INTERESTS.filter((x) => Math.random() < (weights[x.id] ?? 0.3)).map(
      (x) => x.id,
    );
    const budget =
      Math.random() < 0.6 ? "8to12" : Math.random() < 0.5 ? "5to8" : pick(BUDGET_RANGES).id;
    const dates = window.filter((_, idx) => Math.random() < (idx < 4 ? 0.85 : 0.45));
    await supabase.rpc("submit_participant_response", {
      p_token: token,
      p_anon: `demo_${trip.id}_${i}`,
      p_dates: dates.length ? dates : window.slice(0, 4),
      p_budget: budget,
      p_interests: interests.length ? interests : ["beach", "food"],
      p_style: pick(STYLES),
      p_accommodation: pick(STAYS),
      p_transportation: pick(TRANSPORT),
      p_notes: Math.random() < 0.4 ? pick(NOTES) : null,
    });
  }

  return trip;
}

export async function resetDemoData() {
  const { data, error } = await supabase
    .from("trips")
    .select("id")
    .eq("trip_name", "Weekend Goa Escape");
  if (error) throw error;
  const ids = (data ?? []).map((t) => t.id);
  if (!ids.length) return 0;
  const { error: delError } = await supabase.from("trips").delete().in("id", ids);
  if (delError) throw delError;
  return ids.length;
}

export const _unusedPickMany = pickMany;
