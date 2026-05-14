export type TeeId = "white" | "yellow" | "red";

export type HoleLayout = "straight" | "doglegLeft" | "doglegRight";

export type Hole = {
  n: number;
  par: number;
  strokeIndex: number;
  layout: HoleLayout;
  m: Record<TeeId, number>;
  tee: [number, number];
  green: [number, number, number];
  fairway: Array<[number, number]>;
  bunkers?: Array<[number, number, number, number]>;
  water?: Array<[number, number, number, number]>;
};

export type Tee = {
  id: TeeId;
  label: string;
  color: string;
  total: number;
  rating: number;
  slope: number;
  par: number;
};

export type Course = {
  id: string;
  name: string;
  region: string;
  par: number;
  rating: number;
  slope: number;
  tees: Tee[];
  holes: Hole[];
  comboParts?: [string, string];
};

export function makeHole(
  n: number,
  par: number,
  strokeIndex: number,
  whiteM: number,
  layout: HoleLayout = "straight",
  hazards?: { bunkers?: Hole["bunkers"]; water?: Hole["water"] },
): Hole {
  const m: Record<TeeId, number> = {
    white: whiteM,
    yellow: Math.round(whiteM * 0.94),
    red: Math.round(whiteM * 0.85),
  };
  const greenRadius = par <= 3 ? 7 : 8;
  const base = { n, par, strokeIndex, layout, m, ...hazards };
  if (layout === "doglegLeft") {
    return {
      ...base,
      tee: [78, 130],
      green: [22, 18, greenRadius],
      fairway: [[78, 128], [68, 108], [55, 86], [40, 64], [28, 42], [22, 26]],
    };
  }
  if (layout === "doglegRight") {
    return {
      ...base,
      tee: [22, 130],
      green: [78, 18, greenRadius],
      fairway: [[22, 128], [32, 108], [45, 86], [60, 64], [72, 42], [78, 26]],
    };
  }
  if (par === 3) {
    return {
      ...base,
      tee: [50, 126],
      green: [50, 36, greenRadius],
      fairway: [[50, 122], [50, 90], [50, 58]],
    };
  }
  return {
    ...base,
    tee: [50, 130],
    green: [50, 20, greenRadius],
    fairway: [[50, 128], [50, 104], [50, 80], [50, 56], [50, 32]],
  };
}

const PUISTO_HOLES: Hole[] = [
  makeHole(1, 4, 7, 322, "straight"),
  makeHole(2, 4, 5, 348, "doglegLeft", { bunkers: [[34, 28, 4, 3]] }),
  makeHole(3, 3, 9, 148, "straight", { bunkers: [[36, 44, 3, 3], [64, 44, 3, 3]] }),
  makeHole(4, 5, 1, 472, "doglegRight", {
    bunkers: [[52, 72, 3, 3]],
    water: [[42, 52, 14, 8]],
  }),
  makeHole(5, 4, 3, 376, "straight"),
  makeHole(6, 4, 4, 358, "doglegLeft", { water: [[60, 70, 12, 8]] }),
  makeHole(7, 3, 8, 162, "straight", { bunkers: [[38, 42, 3, 3]] }),
  makeHole(8, 4, 6, 340, "doglegRight"),
  makeHole(9, 4, 2, 389, "straight", { bunkers: [[44, 36, 3, 3], [56, 36, 3, 3]] }),
];

const JOKI_HOLES: Hole[] = [
  makeHole(1, 4, 2, 358, "doglegLeft", { water: [[44, 90, 12, 10]] }),
  makeHole(2, 5, 4, 491, "straight", { bunkers: [[40, 70, 3, 3], [60, 40, 3, 3]] }),
  makeHole(3, 3, 6, 156, "straight", {
    water: [[42, 70, 16, 8]],
    bunkers: [[64, 40, 3, 3]],
  }),
  makeHole(4, 4, 8, 342, "doglegRight", { water: [[58, 80, 12, 8]] }),
  makeHole(5, 4, 7, 372, "straight", { water: [[42, 60, 14, 8]] }),
  makeHole(6, 3, 9, 168, "straight", { water: [[40, 68, 16, 8]] }),
  makeHole(7, 5, 1, 478, "doglegLeft", { water: [[42, 86, 12, 12]] }),
  makeHole(8, 4, 5, 380, "straight", { bunkers: [[40, 40, 3, 3]] }),
  makeHole(9, 4, 3, 401, "doglegRight", { water: [[40, 50, 14, 8]] }),
];

