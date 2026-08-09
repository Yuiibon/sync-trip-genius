-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- TRIPS
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_name text NOT NULL,
  destination text NOT NULL,
  duration int NOT NULL DEFAULT 3,
  start_date date,
  end_date date,
  participant_count int NOT NULL DEFAULT 5,
  budget_min int NOT NULL DEFAULT 5000,
  budget_max int NOT NULL DEFAULT 12000,
  status text NOT NULL DEFAULT 'collecting',
  invite_token text NOT NULL UNIQUE,
  organizer_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trips" ON public.trips FOR ALL TO authenticated USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());

-- PARTICIPANT RESPONSES
CREATE TABLE public.participant_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  anonymous_token text NOT NULL,
  available_dates text[] NOT NULL DEFAULT '{}',
  budget_range text,
  interests text[] NOT NULL DEFAULT '{}',
  travel_style text,
  accommodation text,
  transportation text,
  additional_preferences text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, anonymous_token)
);
GRANT SELECT, DELETE ON public.participant_responses TO authenticated;
GRANT ALL ON public.participant_responses TO service_role;
ALTER TABLE public.participant_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer reads responses" ON public.participant_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.organizer_id = auth.uid()));
CREATE POLICY "organizer deletes responses" ON public.participant_responses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.organizer_id = auth.uid()));

-- TRIP PLANS
CREATE TABLE public.trip_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  destination text NOT NULL,
  dates text,
  estimated_budget int NOT NULL DEFAULT 0,
  duration int NOT NULL DEFAULT 3,
  activities text[] NOT NULL DEFAULT '{}',
  compatibility_score int NOT NULL DEFAULT 0,
  score_availability int NOT NULL DEFAULT 0,
  score_budget int NOT NULL DEFAULT 0,
  score_interests int NOT NULL DEFAULT 0,
  reasoning text[] NOT NULL DEFAULT '{}',
  is_selected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_plans TO authenticated;
GRANT ALL ON public.trip_plans TO service_role;
ALTER TABLE public.trip_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer manages plans" ON public.trip_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.organizer_id = auth.uid()));

-- VOTES
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.trip_plans(id) ON DELETE CASCADE,
  anonymous_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, anonymous_token)
);
GRANT SELECT, DELETE ON public.votes TO authenticated;
GRANT ALL ON public.votes TO service_role;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer reads votes" ON public.votes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.organizer_id = auth.uid()));
CREATE POLICY "organizer deletes votes" ON public.votes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.organizer_id = auth.uid()));

-- ITINERARIES
CREATE TABLE public.itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.trip_plans(id) ON DELETE SET NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  budget_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  packing_list text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itineraries TO authenticated;
GRANT ALL ON public.itineraries TO service_role;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer manages itinerary" ON public.itineraries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.organizer_id = auth.uid()));

-- ANONYMOUS PARTICIPANT ACCESS (token-scoped, security definer)
CREATE OR REPLACE FUNCTION public.get_trip_by_token(p_token text, p_anon text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE t public.trips%ROWTYPE; result jsonb;
BEGIN
  SELECT * INTO t FROM public.trips WHERE invite_token = upper(p_token);
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;
  result := jsonb_build_object(
    'found', true,
    'trip', jsonb_build_object(
      'id', t.id, 'trip_name', t.trip_name, 'destination', t.destination,
      'duration', t.duration, 'start_date', t.start_date, 'end_date', t.end_date,
      'participant_count', t.participant_count, 'budget_min', t.budget_min,
      'budget_max', t.budget_max, 'status', t.status, 'invite_token', t.invite_token,
      'organizer_message', t.organizer_message
    ),
    'already_responded', COALESCE((SELECT true FROM public.participant_responses r WHERE r.trip_id = t.id AND r.anonymous_token = p_anon LIMIT 1), false),
    'already_voted', COALESCE((SELECT true FROM public.votes v WHERE v.trip_id = t.id AND v.anonymous_token = p_anon LIMIT 1), false),
    'response_count', (SELECT count(*) FROM public.participant_responses r WHERE r.trip_id = t.id),
    'plans', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', p.id, 'plan_name', p.plan_name, 'destination', p.destination,
        'dates', p.dates, 'estimated_budget', p.estimated_budget, 'duration', p.duration,
        'activities', p.activities, 'compatibility_score', p.compatibility_score,
        'reasoning', p.reasoning) ORDER BY p.compatibility_score DESC)
      FROM public.trip_plans p WHERE p.trip_id = t.id), '[]'::jsonb)
  );
  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_trip_by_token(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_participant_response(
  p_token text, p_anon text, p_dates text[], p_budget text, p_interests text[],
  p_style text, p_accommodation text, p_transportation text, p_notes text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE t public.trips%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.trips WHERE invite_token = upper(p_token);
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid'); END IF;
  IF t.status = 'finalized' THEN RETURN jsonb_build_object('ok', false, 'error', 'closed'); END IF;
  IF EXISTS (SELECT 1 FROM public.participant_responses r WHERE r.trip_id = t.id AND r.anonymous_token = p_anon) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate');
  END IF;
  INSERT INTO public.participant_responses (trip_id, anonymous_token, available_dates, budget_range,
    interests, travel_style, accommodation, transportation, additional_preferences)
  VALUES (t.id, p_anon, COALESCE(p_dates,'{}'), p_budget, COALESCE(p_interests,'{}'), p_style,
    p_accommodation, p_transportation, nullif(btrim(coalesce(p_notes,'')), ''));
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.submit_participant_response(text, text, text[], text, text[], text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.cast_plan_vote(p_token text, p_anon text, p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE t public.trips%ROWTYPE;
BEGIN
  SELECT * INTO t FROM public.trips WHERE invite_token = upper(p_token);
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.trip_plans p WHERE p.id = p_plan_id AND p.trip_id = t.id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;
  IF EXISTS (SELECT 1 FROM public.votes v WHERE v.trip_id = t.id AND v.anonymous_token = p_anon) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'duplicate');
  END IF;
  INSERT INTO public.votes (trip_id, plan_id, anonymous_token) VALUES (t.id, p_plan_id, p_anon);
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.cast_plan_vote(text, text, uuid) TO anon, authenticated;