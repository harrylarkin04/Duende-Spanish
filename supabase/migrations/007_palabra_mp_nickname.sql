-- Fun display name for the current match (lobby + game). Cleared on rematch via app or manually.
alter table public.palabra_multiplayer_members
  add column if not exists match_nickname text;

comment on column public.palabra_multiplayer_members.match_nickname is 'Optional playful nickname for this multiplayer session; defaults to username in UI when null.';
