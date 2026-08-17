ALTER TABLE public.trip_plans ADD COLUMN IF NOT EXISTS selected_hotel jsonb;

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
  IF t.status = 'finalized' THEN RETURN jsonb_build_object('ok', false, 'error', 'closed'); END IF;
  INSERT INTO public.votes (trip_id, plan_id, anonymous_token) VALUES (t.id, p_plan_id, p_anon)
  ON CONFLICT (trip_id, anonymous_token) DO UPDATE SET plan_id = EXCLUDED.plan_id;
  RETURN jsonb_build_object('ok', true);
END; $$;
GRANT EXECUTE ON FUNCTION public.cast_plan_vote(text, text, uuid) TO anon, authenticated;

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
    'voted_plan_id', (SELECT v.plan_id FROM public.votes v WHERE v.trip_id = t.id AND v.anonymous_token = p_anon LIMIT 1),
    'response_count', (SELECT count(*) FROM public.participant_responses r WHERE r.trip_id = t.id),
    'plans', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', p.id, 'plan_name', p.plan_name, 'destination', p.destination,
        'dates', p.dates, 'estimated_budget', p.estimated_budget, 'duration', p.duration,
        'activities', p.activities, 'compatibility_score', p.compatibility_score,
        'is_selected', p.is_selected, 'selected_hotel', p.selected_hotel,
        'vote_count', (SELECT count(*) FROM public.votes v WHERE v.plan_id = p.id),
        'reasoning', p.reasoning) ORDER BY p.compatibility_score DESC)
      FROM public.trip_plans p WHERE p.trip_id = t.id), '[]'::jsonb)
  );
  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_trip_by_token(text, text) TO anon, authenticated;