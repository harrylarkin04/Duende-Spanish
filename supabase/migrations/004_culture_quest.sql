-- Culture Quest: profile souvenirs + run snapshot on game_records
alter table public.profiles
  add column if not exists culture_badges text not null default '[]';

alter table public.game_records
  add column if not exists culture_quest_snapshot text;
