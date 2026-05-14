#!/usr/bin/env node
// Applies every SQL file in supabase/migrations/ to the linked Supabase
// project via the Management API. Idempotent: each migration uses
// `create table if not exists` / `on conflict do nothing` so re-running
// is safe.

import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local. Run setup first.");
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const token = env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN in .env.local.\n\n" +
      "  1. Visit https://supabase.com/dashboard/account/tokens\n" +
      "  2. Generate a new token (name it 'Golf migrations')\n" +
      "  3. Add to .env.local as SUPABASE_ACCESS_TOKEN=sbp_xxxxxxx\n",
  );
  process.exit(1);
}
if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local.");
  process.exit(1);
}

const ref = new URL(supabaseUrl).hostname.split(".")[0];
console.log(`Project ref: ${ref}`);

const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("No migrations found.");
  process.exit(0);
}

for (const file of files) {
  process.stdout.write(`→ ${file} ... `);
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    console.log("FAILED");
    console.error(`HTTP ${res.status}\n${body}`);
    process.exit(1);
  }
  console.log("ok");
}

console.log(`\nAll ${files.length} migration(s) applied.`);
