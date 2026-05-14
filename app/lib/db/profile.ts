"use client";

import { createClient } from "../supabase/client";

export type Profile = {
  id: string;
  displayName: string | null;
  handicap: number | null;
  defaultBall: string | null;
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, handicap, default_ball")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    displayName: data.display_name,
    handicap: data.handicap,
    defaultBall: data.default_ball,
  };
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string | null; handicap?: number | null; defaultBall?: string | null },
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: patch.displayName ?? undefined,
      handicap: patch.handicap ?? undefined,
      default_ball: patch.defaultBall ?? undefined,
    })
    .eq("id", userId);
  if (error) throw error;
}