const SUISTO_HOLES: Hole[] = [
  makeHole(1, 4, 5, 332, "straight", { bunkers: [[34, 60, 4, 3]] }),
  makeHole(2, 3, 9, 164, "straight", { bunkers: [[36, 44, 3, 3], [64, 44, 3, 3]] }),
  makeHole(3, 4, 3, 378, "doglegRight"),
  makeHole(4, 5, 1, 461, "straight", {
    bunkers: [[44, 80, 3, 3], [56, 50, 3, 3]],
  }),
  makeHole(5, 4, 7, 352, "doglegLeft", { bunkers: [[58, 64, 3, 3]] }),
  makeHole(6, 4, 6, 366, "straight"),
  makeHole(7, 3, 8, 152, "straight", { bunkers: [[38, 42, 3, 3], [62, 42, 3, 3]] }),
  makeHole(8, 4, 4, 371, "doglegRight", { bunkers: [[46, 72, 3, 3]] }),
  makeHole(9, 4, 2, 388, "straight", { bunkers: [[36, 32, 3, 3], [64, 32, 3, 3]] }),
];

function totalForTee(holes: Hole[], teeId: TeeId): number {
  return holes.reduce((s, h) => s + h.m[teeId], 0);
}

function makeCourse(
  id: string,
  name: string,
  par: number,
  rating: number,
  slope: number,
  holes: Hole[],
): Course {
  return {
    id,
    name,
    region: "Porin Golfkerho",
    par,
    rating,
    slope,
    holes,
    tees: [
      { id: "white",  label: "White",  color: "#F2EFE8", total: totalForTee(holes, "white"),  rating, slope, par },
      { id: "yellow", label: "Yellow", color: "#C8B86A", total: totalForTee(holes, "yellow"), rating, slope, par },
      { id: "red",    label: "Red",    color: "#A8584B", total: totalForTee(holes, "red"),    rating, slope, par },
    ],
  };
}

