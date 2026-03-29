-- Topics practiced in Grammar Gladiator (JSON array of topic ids, e.g. ["conjugation","ser-estar"])
alter table public.game_records add column if not exists grammar_topics text;

comment on column public.game_records.grammar_topics is 'JSON string array of grammar topic ids practiced in the run';
