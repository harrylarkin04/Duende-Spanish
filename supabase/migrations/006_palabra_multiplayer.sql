-- Palabra Vortex multiplayer: rooms, members, RPCs, Realtime publication
-- Broadcast uses topic `palabra-mp-{ROOM}` (room code is the shared secret).
-- Row policies restrict who can read/write room rows; add private Realtime policies in the dashboard if needed.

create or replace function public.generate_palabra_mp_room_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create table if not exists public.palabra_multiplayer_rooms (
  room_code text primary key check (room_code ~ '^[A-Z2-9]{6}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  game_seed text,
  round_index integer not null default 0,
  total_rounds integer not null default 9 check (total_rounds between 6 and 12),
  target_score integer not null default 1000 check (target_score > 0),
  round_ends_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.palabra_multiplayer_members (
  room_code text not null references public.palabra_multiplayer_rooms (room_code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  username_snapshot text,
  country_code text,
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_code, user_id)
);

create index if not exists palabra_mp_rooms_expires on public.palabra_multiplayer_rooms (expires_at);
create index if not exists palabra_mp_rooms_host on public.palabra_multiplayer_rooms (host_id);

-- Host automatically added as first member
create or replace function public.trg_palabra_mp_room_add_host()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.palabra_multiplayer_members (room_code, user_id, ready)
  values (new.room_code, new.host_id, false);
  return new;
end;
$$;

drop trigger if exists palabra_mp_room_after_insert on public.palabra_multiplayer_rooms;
create trigger palabra_mp_room_after_insert
  after insert on public.palabra_multiplayer_rooms
  for each row execute procedure public.trg_palabra_mp_room_add_host();

alter table public.palabra_multiplayer_rooms enable row level security;
alter table public.palabra_multiplayer_members enable row level security;

-- Rooms: visible to host or anyone already in the room
create policy "palabra_mp_room_select" on public.palabra_multiplayer_rooms
  for select to authenticated using (
    host_id = auth.uid()
    or exists (
      select 1 from public.palabra_multiplayer_members m
      where m.room_code = palabra_multiplayer_rooms.room_code
        and m.user_id = auth.uid()
    )
  );

create policy "palabra_mp_room_insert_host" on public.palabra_multiplayer_rooms
  for insert to authenticated with check (auth.uid() = host_id);

create policy "palabra_mp_room_update_host" on public.palabra_multiplayer_rooms
  for update to authenticated using (host_id = auth.uid());

-- Members in the same room can see each other
create policy "palabra_mp_member_select" on public.palabra_multiplayer_members
  for select to authenticated using (
    exists (
      select 1 from public.palabra_multiplayer_members o
      where o.room_code = palabra_multiplayer_members.room_code
        and o.user_id = auth.uid()
    )
  );

-- Managed by join RPC + trigger; block direct inserts from clients
-- (Keeps max-players and expiry rules centralized.)

create policy "palabra_mp_member_update_self" on public.palabra_multiplayer_members
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.create_palabra_mp_room(p_difficulty text default 'medium')
returns table (out_room_code text, out_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_exp timestamptz;
  attempts int := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_difficulty not in ('easy', 'medium', 'hard', 'expert') then
    raise exception 'invalid difficulty';
  end if;

  loop
    v_code := public.generate_palabra_mp_room_code();
    begin
      v_exp := now() + interval '45 minutes';
      insert into public.palabra_multiplayer_rooms (room_code, host_id, difficulty, expires_at)
      values (v_code, auth.uid(), p_difficulty, v_exp);
      out_room_code := v_code;
      out_expires_at := v_exp;
      return next;
      return;
    exception
      when unique_violation then
        attempts := attempts + 1;
        if attempts > 48 then
          raise exception 'could not allocate room code';
        end if;
    end;
  end loop;
end;
$$;

create or replace function public.join_palabra_mp_room(
  p_room_code text,
  p_country_code text default null,
  p_username_snapshot text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_room_code));
  n int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if v_code !~ '^[A-Z2-9]{6}$' then
    raise exception 'invalid room code';
  end if;

  if not exists (
    select 1 from public.palabra_multiplayer_rooms r
    where r.room_code = v_code and r.expires_at > now()
  ) then
    raise exception 'room not found or expired';
  end if;

  select count(*)::int into n from public.palabra_multiplayer_members where room_code = v_code;

  if n >= 2 and not exists (
    select 1 from public.palabra_multiplayer_members m
    where m.room_code = v_code and m.user_id = auth.uid()
  ) then
    raise exception 'room full';
  end if;

  insert into public.palabra_multiplayer_members (room_code, user_id, country_code, username_snapshot, ready)
  values (
    v_code,
    auth.uid(),
    nullif(trim(p_country_code), ''),
    nullif(trim(p_username_snapshot), ''),
    false
  )
  on conflict (room_code, user_id) do update set
    country_code = coalesce(excluded.country_code, palabra_multiplayer_members.country_code),
    username_snapshot = coalesce(excluded.username_snapshot, palabra_multiplayer_members.username_snapshot);
end;
$$;

revoke all on function public.generate_palabra_mp_room_code() from public;

create or replace function public.rematch_palabra_mp_room(p_room_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_room_code));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.palabra_multiplayer_rooms r
    where r.room_code = v_code and r.host_id = auth.uid()
  ) then
    raise exception 'only host can rematch';
  end if;
  update public.palabra_multiplayer_rooms
  set
    status = 'lobby',
    game_seed = null,
    round_index = 0,
    round_ends_at = null,
    updated_at = now()
  where room_code = v_code;
  update public.palabra_multiplayer_members
  set ready = false
  where room_code = v_code;
end;
$$;

grant execute on function public.create_palabra_mp_room(text) to authenticated;
grant execute on function public.join_palabra_mp_room(text, text, text) to authenticated;
grant execute on function public.rematch_palabra_mp_room(text) to authenticated;

-- Realtime: lobby sync (ready flags, room status)
alter table public.palabra_multiplayer_members replica identity full;
alter table public.palabra_multiplayer_rooms replica identity full;

alter publication supabase_realtime add table public.palabra_multiplayer_members;
alter publication supabase_realtime add table public.palabra_multiplayer_rooms;
