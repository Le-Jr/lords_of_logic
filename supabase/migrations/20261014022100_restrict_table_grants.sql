-- Hosted Supabase projects grant ALL on new public tables to anon and
-- authenticated by default. The earlier migrations only added the intended
-- (column-level) grants on top, so in the cloud a signed-in player could
-- UPDATE their own xp_total / matches_played through the Data API (the
-- profiles_update_own policy allows the row). Reset every table to exactly
-- the grants those migrations meant.

revoke all on public.profiles, public.questions, public.solo_sessions
  from anon, authenticated;

-- profiles: public read (ranking); the owner writes only their nickname.
-- xp_total / matches_played / current_title change only through
-- record_solo_session (security definer).
grant select on public.profiles to anon, authenticated;
grant insert (id, nickname) on public.profiles to authenticated;
grant update (nickname) on public.profiles to authenticated;

-- questions: public read; written only by the service role (import script).
grant select on public.questions to anon, authenticated;

-- solo_sessions: players read their own rows (RLS); rows are written only by
-- record_solo_session.
grant select on public.solo_sessions to authenticated;
