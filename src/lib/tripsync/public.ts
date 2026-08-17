import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getAnonToken } from "@/lib/tripsync/invite";

export type PublicPlan = {
  id: string;
  plan_name: string;
  destination: string;
  dates: string | null;
  estimated_budget: number;
  duration: number;
  activities: string[];
  compatibility_score: number;
  reasoning: string[];
  vote_count?: number;
  is_selected?: boolean;
  selected_hotel?: import("./hotels").HotelOption | null;
};

export type PublicTrip = {
  found: boolean;
  trip?: {
    id: string;
    trip_name: string;
    destination: string;
    duration: number;
    participant_count: number;
    status: string;
    invite_token: string;
    organizer_message: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  already_responded?: boolean;
  already_voted?: boolean;
  voted_plan_id?: string | null;
  response_count?: number;
  plans?: PublicPlan[];
};

export function useAnonToken() {
  const [token, setToken] = useState("");
  useEffect(() => setToken(getAnonToken()), []);
  return token;
}

export function usePublicTrip(inviteToken: string, anon: string) {
  return useQuery({
    queryKey: ["public-trip", inviteToken, anon],
    enabled: !!anon,
    queryFn: async (): Promise<PublicTrip> => {
      const { data, error } = await supabase.rpc("get_trip_by_token", {
        p_token: inviteToken,
        p_anon: anon,
      });
      if (error) throw error;
      return data as unknown as PublicTrip;
    },
  });
}
