-- Courses, tees, holes — shared catalog (publicly readable).
-- Combos are derived in TypeScript from these single courses.

create table if not exists public.courses (
  id text primary key,
  name text not null,
  region text not null,
  par integer not null,
  rating numeric(4, 1) not null,
  slope integer not null,
  holes_count integer not null check (holes_count in (9, 18)) default 9,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_tees (
  course_id text not null references public.courses(id) on delete cascade,
  tee_id text not null,
  label text not null,
  color text not null,
  total integer not null,
  primary key (course_id, tee_id)
);

create table if not exists public.course_holes (
  course_id text not null references public.courses(id) on delete cascade,
  hole_number integer not null,
  par integer not null,
  stroke_index integer not null check (stroke_index between 1 and 18),
  white_m integer not null,
  yellow_m integer not null,
  red_m integer not null,
  layout text not null default 'straight' check (layout in ('straight', 'doglegLeft', 'doglegRight')),
  bunkers jsonb,
  water jsonb,
  primary key (course_id, hole_number),
  unique (course_id, stroke_index)
);

-- Public read; no writes from clients (admins use SQL editor).
alter table public.courses      enable row level security;
alter table public.course_tees  enable row level security;
alter table public.course_holes enable row level security;

drop policy if exists "courses read"      on public.courses;
drop policy if exists "course_tees read"  on public.course_tees;
drop policy if exists "course_holes read" on public.course_holes;

create policy "courses read"      on public.courses      for select using (true);
create policy "course_tees read"  on public.course_tees  for select using (true);
create policy "course_holes read" on public.course_holes for select using (true);

-- =========================================================
-- Seed: Porin Golfkerho 9-hole courses
-- =========================================================
insert into public.courses (id, name, region, par, rating, slope, holes_count, position) values
  ('puisto', 'Puisto', 'Porin Golfkerho', 35, 35.4, 122, 9, 0),
  ('joki',   'Joki',   'Porin Golfkerho', 36, 35.8, 126, 9, 1),
  ('suisto', 'Suisto', 'Porin Golfkerho', 35, 35.2, 124, 9, 2)
on conflict (id) do nothing;

insert into public.course_tees (course_id, tee_id, label, color, total) values
  ('puisto', 'white',  'White',  '#F2EFE8', 2915),
  ('puisto', 'yellow', 'Yellow', '#C8B86A', 2740),
  ('puisto', 'red',    'Red',    '#A8584B', 2477),
  ('joki',   'white',  'White',  '#F2EFE8', 3146),
  ('joki',   'yellow', 'Yellow', '#C8B86A', 2958),
  ('joki',   'red',    'Red',    '#A8584B', 2674),
  ('suisto', 'white',  'White',  '#F2EFE8', 2960),
  ('suisto', 'yellow', 'Yellow', '#C8B86A', 2782),
  ('suisto', 'red',    'Red',    '#A8584B', 2516)
on conflict (course_id, tee_id) do nothing;

-- Per-hole detail. Distances are computed from the white tee with
-- yellow ≈ 0.94×white, red ≈ 0.85×white (matching the TS seed).
-- Stroke indices were assigned so par 5s and longer par 4s carry the
-- lowest SI; par 3s carry the highest. Hazards mirror the static layout.

insert into public.course_holes
  (course_id, hole_number, par, stroke_index, white_m, yellow_m, red_m, layout, bunkers, water) values
-- PUISTO (par 35)
  ('puisto', 1, 4, 7, 322, 303, 274, 'straight',    null,                                  null),
  ('puisto', 2, 4, 5, 348, 327, 296, 'doglegLeft',  '[[34,28,4,3]]'::jsonb,                null),
  ('puisto', 3, 3, 9, 148, 139, 126, 'straight',    '[[36,44,3,3],[64,44,3,3]]'::jsonb,    null),
  ('puisto', 4, 5, 1, 472, 444, 401, 'doglegRight', '[[52,72,3,3]]'::jsonb,                '[[42,52,14,8]]'::jsonb),
  ('puisto', 5, 4, 3, 376, 353, 320, 'straight',    null,                                  null),
  ('puisto', 6, 4, 4, 358, 337, 304, 'doglegLeft',  null,                                  '[[60,70,12,8]]'::jsonb),
  ('puisto', 7, 3, 8, 162, 152, 138, 'straight',    '[[38,42,3,3]]'::jsonb,                null),
  ('puisto', 8, 4, 6, 340, 320, 289, 'doglegRight', null,                                  null),
  ('puisto', 9, 4, 2, 389, 366, 331, 'straight',    '[[44,36,3,3],[56,36,3,3]]'::jsonb,    null),
-- JOKI (par 36)
  ('joki',   1, 4, 2, 358, 337, 304, 'doglegLeft',  null,                                  '[[44,90,12,10]]'::jsonb),
  ('joki',   2, 5, 4, 491, 462, 417, 'straight',    '[[40,70,3,3],[60,40,3,3]]'::jsonb,    null),
  ('joki',   3, 3, 6, 156, 147, 133, 'straight',    '[[64,40,3,3]]'::jsonb,                '[[42,70,16,8]]'::jsonb),
  ('joki',   4, 4, 8, 342, 321, 291, 'doglegRight', null,                                  '[[58,80,12,8]]'::jsonb),
  ('joki',   5, 4, 7, 372, 350, 316, 'straight',    null,                                  '[[42,60,14,8]]'::jsonb),
  ('joki',   6, 3, 9, 168, 158, 143, 'straight',    null,                                  '[[40,68,16,8]]'::jsonb),
  ('joki',   7, 5, 1, 478, 449, 406, 'doglegLeft',  null,                                  '[[42,86,12,12]]'::jsonb),
  ('joki',   8, 4, 5, 380, 357, 323, 'straight',    '[[40,40,3,3]]'::jsonb,                null),
  ('joki',   9, 4, 3, 401, 377, 341, 'doglegRight', null,                                  '[[40,50,14,8]]'::jsonb),
-- SUISTO (par 35)
  ('suisto', 1, 4, 5, 332, 312, 282, 'straight',    '[[34,60,4,3]]'::jsonb,                null),
  ('suisto', 2, 3, 9, 164, 154, 139, 'straight',    '[[36,44,3,3],[64,44,3,3]]'::jsonb,    null),
  ('suisto', 3, 4, 3, 378, 355, 321, 'doglegRight', null,                                  null),
  ('suisto', 4, 5, 1, 461, 433, 392, 'straight',    '[[44,80,3,3],[56,50,3,3]]'::jsonb,    null),
  ('suisto', 5, 4, 7, 352, 331, 299, 'doglegLeft',  '[[58,64,3,3]]'::jsonb,                null),
  ('suisto', 6, 4, 6, 366, 344, 311, 'straight',    null,                                  null),
  ('suisto', 7, 3, 8, 152, 143, 129, 'straight',    '[[38,42,3,3],[62,42,3,3]]'::jsonb,    null),
  ('suisto', 8, 4, 4, 371, 349, 315, 'doglegRight', '[[46,72,3,3]]'::jsonb,                null),
  ('suisto', 9, 4, 2, 388, 365, 330, 'straight',    '[[36,32,3,3],[64,32,3,3]]'::jsonb,    null)
on conflict (course_id, hole_number) do nothing;
