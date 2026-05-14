-- Golf scorecard schema
-- Run via: supabase db push  (or paste into the SQL editor of your project)

-- =========================================================
-- Profile
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  handicap numeric(4, 1),
  default_ball text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- User-configurable clubs
-- =========================================================
create table if not exists public.user_clubs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  club_id text not null,
  label text not null,
  short text not null,
  carry integer not null default 0,
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, club_id)
);
create index if not exists user_clubs_user_pos_idx
  on public.user_clubs (user_id, position);

-- =========================================================
-- User-configurable balls (including "Not specified")
-- =========================================================
create table if not exists public.user_balls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ball_id text not null,
  label text not null,
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ball_id)
);
create index if not exists user_balls_user_pos_idx
  on public.user_balls (user_id, position);

-- =========================================================
-- Rounds
-- =========================================================
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  tee_id text not null,
  ball text,
  current_hole integer not null default 1,
  status text not null default 'active'
    check (status in ('active', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists rounds_user_started_idx
  on public.rounds (user_id, started_at desc);
create index if not exists rounds_user_active_idx
  on public.rounds (user_id) where status = 'active';

-- =========================================================
-- Per-hole results within a round
-- =========================================================
create table if not exists public.round_holes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  hole_number integer not null,
  par integer not null,
  score integer,
  putts integer,
  fairway boolean,
  gir boolean,
  updated_at timestamptz not null default now(),
  unique (round_id, hole_number)
);

-- =========================================================
-- Shots within a round/hole
-- =========================================================
create table if not exists public.shots (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  hole_number integer not null,
  n integer not null,
  club_id text not null,
  ball_id text,
  start_lie text not null
    check (start_lie in ('tee', 'fairway', 'rough', 'bunker', 'green')),
  status text not null
    check (status in ('in_flight', 'done')),
  result text
    check (result is null or result in ('in_play', 'out', 'hazard', 'lost')),
  dist integer,
  measured boolean not null default false,
  lat double precision,
  lng double precision,
  accuracy double precision,
  created_at timestamptz not null default now(),
  unique (round_id, hole_number, n)
);
create index if not exists shots_round_hole_idx
  on public.shots (round_id, hole_number, n);

-- =========================================================
-- updated_at triggers
-- =========================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists user_clubs_touch on public.user_clubs;
create trigger user_clubs_touch before update on public.user_clubs
  for each row execute function public.touch_updated_at();

drop trigger if exists user_balls_touch on public.user_balls;
create trigger user_balls_touch before update on public.user_balls
  for each row execute function public.touch_updated_at();

drop trigger if exists rounds_touch on public.rounds;
create trigger rounds_touch before update on public.rounds
  for each row execute function public.touch_updated_at();

drop trigger if exists round_holes_touch on public.round_holes;
create trigger round_holes_touch before update on public.round_holes
  for each row execute function public.touch_updated_at();

-- =========================================================
-- Auto-create profile + seed default clubs/balls on signup
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  insert into public.user_clubs (user_id, club_id, label, short, carry, position) values
    (new.id, 'dr', 'Driver',   'Dr', 224,  0),
    (new.id, '3w', '3-wood',   '3W', 206,  1),
    (new.id, '5w', '5-wood',   '5W', 192,  2),
    (new.id, '4h', '4-hybrid', '4H', 178,  3),
    (new.id, '5i', '5-iron',   '5i', 165,  4),
    (new.id, '6i', '6-iron',   '6i', 154,  5),
    (new.id, '7i', '7-iron',   '7i', 142,  6),
    (new.id, '8i', '8-iron',   '8i', 130,  7),
    (new.id, '9i', '9-iron',   '9i', 117,  8),
    (new.id, 'pw', 'Pitching', 'PW', 105,  9),
    (new.id, 'gw', 'Gap',      'GW',  91, 10),
    (new.id, 'sw', 'Sand',     'SW',  80, 11),
    (new.id, 'lw', 'Lob',      'LW',  64, 12),
    (new.id, 'pt', 'Putter',   'Pt',   0, 13);

  insert into public.user_balls (user_id, ball_id, label, position) values
    (new.id, 'none',   'Not specified', 0),
    (new.id, 'prov1',  'Pro V1',        1),
    (new.id, 'prov1x', 'Pro V1x',       2),
    (new.id, 'chrome', 'Chrome Soft',   3),
    (new.id, 'tp5',    'TP5',           4);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles      enable row level security;
alter table public.user_clubs    enable row level security;
alter table public.user_balls    enable row level security;
alter table public.rounds        enable row level security;
alter table public.round_holes   enable row level security;
alter table public.shots         enable row level security;

drop policy if exists "profiles owner" on public.profiles;
create policy "profiles owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "user_clubs owner" on public.user_clubs;
create policy "user_clubs owner" on public.user_clubs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_balls owner" on public.user_balls;
create policy "user_balls owner" on public.user_balls
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "rounds owner" on public.rounds;
create policy "rounds owner" on public.rounds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "round_holes via round owner" on public.round_holes;
create policy "round_holes via round owner" on public.round_holes
  for all using (
    exists (
      select 1 from public.rounds r
      where r.id = round_holes.round_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.rounds r
      where r.id = round_holes.round_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "shots via round owner" on public.shots;
create policy "shots via round owner" on public.shots
  for all using (
    exists (
      select 1 from public.rounds r
      where r.id = shots.round_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.rounds r
      where r.id = shots.round_id and r.user_id = auth.uid()
    )
  );
