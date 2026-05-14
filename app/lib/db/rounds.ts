"use client";

import type { Round, Shot, ShotPosition, TeeId } from "../../data";
import { getCourse } from "../../data";
import { createClient } from "../supabase/client";
import type { Database } from "../supabase/types";

export type RoundSummary = {
  id: string;
  courseId: string;
  teeId: TeeId;
  startedAt: string;
  finishedAt: string | null;
  status: "active" | "completed" | "abandoned";
  totalScore: number;
  totalPar: number;
  toPar: number;
  holesPlayed: number;
  fairwaysHit: number;
  fairwayEligible: number;
  girHit: number;
  putts: number;
};

export type DbRound = {
  id: string;
  round: Round;
};

type ActiveRoundRow = {
  id: string;
  course_id: string;
  tee_id: string;
  ball: string | null;
  current_hole: number;
  status: "active" | "completed" | "abandoned";
  started_at: string;
  finished_at: string | null;
  round_holes: Array<{
    hole_number: number;
    par: number;
    score: number | null;
    putts: number | null;
    fairway: boolean | null;
    gir: boolean | null;
  }>;
  shots: Array<{
    hole_number: number;
    n: number;
    club_id: string;
    ball_id: string | null;
    start_lie: "tee" | "fairway" | "rough" | "bunker" | "green";
    status: "in_flight" | "done";
    result: "in_play" | "out" | "hazard" | "lost" | null;
    dist: number | null;
    measured: boolean;
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
  }>;
};

export async function fetchActiveRound(userId: string): Promise<DbRound | null> {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("rounds")
    .select(
      "id, course_id, tee_id, ball, current_hole, status, started_at, finished_at, " +
        "round_holes(hole_number, par, score, putts, fairway, gir), " +
        "shots(hole_number, n, club_id, ball_id, start_lie, status, result, dist, measured, lat, lng, accuracy)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .returns<ActiveRoundRow[]>();
  if (error) throw error;
  const row = rows?.[0];
  if (!row) return null;

  const course = getCourse(row.course_id);
  const n = course.holes.length;
  const scores: Array<number | undefined> = Array.from({ length: n }, () => undefined);
  const putts: Array<number | undefined> = Array.from({ length: n }, () => undefined);
  const fairways: Array<boolean | null> = Array.from({ length: n }, () => null);
  const gir: Array<boolean | null> = Array.from({ length: n }, () => null);
  for (const rh of row.round_holes ?? []) {
    const i = rh.hole_number - 1;
    if (i < 0 || i >= n) continue;
    scores[i] = rh.score ?? undefined;
    putts[i] = rh.putts ?? undefined;
    fairways[i] = rh.fairway;
    gir[i] = rh.gir;
  }

  const currentShots: Shot[] = (row.shots ?? [])
    .filter((s) => s.hole_number === row.current_hole)
    .sort((a, b) => a.n - b.n)
    .map((s) => {
      const position: ShotPosition | undefined =
        s.lat != null && s.lng != null
          ? { lat: s.lat, lng: s.lng, accuracy: s.accuracy ?? 0 }
          : undefined;
      return {
        n: s.n,
        club: s.club_id,
        ball: s.ball_id ?? "none",
        startLie: s.start_lie,
        status: s.status,
        result: s.result,
        dist: s.dist,
        measured: s.measured,
        position,
      };
    });

  return {
    id: row.id,
    round: {
      courseId: row.course_id,
      teeId: row.tee_id as TeeId,
      startedAt: row.started_at,
      ball: row.ball ?? "none",
      currentHole: row.current_hole,
      scores,
      putts,
      fairways,
      gir,
      currentShots,
    },
  };
}

export async function createRound(
  userId: string,
  courseId: string,
  teeId: TeeId,
  ball: string,
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rounds")
    .insert({
      user_id: userId,
      course_id: courseId,
      tee_id: teeId,
      ball,
      current_hole: 1,
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateRound(
  roundId: string,
  patch: {
    ball?: string;
    currentHole?: number;
    status?: "active" | "completed" | "abandoned";
    finishedAt?: string | null;
  },
) {
  const supabase = createClient();
  const update: Database["public"]["Tables"]["rounds"]["Update"] = {};
  if (patch.ball !== undefined) update.ball = patch.ball;
  if (patch.currentHole !== undefined) update.current_hole = patch.currentHole;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.finishedAt !== undefined) update.finished_at = patch.finishedAt;
  const { error } = await supabase.from("rounds").update(update).eq("id", roundId);
  if (error) throw error;
}

export async function upsertRoundHole(
  roundId: string,
  holeNumber: number,
  par: number,
  patch: {
    score?: number | null;
    putts?: number | null;
    fairway?: boolean | null;
    gir?: boolean | null;
  },
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("round_holes")
    .upsert(
      {
        round_id: roundId,
        hole_number: holeNumber,
        par,
        score: patch.score ?? null,
        putts: patch.putts ?? null,
        fairway: patch.fairway ?? null,
        gir: patch.gir ?? null,
      },
      { onConflict: "round_id,hole_number" },
    );
  if (error) throw error;
}

export async function upsertShot(
  roundId: string,
  holeNumber: number,
  shot: Shot,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("shots")
    .upsert(
      {
        round_id: roundId,
        hole_number: holeNumber,
        n: shot.n,
        club_id: shot.club,
        ball_id: shot.ball,
        start_lie: shot.startLie,
        status: shot.status,
        result: shot.result,
        dist: shot.dist,
        measured: shot.measured ?? false,
        lat: shot.position?.lat ?? null,
        lng: shot.position?.lng ?? null,
        accuracy: shot.position?.accuracy ?? null,
      },
      { onConflict: "round_id,hole_number,n" },
    );
  if (error) throw error;
}

export async function deleteHoleShots(roundId: string, holeNumber: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("shots")
    .delete()
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber);
  if (error) throw error;
}

type HistoryRow = {
  id: string;
  course_id: string;
  tee_id: string;
  status: "active" | "completed" | "abandoned";
  started_at: string;
  finished_at: string | null;
  round_holes: Array<{
    par: number;
    score: number | null;
    putts: number | null;
    fairway: boolean | null;
    gir: boolean | null;
  }>;
};

export async function fetchRoundHistory(
  userId: string,
  limit = 20,
): Promise<RoundSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rounds")
    .select(
      "id, course_id, tee_id, status, started_at, finished_at, " +
        "round_holes(par, score, putts, fairway, gir)",
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(limit)
    .returns<HistoryRow[]>();
  if (error) throw error;
  return (data ?? []).map((row) => {
    const holes = row.round_holes ?? [];
    const played = holes.filter((h) => h.score != null);
    const totalScore = played.reduce((s, h) => s + (h.score ?? 0), 0);
    const totalPar = played.reduce((s, h) => s + h.par, 0);
    const fairwayEligible = holes.filter(
      (h) => h.par >= 4 && h.score != null,
    ).length;
    const fairwaysHit = holes.filter((h) => h.fairway === true).length;
    const girHit = holes.filter((h) => h.gir === true).length;
    const putts = holes.reduce((s, h) => s + (h.putts ?? 0), 0);
    return {
      id: row.id,
      courseId: row.course_id,
      teeId: row.tee_id as TeeId,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      status: row.status,
      totalScore,
      totalPar,
      toPar: totalScore - totalPar,
      holesPlayed: played.length,
      fairwaysHit,
      fairwayEligible,
      girHit,
      putts,
    };
  });
}
