import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  tripId: z.string().uuid(),
  recipients: z.array(z.string().email()).min(1).max(20),
  appUrl: z.string().url().max(300),
});

/** Emails the finalized itinerary to the organizer (and optional CC list). */
export const sendItineraryEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, claims } = context;

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", data.tripId)
      .maybeSingle();
    if (tripError) throw tripError;
    if (!trip) throw new Error("Trip not found");

    const { data: plan } = await supabase
      .from("trip_plans")
      .select("*")
      .eq("trip_id", data.tripId)
      .eq("is_selected", true)
      .maybeSingle();

    const { data: itineraryRow } = await supabase
      .from("itineraries")
      .select("content")
      .eq("trip_id", data.tripId)
      .maybeSingle();

    if (!plan || !itineraryRow?.content) {
      throw new Error("Finalize a plan first — there is no itinerary to send yet.");
    }

    const organizerEmail = (claims as { email?: string }).email;
    const to = [...new Set([...(organizerEmail ? [organizerEmail] : []), ...data.recipients])];

    const { sendItineraryEmailViaResend } = await import("./email.server");
    const result = await sendItineraryEmailViaResend({
      to: to.slice(0, 1),
      cc: to.slice(1),
      payload: {
        tripName: trip.trip_name,
        destination: plan.destination,
        dates: plan.dates ?? null,
        duration: plan.duration,
        participantCount: trip.participant_count,
        perPersonBudget: plan.estimated_budget,
        compatibilityScore: plan.compatibility_score,
        itinerary: itineraryRow.content as never,
        appUrl: `${data.appUrl.replace(/\/$/, "")}/trips/${data.tripId}/itinerary`,
      },
    });

    return { ok: true, id: result.id ?? null, recipients: to };
  });
