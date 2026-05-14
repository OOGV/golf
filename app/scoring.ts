import type { Course, Hole, TeeId } from "./data";

function teeMeta(course: Course, teeId?: TeeId) {
  const tee = teeId ? course.tees.find((t) => t.id === teeId) : undefined;
  return {
    rating: tee?.rating ?? course.rating,
    slope: tee?.slope ?? course.slope,
    par: tee?.par ?? course.par,
  };
}

// Course handicap per WHS, rounded to nearest integer.
//   CH = HI × (Slope / 113) + (CR - Par)
// For 9-hole rounds, halve the 18-hole handicap index first.
export function courseHandicap(
  handicapIndex: number | null,
  course: Course,
  teeId?: TeeId,
): number | null {
  if (handicapIndex == null) return null;
  const { rating, slope, par } = teeMeta(course, teeId);
  const holes = course.holes.length;
  const hi = holes === 9 ? handicapIndex / 2 : handicapIndex;
  const raw = hi * (slope / 113) + (rating - par);
  return Math.round(raw);
}

// Strokes a player receives on a given hole, by stroke index.
// First everyone gets floor(CH / N) strokes on every hole;
// then the remaining (CH mod N) are distributed to the hardest holes
// (lowest SI first). Negative handicaps (plus handicaps) give strokes back,
// applied from the easiest holes first.
export function strokesReceived(
  ch: number | null,
  strokeIndex: number,
  totalHoles: number,
): number {
  if (ch == null) return 0;
  if (ch >= 0) {
    const base = Math.floor(ch / totalHoles);
    const extra = ch % totalHoles;
    return base + (strokeIndex <= extra ? 1 : 0);
  }
  // Plus handicap: give strokes back from easiest hole down.
  const positive = -ch;
  const base = -Math.floor(positive / totalHoles);
  const extra = positive % totalHoles;
  return base - (strokeIndex > totalHoles - extra ? 1 : 0);
}

// Net Double Bogey cap: max score on a hole is par + 2 + strokes received.
export function adjustedHoleScore(
  gross: number | null,
  par: number,
  strokesReceivedOnHole: number,
): number | null {
  if (gross == null) return null;
  const cap = par + 2 + strokesReceivedOnHole;
  return Math.min(gross, cap);
}

// Net score: gross minus strokes received.
export function netHoleScore(
  gross: number | null,
  strokesReceivedOnHole: number,
): number | null {
  if (gross == null) return null;
  return gross - strokesReceivedOnHole;
}

export type RoundScoring = {
  courseHandicap: number | null;
  totalGross: number;
  totalAdjusted: number;
  totalNet: number;
  totalPar: number;
  holesPlayed: number;
};

export function scoreRound(
  course: Course,
  scores: Array<number | undefined>,
  handicapIndex: number | null,
  teeId?: TeeId,
): RoundScoring {
  const ch = courseHandicap(handicapIndex, course, teeId);
  const totalHoles = course.holes.length;

  let totalGross = 0;
  let totalAdjusted = 0;
  let totalNet = 0;
  let totalPar = 0;
  let holesPlayed = 0;

  course.holes.forEach((hole: Hole, i: number) => {
    const s = scores[i];
    if (s == null) return;
    const sr = strokesReceived(ch, hole.strokeIndex, totalHoles);
    const adj = adjustedHoleScore(s, hole.par, sr) ?? s;
    totalGross += s;
    totalAdjusted += adj;
    totalNet += adj - sr;
    totalPar += hole.par;
    holesPlayed += 1;
  });

  return {
    courseHandicap: ch,
    totalGross,
    totalAdjusted,
    totalNet,
    totalPar,
    holesPlayed,
  };
}
