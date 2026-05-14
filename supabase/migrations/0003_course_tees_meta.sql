-- Per-tee course rating, slope, and par.
-- These vary by tee in real golf; the schema previously stored them only at
-- course level. Course-level values stay as denormalized defaults (used by
-- the combo builder and read by older clients).

alter table public.course_tees
  add column if not exists rating numeric(4, 1),
  add column if not exists slope  integer,
  add column if not exists par    integer;

update public.course_tees t
   set rating = coalesce(t.rating, c.rating),
       slope  = coalesce(t.slope,  c.slope),
       par    = coalesce(t.par,    c.par)
  from public.courses c
 where t.course_id = c.id;

alter table public.course_tees
  alter column rating set not null,
  alter column slope  set not null,
  alter column par    set not null;

-- Allow signed-in users to edit the shared course catalog.
-- Restrict further (e.g. to a "course_admins" role) once that table exists.
drop policy if exists "courses authenticated write"      on public.courses;
drop policy if exists "course_tees authenticated write"  on public.course_tees;
drop policy if exists "course_holes authenticated write" on public.course_holes;

create policy "courses authenticated write" on public.courses
  for update to authenticated using (true) with check (true);

create policy "course_tees authenticated write" on public.course_tees
  for update to authenticated using (true) with check (true);

create policy "course_holes authenticated write" on public.course_holes
  for update to authenticated using (true) with check (true);
