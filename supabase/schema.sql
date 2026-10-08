-- ============================================================
--  Poker Planning — schéma Supabase
--  À exécuter dans le SQL Editor de ton projet Supabase.
-- ============================================================

-- Table des salles (une salle = une session d'estimation)
create table if not exists public.rooms (
  room        text primary key,
  story_title text not null default '',
  revealed    boolean not null default false,
  deck_key    text not null default 'fibonacci',
  updated_at  timestamptz not null default now()
);

-- Table des votes (un vote par membre et par salle)
create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  room        text not null references public.rooms(room) on delete cascade,
  member_id   text not null,
  member_name text not null,
  card        text,
  updated_at  timestamptz not null default now(),
  unique (room, member_id)
);

create index if not exists votes_room_idx on public.votes (room);

-- ------------------------------------------------------------
--  Row Level Security
--  Démo ouverte : tout le monde peut lire/écrire. Pour un usage
--  interne, restreins ces policies (ex. auth.role() = 'authenticated').
-- ------------------------------------------------------------
alter table public.rooms enable row level security;
alter table public.votes enable row level security;

drop policy if exists "rooms open" on public.rooms;
create policy "rooms open" on public.rooms
  for all using (true) with check (true);

drop policy if exists "votes open" on public.votes;
create policy "votes open" on public.votes
  for all using (true) with check (true);

-- ------------------------------------------------------------
--  Activer la diffusion temps réel sur les deux tables
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.votes;
