-- Festín olfativo online: rooms, picks (hidden until digest), RPCs, Realtime

create table if not exists public.poo_feast_rooms (
  room_code text primary key check (room_code ~ '^[A-Z2-9]{6}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lobby'
    check (status in ('lobby', 'picking', 'digest', 'reveal', 'finished')),
  game_seed text,
  digest_started_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.poo_feast_members (
  room_code text not null references public.poo_feast_rooms (room_code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  username_snapshot text,
  country_code text,
  ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_code, user_id)
);

-- Picks hidden from opponent until room leaves `picking` (see RLS).
create table if not exists public.poo_feast_picks (
  room_code text not null references public.poo_feast_rooms (room_code) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  picks text[] not null check (array_length(picks, 1) = 3),
  updated_at timestamptz not null default now(),
  primary key (room_code, user_id)
);

create index if not exists poo_feast_rooms_expires on public.poo_feast_rooms (expires_at);
create index if not exists poo_feast_rooms_host on public.poo_feast_rooms (host_id);

create or replace function public.trg_poo_feast_room_add_host()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.poo_feast_members (room_code, user_id, ready)
  values (new.room_code, new.host_id, false);
  return new;
end;
$$;

drop trigger if exists poo_feast_room_after_insert on public.poo_feast_rooms;
create trigger poo_feast_room_after_insert
  after insert on public.poo_feast_rooms
  for each row execute procedure public.trg_poo_feast_room_add_host();

alter table public.poo_feast_rooms enable row level security;
alter table public.poo_feast_members enable row level security;
alter table public.poo_feast_picks enable row level security;

create policy "poo_feast_room_select" on public.poo_feast_rooms
  for select to authenticated using (
    host_id = auth.uid()
    or exists (
      select 1 from public.poo_feast_members m
      where m.room_code = poo_feast_rooms.room_code and m.user_id = auth.uid()
    )
  );

create policy "poo_feast_room_insert_host" on public.poo_feast_rooms
  for insert to authenticated with check (auth.uid() = host_id);

create policy "poo_feast_room_update_host" on public.poo_feast_rooms
  for update to authenticated using (host_id = auth.uid());

create policy "poo_feast_member_select" on public.poo_feast_members
  for select to authenticated using (
    exists (
      select 1 from public.poo_feast_members o
      where o.room_code = poo_feast_members.room_code and o.user_id = auth.uid()
    )
  );

create policy "poo_feast_member_update_self" on public.poo_feast_members
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "poo_feast_picks_select" on public.poo_feast_picks
  for select to authenticated using (
    exists (
      select 1 from public.poo_feast_rooms r
      where r.room_code = poo_feast_picks.room_code
        and (
          poo_feast_picks.user_id = auth.uid()
          or r.status in ('digest', 'reveal', 'finished')
        )
    )
  );

-- Allowed food ids must match lib/games/poo-feast/foods.ts (3 distinct picks)
create or replace function public.poo_feast_picks_valid(p_picks text[])
returns boolean
language sql
immutable
as $$
  select
    array_length(p_picks, 1) = 3
    and p_picks <@ array[
      'judias','queso-cabra','chorizo-picante','kimchi','brocoli','huevo-duro',
      'cebolla','ajo','helado','tacos','pulpo','morcilla','chocolate-negro','guiso-lentejas'
    ]::text[]
    and p_picks[1] is distinct from p_picks[2]
    and p_picks[2] is distinct from p_picks[3]
    and p_picks[1] is distinct from p_picks[3];
$$;

create or replace function public.create_poo_feast_room()
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

  loop
    v_code := public.generate_palabra_mp_room_code();
    begin
      v_exp := now() + interval '45 minutes';
      insert into public.poo_feast_rooms (room_code, host_id, expires_at)
      values (v_code, auth.uid(), v_exp);
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

create or replace function public.join_poo_feast_room(
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
    select 1 from public.poo_feast_rooms r
    where r.room_code = v_code and r.expires_at > now()
  ) then
    raise exception 'room not found or expired';
  end if;

  select count(*)::int into n from public.poo_feast_members where room_code = v_code;

  if n >= 2 and not exists (
    select 1 from public.poo_feast_members m
    where m.room_code = v_code and m.user_id = auth.uid()
  ) then
    raise exception 'room full';
  end if;

  insert into public.poo_feast_members (room_code, user_id, country_code, username_snapshot, ready)
  values (
    v_code,
    auth.uid(),
    nullif(trim(p_country_code), ''),
    nullif(trim(p_username_snapshot), ''),
    false
  )
  on conflict (room_code, user_id) do update set
    country_code = coalesce(excluded.country_code, poo_feast_members.country_code),
    username_snapshot = coalesce(excluded.username_snapshot, poo_feast_members.username_snapshot);
end;
$$;

create or replace function public.begin_poo_feast_picking(p_room_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_room_code));
  n int;
  ready_n int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.poo_feast_rooms r
    where r.room_code = v_code and r.host_id = auth.uid() and r.expires_at > now()
  ) then
    raise exception 'only the host can start, or room missing';
  end if;

  select count(*)::int into n from public.poo_feast_members where room_code = v_code;
  if n <> 2 then
    raise exception 'need exactly two players';
  end if;

  select count(*)::int into ready_n
  from public.poo_feast_members
  where room_code = v_code and ready = true;

  if ready_n <> 2 then
    raise exception 'everyone must be ready';
  end if;

  delete from public.poo_feast_picks where room_code = v_code;

  update public.poo_feast_rooms
  set
    status = 'picking',
    game_seed = gen_random_uuid()::text,
    digest_started_at = null,
    updated_at = now()
  where room_code = v_code;
