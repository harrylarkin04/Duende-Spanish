-- Allow up to 3 players per Palabra Vortex multiplayer room (join cap was 2).

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

  if n >= 3 and not exists (
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
