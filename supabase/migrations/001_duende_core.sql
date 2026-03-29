-- Duende core schema — run in Supabase SQL Editor or via CLI.
-- Enable UUID extension if needed: create extension if not exists "uuid-ossp";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  total_fluency_score integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.game_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_name text not null,
  score integer not null,
  difficulty text,
  correct_count integer,
  total_questions integer,
  played_at timestamptz not null default now()
);

create index if not exists game_records_user_played on public.game_records (user_id, played_at desc);

create table if not exists public.saved_vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  spanish_word text not null,
  english_translation text not null,
  last_reviewed timestamptz,
  mastery_level integer not null default 0 check (mastery_level between 0 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, spanish_word)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_dialect text,
  difficulty_preference text,
  updated_at timestamptz not null default now()
);

-- New user → profile + preferences
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
-- Use `execute function` on Postgres 14+, or `execute procedure` on older versions.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.game_records enable row level security;
alter table public.saved_vocab enable row level security;
alter table public.user_preferences enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

create policy "game_records_select_own" on public.game_records for select using (auth.uid() = user_id);
create policy "game_records_insert_own" on public.game_records for insert with check (auth.uid() = user_id);

create policy "saved_vocab_all_own" on public.saved_vocab for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "prefs_select_own" on public.user_preferences for select using (auth.uid() = user_id);
create policy "prefs_update_own" on public.user_preferences for update using (auth.uid() = user_id);
create policy "prefs_insert_own" on public.user_preferences for insert with check (auth.uid() = user_id);
