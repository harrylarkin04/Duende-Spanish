-- Topics the player struggled with in Listening Duel (JSON array of topic ids)
alter table public.game_records add column if not exists listening_topics text;

comment on column public.game_records.listening_topics is 'JSON array of listening topic ids where the player missed at least one prompt';
