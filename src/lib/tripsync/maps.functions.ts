import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({ queries: z.array(z.string().min(1).max(200)).max(12) });

/** Geocodes itinerary stops. Authenticated + bounded — Maps usage is metered. */
export const geocodeItineraryStops = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { geocodePlaces } = await import("./maps.server");
    return { places: await geocodePlaces(data.queries) };
  });
