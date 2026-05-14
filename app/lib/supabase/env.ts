// Supabase shipped a new API-key system in 2025: "publishable" replaces
// "anon" (and "secret" replaces "service_role"). Both formats work with
// @supabase/ssr — accept either env var name.
function publicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = publicKey();
  if (!url || !anon) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local. See SETUP.md.",
    );
  }
  return { url, anon };
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey());
}