function makeCombo(a: Course, b: Course): Course {
  const aHoles = a.holes;
  const bHoles = b.holes.map((h, i) => ({
    ...h,
    n: 9 + i + 1,
    strokeIndex: h.strokeIndex + 9,
  }));
  const tees: Tee[] = a.tees.map((t) => {
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
    region: "Porin Golfkerho",
    par: a.par + b.par,
    rating: Math.round((a.rating + b.rating) * 10) / 10,
    slope: Math.round((a.slope + b.slope) / 2),
    tees,
    holes: [...aHoles, ...bHoles],
    comboParts: [a.id, b.id],
  };
}

const puisto = makeCourse("puisto", "Puisto", 35, 35.4, 122, PUISTO_HOLES);
const joki = makeCourse("joki", "Joki", 36, 35.8, 126, JOKI_HOLES);
const suisto = makeCourse("suisto", "Suisto", 35, 35.2, 124, SUISTO_HOLES);

const STATIC_COURSES: Record<string, Course> = {
  puisto,
  joki,
  suisto,
  "puisto-puisto": makeCombo(puisto, puisto),
  "puisto-joki": makeCombo(puisto, joki),
  "puisto-suisto": makeCombo(puisto, suisto),
  "joki-puisto": makeCombo(joki, puisto),
  "joki-joki": makeCombo(joki, joki),
  "joki-suisto": makeCombo(joki, suisto),
  "suisto-puisto": makeCombo(suisto, puisto),
  "suisto-joki": makeCombo(suisto, joki),
  "suisto-suisto": makeCombo(suisto, suisto),
};

// Mutable runtime cache. Starts as the static fallback; replaced when
// fetchAllCourses() returns data from Supabase. Components must re-render
// after installCourses() — the GolfApp tracks a coursesVersion counter
// in state for this.
let _activeCourses: Record<string, Course> = STATIC_COURSES;

export const COURSES_BY_ID: Record<string, Course> = STATIC_COURSES;

export function getCourse(id: string): Course {
  return _activeCourses[id] ?? _activeCourses.puisto;
}

export function installCourses(courses: Record<string, Course>) {
  _activeCourses = courses;
}

export function getCourseList(): CourseListing[] {
  return Object.values(_activeCourses)
    .map((c) => ({
      id: c.id,
      name: c.name,
      region: c.region,
      par: c.par,
      holes: c.holes.length,
    }))
    .sort((a, b) => {
      // Singles first (by name), then combos (by name).
      const aSingle = a.holes === 9;
      const bSingle = b.holes === 9;
      if (aSingle !== bSingle) return aSingle ? -1 : 1;
      return a.id.localeCompare(b.id);
    });
}

export type Club = { id: string; label: string; short: string; carry: number };

export const CLUBS: Club[] = [
  { id: "dr", label: "Driver", short: "Dr", carry: 224 },
  { id: "3w", label: "3-wood", short: "3W", carry: 206 },
  { id: "5w", label: "5-wood", short: "5W", carry: 192 },
  { id: "4h", label: "4-hybrid", short: "4H", carry: 178 },
  { id: "5i", label: "5-iron", short: "5i", carry: 165 },
  { id: "6i", label: "6-iron", short: "6i", carry: 154 },
  { id: "7i", label: "7-iron", short: "7i", carry: 142 },
  { id: "8i", label: "8-iron", short: "8i", carry: 130 },
  { id: "9i", label: "9-iron", short: "9i", carry: 117 },
  { id: "pw", label: "Pitching", short: "PW", carry: 105 },
  { id: "gw", label: "Gap", short: "GW", carry: 91 },
  { id: "sw", label: "Sand", short: "SW", carry: 80 },
  { id: "lw", label: "Lob", short: "LW", carry: 64 },
  { id: "pt", label: "Putter", short: "Pt", carry: 0 },
];

export type Ball = { id: string; label: string };

export const BALLS: Ball[] = [
  { id: "none", label: "Not specified" },
  { id: "prov1", label: "Pro V1" },
  { id: "prov1x", label: "Pro V1x" },
  { id: "chrome", label: "Chrome Soft" },
  { id: "tp5", label: "TP5" },
];

export type ShotResult = "in_play" | "out" | "hazard" | "lost";

export type ShotPosition = { lat: number; lng: number; accuracy: number };

export type Shot = {
  n: number;
  club: string;
  ball: string;
  startLie: "tee" | "fairway" | "rough" | "bunker" | "green";
  status: "done" | "in_flight";
  result: ShotResult | null;
  dist: number | null;
  position?: ShotPosition;
  measured?: boolean;
};

export type Round = {
  courseId: string;
  teeId: TeeId;
  startedAt: string;
  ball: string;
  currentHole: number;
  scores: Array<number | undefined>;
  putts: Array<number | undefined>;
  fairways: Array<boolean | null>;
  gir: Array<boolean | null>;
  currentShots: Shot[];
};

export function makeEmptyRound(courseId: string, teeId: TeeId): Round {
  const c = getCourse(courseId);
  const n = c.holes.length;
  const empty = <T>(v: T) => Array.from({ length: n }, () => v);
  return {
    courseId,
    teeId,
    startedAt: new Date().toISOString(),
    ball: "none",
    currentHole: 1,
    scores: empty<number | undefined>(undefined),
    putts: empty<number | undefined>(undefined),
    fairways: empty<boolean | null>(null),
    gir: empty<boolean | null>(null),
    currentShots: [],
  };
}

export type HistoryRow = {
  date: string;
  course: string;
  tee: string;
  score: number;
  toPar: string;
  fwy: string;
  gir: string;
  putts: number;
};

export const HISTORY: HistoryRow[] = [
  { date: "May 4", course: "Puisto", tee: "White", score: 41, toPar: "+6", fwy: "5/7", gir: "4/9", putts: 18 },
  { date: "Apr 27", course: "Joki", tee: "Yellow", score: 43, toPar: "+7", fwy: "4/7", gir: "3/9", putts: 19 },
  { date: "Apr 20", course: "Suisto", tee: "White", score: 39, toPar: "+4", fwy: "5/7", gir: "5/9", putts: 17 },
  { date: "Apr 12", course: "Puisto", tee: "White", score: 40, toPar: "+5", fwy: "5/7", gir: "4/9", putts: 18 },
  { date: "Apr 5", course: "Joki", tee: "White", score: 42, toPar: "+6", fwy: "4/7", gir: "3/9", putts: 19 },
];

export type CourseListing = {
  id: string;
  name: string;
  region: string;
  par: number;
  holes: number;
};

export function totalToPar(round: Round, holes: Hole[]) {
  let sum = 0;
  let played = 0;
  round.scores.forEach((s, i) => {
    if (s != null) {
      sum += s - holes[i].par;
      played++;
    }
  });
  return { toPar: sum, played };
}
