"use client";

import {
  COURSES_BY_ID as STATIC_COURSES_BY_ID,
  type Course,
  type Hole,
  type HoleLayout,
  type TeeId,
  makeHole,
} from "../../data";
import { createClient } from "../supabase/client";
import { supabaseConfigured } from "../supabase/env";

export type CourseTeeMeta = {
  rating: number;
  slope: number;
  par: number;
  total: number;
};

export type CourseHoleMeta = {
  par: number;
  strokeIndex: number;
  white_m: number;
  yellow_m: number;
  red_m: number;
};

type CourseRow = {
  id: string;
  name: string;
  region: string;
  par: number;
  rating: number;
  slope: number;
  holes_count: number;
  position: number;
};

type TeeRow = {
  course_id: string;
  tee_id: string;
  label: string;
  color: string;
  total: number;
  rating: number;
  slope: number;
  par: number;
};

type HoleRow = {
  course_id: string;
  hole_number: number;
  par: number;
  stroke_index: number;
  white_m: number;
  yellow_m: number;
  red_m: number;
  layout: HoleLayout;
  bunkers: Array<[number, number, number, number]> | null;
  water: Array<[number, number, number, number]> | null;
};

function rowToHole(row: HoleRow): Hole {
  const base = makeHole(
    row.hole_number,
    row.par,
    row.stroke_index,
    row.white_m,
    row.layout,
    {
      bunkers: row.bunkers ?? undefined,
      water: row.water ?? undefined,
    },
  );
  // Honor the DB's tee distances rather than the ratio derived in makeHole.
  return {
    ...base,
    m: { white: row.white_m, yellow: row.yellow_m, red: row.red_m },
  };
}

function buildCourse(
  c: CourseRow,
  tees: TeeRow[],
  holes: HoleRow[],
): Course {
  return {
    id: c.id,
    name: c.name,
    region: c.region,
    par: c.par,
    rating: c.rating,
    slope: c.slope,
    tees: tees
      .filter((t) => t.course_id === c.id)
      .map((t) => ({
        id: t.tee_id as TeeId,
        label: t.label,
        color: t.color,
        total: t.total,
        rating: t.rating ?? c.rating,
        slope: t.slope ?? c.slope,
        par: t.par ?? c.par,
      })),
    holes: holes
      .filter((h) => h.course_id === c.id)
      .sort((a, b) => a.hole_number - b.hole_number)
      .map(rowToHole),
  };
}

function combineCombo(a: Course, b: Course): Course {
  const aHoles = a.holes;
  const bHoles = b.holes.map((h, i) => ({
    ...h,
    n: 9 + i + 1,
    strokeIndex: h.strokeIndex + 9,
  }));
  const tees = a.tees.map((t) => {
    const bt = b.tees.find((x) => x.id === t.id);
    return {
      ...t,
      total: t.total + (bt?.total ?? 0),
      rating: Math.round((t.rating + (bt?.rating ?? t.rating)) * 10) / 10,
      slope: Math.round((t.slope + (bt?.slope ?? t.slope)) / 2),
      par: t.par + (bt?.par ?? t.par),
    };
  });
  return {
    id: `${a.id}-${b.id}`,
    name: `${a.name} + ${b.name}`,
    region: a.region,
    par: a.par + b.par,
    rating: Math.round((a.rating + b.rating) * 10) / 10,
    slope: Math.round((a.slope + b.slope) / 2),
    tees,
    holes: [...aHoles, ...bHoles],
    comboParts: [a.id, b.id],
  };
}

export async function fetchAllCourses(): Promise<Record<string, Course>> {
  if (!supabaseConfigured()) return STATIC_COURSES_BY_ID;

  const supabase = createClient();
  const [coursesRes, teesRes, holesRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, region, par, rating, slope, holes_count, position")
      .order("position", { ascending: true })
      .returns<CourseRow[]>(),
    supabase
      .from("course_tees")
      .select("course_id, tee_id, label, color, total, rating, slope, par")
      .returns<TeeRow[]>(),
    supabase
      .from("course_holes")
      .select(
        "course_id, hole_number, par, stroke_index, white_m, yellow_m, red_m, layout, bunkers, water",
      )
      .returns<HoleRow[]>(),
  ]);

  if (coursesRes.error) throw coursesRes.error;
  if (teesRes.error) throw teesRes.error;
  if (holesRes.error) throw holesRes.error;

  const rows = coursesRes.data ?? [];
  const tees = teesRes.data ?? [];
  const holes = holesRes.data ?? [];

  if (rows.length === 0) return STATIC_COURSES_BY_ID;

  const singles = rows.map((c) => buildCourse(c, tees, holes));
  const byId: Record<string, Course> = {};
  for (const s of singles) byId[s.id] = s;

  // Derive combos: every ordered pair, including same-course.
  for (const a of singles) {
    for (const b of singles) {
      const id = `${a.id}-${b.id}`;
      byId[id] = combineCombo(a, b);
    }
  }
  return byId;
}

export async function updateCourseTeeMeta(
  courseId: string,
  teeId: TeeId,
  patch: Partial<CourseTeeMeta>,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("course_tees")
    .update({
      rating: patch.rating,
      slope: patch.slope,
      par: patch.par,
      total: patch.total,
    })
    .eq("course_id", courseId)
    .eq("tee_id", teeId);
  if (error) throw error;
}

export async function updateCourseHoleMeta(
  courseId: string,
  holeNumber: number,
  patch: Partial<CourseHoleMeta>,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("course_holes")
    .update({
      par: patch.par,
      stroke_index: patch.strokeIndex,
      white_m: patch.white_m,
      yellow_m: patch.yellow_m,
      red_m: patch.red_m,
    })
    .eq("course_id", courseId)
    .eq("hole_number", holeNumber);
  if (error) throw error;
}

export async function updateCourseMeta(
  courseId: string,
  patch: { par?: number; rating?: number; slope?: number; name?: string; region?: string },
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      par: patch.par,
      rating: patch.rating,
      slope: patch.slope,
      name: patch.name,
      region: patch.region,
    })
    .eq("id", courseId);
  if (error) throw error;
}
