"use client";

import type { Club } from "../../data";
import { createClient } from "../supabase/client";

export async function fetchUserClubs(userId: string): Promise<Club[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_clubs")
    .select("club_id, label, short, carry, position, enabled")
    .eq("user_id", userId)
    .eq("enabled", true)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.club_id,
    label: row.label,
    short: row.short,
    carry: row.carry,
  }));
}

export async function updateClubCarry(
  userId: string,
  clubId: string,
  carry: number,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_clubs")
    .update({ carry })
    .eq("user_id", userId)
    .eq("club_id", clubId);
  if (error) throw error;
}

export async function setClubEnabled(
  userId: string,
  clubId: string,
  enabled: boolean,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_clubs")
    .update({ enabled })
    .eq("user_id", userId)
    .eq("club_id", clubId);
  if (error) throw error;
}
