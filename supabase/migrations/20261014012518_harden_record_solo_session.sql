-- Closes scoring exploits in record_solo_session (add_matches_played.sql):
--   * the same question could be answered many times in one round;
--   * a round could carry any number of answers;
--   * inactive / non-official questions (never dealt by the game) scored;
--   * reusing another player's session id returned that player's score.
-- Scoring itself is unchanged.

create or replace function public.record_solo_session(
  p_session_id uuid,
  p_player_id uuid,
  p_category text,
  p_answers jsonb
)
returns table (session_id uuid, score integer, created boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  -- Mirrors ROUND_SIZE in src/lib/questions/round.ts. A round can be shorter
  -- when a category has fewer playable questions, never longer.
  c_round_size constant integer := 5;
  v_score      integer := 0;
  v_answer     jsonb;
  v_q          record;
  v_points     integer;
  v_existing   record;
begin
  -- Only ever record sessions for the caller themselves.
  if p_player_id is distinct from auth.uid() then
    raise exception 'solo session player_id does not match authenticated user';
  end if;

  -- Retried submission: return the recorded result. A session id that belongs
  -- to someone else is rejected without revealing anything about it.
  select s.player_id, s.score
    into v_existing
    from public.solo_sessions s
   where s.id = p_session_id;

  if found then
    if v_existing.player_id <> p_player_id then
      raise exception 'solo session id already in use';
    end if;
    return query select p_session_id, v_existing.score, false;
    return;
  end if;

  if p_category not in ('Web & Mobile Stack', 'Platforms', 'General Development') then
    raise exception 'invalid solo session category';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array'
     or jsonb_array_length(p_answers) = 0 then
    raise exception 'solo session answers must be a non-empty array';
  end if;

  if jsonb_array_length(p_answers) > c_round_size then
    raise exception 'solo session has more than % answers', c_round_size;
  end if;

  if (select count(distinct a->>'question_id') from jsonb_array_elements(p_answers) a)
     <> jsonb_array_length(p_answers) then
    raise exception 'solo session answers the same question more than once';
  end if;

  for v_answer in select * from jsonb_array_elements(p_answers)
  loop
    select q.id, q.category, q.difficulty, q.type, q.answer
      into v_q
      from public.questions q
     where q.id = v_answer->>'question_id'
       and q.active
       and q.status = 'official';

    if not found then
      raise exception 'solo session references unknown or unplayable question %', v_answer->>'question_id';
    end if;

    if v_q.category <> p_category then
      raise exception 'solo session question % does not belong to category %', v_q.id, p_category;
    end if;

    -- Mirrors the client-side comparison so on-screen feedback and scoring agree.
    if (v_answer->>'selected_option') is null then
      v_points := 0; -- no-answer (timeout)
    elsif (v_q.type = 'multiple_choice' and v_answer->>'selected_option' = v_q.answer)
       or (v_q.type = 'text'
           and lower(btrim(v_answer->>'selected_option')) = lower(btrim(v_q.answer))) then
      v_points := case v_q.difficulty
        when 'Vibecoder'          then 8
        when 'Junior'             then 10
        when 'Mid-level'          then 15
        when 'Senior'             then 20
        when 'Linus Torvalds'     then 30
        when 'Code Wizard Supreme' then 40
      end;
    else
      v_points := case v_q.difficulty
        when 'Linus Torvalds'     then -5
        when 'Code Wizard Supreme' then -10
        else 0
      end;
    end if;

    v_score := v_score + v_points;
  end loop;

  insert into public.solo_sessions (id, player_id, category, score)
  values (p_session_id, p_player_id, p_category, v_score)
  on conflict (id) do nothing;

  if not found then
    -- Lost a race with a concurrent submission of the same id; re-read it
    -- under the same ownership rule as above.
    select s.player_id, s.score
      into v_existing
      from public.solo_sessions s
     where s.id = p_session_id;
    if v_existing.player_id <> p_player_id then
      raise exception 'solo session id already in use';
    end if;
    return query select p_session_id, v_existing.score, false;
    return;
  end if;

  update public.profiles
     set xp_total = xp_total + greatest(0, v_score),
         matches_played = matches_played + 1
   where id = p_player_id;

  return query select p_session_id, v_score, true;
end;
$$;

-- create or replace keeps existing grants; restated so this file stands alone.
grant execute on function public.record_solo_session(uuid, uuid, text, jsonb) to authenticated;
revoke execute on function public.record_solo_session(uuid, uuid, text, jsonb) from public, anon;
