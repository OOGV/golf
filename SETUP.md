# Setup

The app uses Supabase for auth (magic-link email) and storage (profile, clubs, balls, rounds, shots, history).

## 1. Pick a Supabase project

You have two options:

### Option A: Provision via Vercel Marketplace

From the project root:

```bash
vercel install supabase
```

This creates a managed Supabase project linked to your Vercel project and auto-provisions the env vars on every deployment. Pull them locally with:

```bash
vercel env pull .env.local
```

### Option B: Use an existing Supabase project

Create a project at https://supabase.com if you don't have one, then copy:

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `Project Settings → Data API`.

## 2. Run the database migrations

The schema lives in `supabase/migrations/`. Apply both files in order via either:

- **Dashboard:** copy each file's contents into the SQL Editor and run, oldest first.
- **CLI:** `supabase db push` (after `supabase link --project-ref <ref>`).

Migration `0001_initial.sql` (user-scoped, RLS-enabled):

| Table | Purpose |
|---|---|
| `profiles` | display name, handicap, default ball |
| `user_clubs` | per-user club list with custom carry distances |
| `user_balls` | per-user ball list (includes "Not specified") |
| `rounds` | one row per round, with `status: active \| completed \| abandoned` |
| `round_holes` | per-hole score/putts/fairway/GIR within a round |
| `shots` | every shot with club/ball/lie/result/distance and optional GPS position |

A `handle_new_user` trigger seeds a profile + the default club and ball lists when someone signs up.

Migration `0002_courses.sql` (shared catalog, public read):

| Table | Purpose |
|---|---|
| `courses` | id, name, region, par, rating, slope, holes_count |
| `course_tees` | per-course tee list (white/yellow/red with total distance) |
| `course_holes` | per-hole par, **stroke_index**, distances per tee, layout, hazards |

Seeds Puisto, Joki, and Suisto 9-hole courses with realistic stroke indices. 18-hole combinations are derived in TypeScript at runtime (no rows needed).

## 3. Configure the auth redirect URL

In Supabase: `Authentication → URL Configuration → Redirect URLs`. Add:

- `http://localhost:3000/auth/callback`
- `https://YOUR_DOMAIN/auth/callback` (production)

This is required so the magic-link emails redirect back to the app.

## 4. Run the app

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. The middleware redirects to `/login` if you aren't signed in. Enter your email, click the link in your inbox, and you'll be back in the app with your profile/clubs/balls pre-seeded.

## How persistence is wired

- **Profile, clubs, balls:** read once on auth, edited from `/account`. Each change writes to Supabase immediately.
- **Rounds:** when you pick a course + tee, a row is inserted into `rounds` with `status=active`. Switching to a different course offers to abandon the in-progress round (sets `status=abandoned`).
- **Shots:** every shoot/finish-hole action upserts the affected shots, the per-hole `round_holes` row, and the round's `current_hole`.
- **Finishing the last hole:** sets `rounds.status=completed`, stamps `finished_at`, and the round shows up in `History` in the menu.

If the env vars are missing the middleware skips auth checks and the app falls back to in-memory state (useful when running a quick local preview without a project).