end;
$$;

create or replace function public.submit_poo_feast_picks(p_room_code text, p_picks text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_room_code));
  st text;
  with_picks int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not public.poo_feast_picks_valid(p_picks) then
    raise exception 'invalid menu picks';
  end if;

  select status into st from public.poo_feast_rooms where room_code = v_code;
  if st is null then
    raise exception 'room not found';
  end if;
  if st <> 'picking' then
    raise exception 'not in picking phase';
  end if;

  if not exists (
    select 1 from public.poo_feast_members m
    where m.room_code = v_code and m.user_id = auth.uid()
  ) then
    raise exception 'not in this room';
  end if;

  insert into public.poo_feast_picks (room_code, user_id, picks, updated_at)
  values (v_code, auth.uid(), p_picks, now())
  on conflict (room_code, user_id) do update set
    picks = excluded.picks,
    updated_at = excluded.updated_at;

  select count(*)::int into with_picks
  from public.poo_feast_picks
  where room_code = v_code;

  if with_picks >= 2 then
    update public.poo_feast_rooms
    set
      status = 'digest',
      digest_started_at = now(),
      updated_at = now()
    where room_code = v_code;
  end if;
end;
$$;

create or replace function public.rematch_poo_feast_room(p_room_code text)
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
    select 1 from public.poo_feast_rooms r
    where r.room_code = v_code and r.host_id = auth.uid()
  ) then
    raise exception 'only host can rematch';
  end if;

  delete from public.poo_feast_picks where room_code = v_code;

  update public.poo_feast_rooms
  set
    status = 'lobby',
    game_seed = null,
    digest_started_at = null,
    updated_at = now()
  where room_code = v_code;

  update public.poo_feast_members
  set ready = false
  where room_code = v_code;
end;
$$;

grant execute on function public.create_poo_feast_room() to authenticated;
grant execute on function public.join_poo_feast_room(text, text, text) to authenticated;
grant execute on function public.begin_poo_feast_picking(text) to authenticated;
grant execute on function public.submit_poo_feast_picks(text, text[]) to authenticated;
grant execute on function public.rematch_poo_feast_room(text) to authenticated;

alter table public.poo_feast_members replica identity full;
alter table public.poo_feast_rooms replica identity full;

alter publication supabase_realtime add table public.poo_feast_members;
alter publication supabase_realtime add table public.poo_feast_rooms;
