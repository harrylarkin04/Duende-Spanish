-- Social graph (one-way follow = "friends" filter for leaderboards)
create table if not exists public.user_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists user_follows_follower on public.user_follows (follower_id);
create index if not exists user_follows_following on public.user_follows (following_id);

alter table public.game_records
  add column if not exists won boolean;

comment on column public.game_records.won is 'True when the player won (e.g. Grammar Gladiator). Null/false for other games or losses.';

-- Leaderboard reads: any signed-in user can read other profiles and game rows (competitive features)
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "game_records_select_authenticated" on public.game_records
  for select to authenticated using (true);

alter table public.user_follows enable row level security;

create policy "user_follows_select_own" on public.user_follows
  for select to authenticated using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "user_follows_insert_own" on public.user_follows
  for insert to authenticated with check (auth.uid() = follower_id);

create policy "user_follows_delete_own" on public.user_follows
  for delete to authenticated using (auth.uid() = follower_id);

-- Replica identity helps Supabase Realtime deliver full row on UPDATE
alter table public.profiles replica identity full;
alter table public.game_records replica identity full;

-- Aggregates for leaderboards (security definer bypasses RLS; returns only ids + scores)
create or replace function public.leaderboard_palabra_bests(p_difficulty text, p_since timestamptz)
returns table (user_id uuid, best_score integer)
language sql
stable
security definer
set search_path = public
as $$
  select gr.user_id, max(gr.score)::integer
  from public.game_records gr
  where gr.game_name = 'palabra-vortex'
    and gr.difficulty is not null
    and gr.difficulty = p_difficulty
    and (p_since is null or gr.played_at >= p_since)
  group by gr.user_id;
$$;

create or replace function public.leaderboard_grammar_wins(p_since timestamptz)
returns table (user_id uuid, wins bigint)
language sql
stable
security definer
set search_path = public
as $$
  select gr.user_id, count(*)::bigint
  from public.game_records gr
  where gr.game_name = 'grammar-gladiator'
    and coalesce(gr.won, false) = true
    and (p_since is null or gr.played_at >= p_since)
  group by gr.user_id;
$$;

create or replace function public.leaderboard_weekly_activity(p_since timestamptz)
returns table (user_id uuid, games_played bigint)
language sql
stable
security definer
set search_path = public
as $$
  select gr.user_id, count(*)::bigint
  from public.game_records gr
  where gr.played_at >= p_since
  group by gr.user_id;
$$;

grant execute on function public.leaderboard_palabra_bests(text, timestamptz) to authenticated;
grant execute on function public.leaderboard_grammar_wins(timestamptz) to authenticated;
grant execute on function public.leaderboard_weekly_activity(timestamptz) to authenticated;

-- After applying: in Supabase Dashboard → Database → Replication, enable `profiles` and `game_records`
-- (and optionally `user_follows`) so client Realtime subscriptions receive postgres_changes.
