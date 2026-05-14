"use client";

import type { Ball } from "../../data";
import { createClient } from "../supabase/client";

export async function fetchUserBalls(userId: string): Promise<Ball[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_balls")
    .select("ball_id, label, position, enabled")
    .eq("user_id", userId)
    .eq("enabled", true)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.ball_id, label: row.label }));
}

export async function upsertBall(
  userId: string,
  ballId: string,
  label: string,
  position: number,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_balls")
    .upsert(
      { user_id: userId, ball_id: ballId, label, position, enabled: true },
      { onConflict: "user_id,ball_id" },
    );
  if (error) throw error;
}

export async function setBallEnabled(
  userId: string,
  ballId: string,
  enabled: boolean,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_balls")
    .update({ enabled })
    .eq("user_id", userId)
    .eq("ball_id", ballId);
  if (error) throw error;
}
