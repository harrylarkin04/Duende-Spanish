-- Fix create room when DB applied an older 009 that called generate_palabra_mp_room_code()
-- (Palabra migration 006 may never have been run). Safe to run if already fixed.

create or replace function public.generate_poo_feast_room_code()
returns text
language plpgsql
set search_path = public
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

revoke all on function public.generate_poo_feast_room_code() from public;

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
    v_code := public.generate_poo_feast_room_code();
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

grant execute on function public.create_poo_feast_room() to authenticated;
