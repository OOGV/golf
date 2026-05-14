"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Hairline,
  HoleMap,
  HoleStrip,
  PrimaryButton,
  ScoreBadge,
  Sheet,
  ShotRow,
  Stat,
  TOKENS,
} from "./components";
import {
  type Ball,
  BALLS,
  type Club,
  CLUBS,
  type Course,
  getCourse,
  getCourseList,
  installCourses,
  makeEmptyRound,
  type Round,
  type Shot,
  type ShotPosition,
  type ShotResult,
  type TeeId,
  totalToPar,
} from "./data";
import { formatDistance, greenLatLng, haversine } from "./geo";
import {
  courseHandicap as computeCourseHandicap,
  scoreRound,
  strokesReceived as computeStrokesReceived,
} from "./scoring";
import { useGeolocation, type GeoState, type GeoStatus } from "./use-geolocation";
import { useUser } from "./lib/db/auth";
import { fetchAllCourses } from "./lib/db/courses";
import { fetchUserClubs } from "./lib/db/clubs";
import { fetchUserBalls } from "./lib/db/balls";
import { fetchProfile } from "./lib/db/profile";
import {
  createRound,
  fetchActiveRound,
  fetchRoundHistory,
  type RoundSummary,
  updateRound,
  upsertRoundHole,
  upsertShot,
} from "./lib/db/rounds";

const { INK, MOSS, BRICK, PAPER } = TOKENS;

function gpsLabel(status: GeoStatus, accuracy?: number): string {
  switch (status) {
    case "granted":
      return accuracy != null ? `GPS · ${Math.round(accuracy)} m` : "GPS";
    case "locating":
    case "unknown":
      return "Locating…";
    case "denied":
      return "GPS off";
    case "unavailable":
      return "No signal";
    case "unsupported":
      return "No GPS";
  }
}

function GpsPill({ geo }: { geo: GeoState }) {
  const acc = geo.position?.accuracy;
  const goodFix = geo.status === "granted" && acc != null && acc <= 20;
  const tone =
    geo.status === "granted"
      ? goodFix
        ? MOSS
        : BRICK
      : geo.status === "locating" || geo.status === "unknown"
        ? "rgba(26,38,32,0.55)"
        : BRICK;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 999,
        background: "rgba(26,38,32,0.05)",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontSize: 10,
        color: tone,
        letterSpacing: 0.4,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: tone,
          opacity: geo.status === "granted" ? 1 : 0.55,
        }}
      />
      {gpsLabel(geo.status, acc)}
    </div>
  );
}

type Screen = "course" | "tee" | "round";

function RoundHeader({
  round,
  course,
  onMenu,
}: {
  round: Round;
  course: Course;
  onMenu: () => void;
}) {
  const { toPar, played } = totalToPar(round, course.holes);
  const totalHoles = course.holes.length;
  const strokes = round.scores.reduce<number>((s, v) => s + (v || 0), 0);
  const tee = course.tees.find((t) => t.id === round.teeId)!;
  return (
    <div
      style={{
        padding: "14px 20px 16px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "rgba(26,38,32,0.5)",
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {totalHoles}-hole round · {tee.label}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: INK,
            letterSpacing: -0.4,
            fontFamily: "var(--font-geist-sans), ui-sans-serif",
          }}
        >
          {course.name}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(26,38,32,0.55)",
            marginTop: 2,
          }}
        >
          {played} of {totalHoles} played · {strokes} strokes
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <button
          aria-label="Open menu"
          onClick={onMenu}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 0,
            background: "rgba(26,38,32,0.06)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="14" height="12" viewBox="0 0 14 12">
            <path d="M0 1h14M0 6h14M0 11h14" stroke={INK} strokeWidth="1.2" />
          </svg>
        </button>
        <div
          style={{
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1,
            color: toPar < 0 ? MOSS : toPar === 0 ? INK : BRICK,
            letterSpacing: -0.5,
          }}
        >
          {toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : toPar}
        </div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "rgba(26,38,32,0.5)",
            fontWeight: 500,
          }}
        >
          to par
        </div>
      </div>
    </div>
  );
}

function HoleHeader({
  hole,
  teeId,
  strokesReceived,
}: {
  hole: Course["holes"][number];
  teeId: TeeId;
  strokesReceived: number;
}) {
  const meters = hole.m[teeId];
  return (
    <div
      style={{
        padding: "18px 20px 12px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        borderTop: "1px solid rgba(26,38,32,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div
          style={{
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: 44,
            fontWeight: 500,
            color: INK,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          {String(hole.n).padStart(2, "0")}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(26,38,32,0.5)",
              fontWeight: 500,
            }}
          >
            Hole
          </div>
          <div style={{ fontSize: 13, color: "rgba(26,38,32,0.7)" }}>
            Par {hole.par}
            <span style={{ color: "rgba(26,38,32,0.45)", marginLeft: 6 }}>
              · SI {hole.strokeIndex}
              {strokesReceived > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span style={{ color: MOSS, fontWeight: 500 }}>
                    +{strokesReceived}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: 22,
            fontWeight: 500,
            color: INK,
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          {meters}
          <span
            style={{
              fontSize: 11,
              color: "rgba(26,38,32,0.5)",
              marginLeft: 2,
            }}
          >
            m
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "rgba(26,38,32,0.5)",
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          distance
        </div>
      </div>
    </div>
  );
}

function ShootSheet({
  shotN,
  inFlight,
  defaultBall,
  clubs,
  balls,
  onShoot,
  onMark,
  onClose,
}: {
  shotN: number;
  inFlight?: Shot;
  defaultBall: string;
  clubs: Club[];
  balls: Ball[];
  onShoot: (payload: { club: string; ball: string; lie: string }) => void;
  onMark: (result: Exclude<ShotResult, "in_play">) => void;
  onClose: () => void;
}) {
  const fallbackClub = clubs[0]?.id ?? "7i";
  const [club, setClub] = useState(inFlight ? inFlight.club : fallbackClub);
  const [ball, setBall] = useState(defaultBall);
  const [lie, setLie] = useState<string>(shotN === 1 ? "tee" : "fairway");

  return (
    <div style={{ padding: "0 22px" }}>
      {inFlight && (
        <div
          style={{
            background: "rgba(26,38,32,0.04)",
            border: "1px dashed rgba(26,38,32,0.18)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "rgba(26,38,32,0.5)",
                fontWeight: 500,
              }}
            >
              Previous · shot {inFlight.n}
            </div>
            <div
              style={{
                fontSize: 13,
                color: INK,
                marginTop: 2,
              }}
            >
              {clubs.find((c) => c.id === inFlight.club)?.label ||
                CLUBS.find((c) => c.id === inFlight.club)?.label ||
                "Shot"}{" "}
              in flight
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(26,38,32,0.55)",
              textAlign: "right",
              lineHeight: 1.3,
            }}
          >
            Distance recorded
            <br />
            when you shoot next
          </div>
        </div>
      )}

      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "rgba(26,38,32,0.5)",
          fontWeight: 500,
          marginBottom: 10,
        }}
      >
        Club · shot {shotN}
      </div>
      <select
        value={club}
        onChange={(e) => setClub(e.target.value)}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 10,
          border: "1px solid rgba(26,38,32,0.15)",
          background: PAPER,
          color: INK,
          padding: "0 12px",
          fontSize: 14,
          appearance: "none",
          marginBottom: 16,
        }}
      >
        {clubs.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
            {c.carry ? ` · ${c.carry} m` : ""}
          </option>
        ))}
      </select>

      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "rgba(26,38,32,0.5)",
          fontWeight: 500,
          marginBottom: 10,
        }}
      >
        Lie · Ball
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <select
          value={lie}
          onChange={(e) => setLie(e.target.value)}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 10,
            border: "1px solid rgba(26,38,32,0.15)",
            background: PAPER,
            color: INK,
            padding: "0 12px",
            fontSize: 14,
            appearance: "none",
          }}
        >
          <option value="tee">Tee</option>
          <option value="fairway">Fairway</option>
          <option value="rough">Rough</option>
          <option value="bunker">Bunker</option>
          <option value="green">Green</option>
        </select>
        <select
          value={ball}
          onChange={(e) => setBall(e.target.value)}
          style={{
            flex: 1,
            height: 44,
            borderRadius: 10,
            border: "1px solid rgba(26,38,32,0.15)",
            background: PAPER,
            color: INK,
            padding: "0 12px",
            fontSize: 14,
            appearance: "none",
          }}
        >
          {balls.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {inFlight && (
        <>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(26,38,32,0.5)",
              fontWeight: 500,
              marginBottom: 10,
            }}
          >
            End previous shot as…
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
              marginBottom: 18,
            }}
          >
            {(["out", "hazard", "lost"] as const).map((r) => (
              <button
                key={r}
                onClick={() => onMark(r)}
                style={{
                  border: "1px solid rgba(26,38,32,0.15)",
                  cursor: "pointer",
                  background: "transparent",
                  color: INK,
                  padding: "12px 0",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: "capitalize",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <PrimaryButton variant="outline" onClick={onClose} style={{ flex: 1 }}>
          Cancel
        </PrimaryButton>
        <PrimaryButton onClick={() => onShoot({ club, ball, lie })} style={{ flex: 2 }}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M2 6h7m-3-3l3 3-3 3"
              stroke={PAPER}
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Shoot
        </PrimaryButton>
      </div>
    </div>
  );
}

function ScoringGlance({
  scoring,
  handicap,
}: {
  scoring: ReturnType<typeof scoreRound>;
  handicap: number | null;
}) {
  if (scoring.holesPlayed === 0) return null;
  const { courseHandicap: ch, totalGross, totalAdjusted, totalNet, totalPar } =
    scoring;
  const grossDelta = totalGross - totalPar;
  const adjDelta = totalAdjusted - totalPar;
  const netDelta = totalNet - totalPar;
  const fmt = (d: number) => (d === 0 ? "E" : d > 0 ? `+${d}` : `${d}`);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        padding: "12px 20px 4px",
      }}
    >
      <Stat label="CH" value={ch ?? "—"} unit={handicap == null ? "set HCP" : ""} />
      <Stat label="Gross" value={totalGross} unit={fmt(grossDelta)} />
      <Stat label="AGS" value={totalAdjusted} unit={fmt(adjDelta)} />
      <Stat label="Net" value={totalNet} unit={fmt(netDelta)} />
    </div>
  );
}

function StatsGlance({ round }: { round: Round }) {
  const played = round.scores.filter((s) => s != null).length;
  const fwyHit = round.fairways.filter((f) => f === true).length;
  const fwyEligible = round.fairways.filter(
    (f, i) => f !== null && round.scores[i] != null,
  ).length;
  const girHit = round.gir.filter(
    (g, i) => g === true && round.scores[i] != null,
  ).length;
  const totalPutts = round.putts.reduce<number>((s, p) => s + (p || 0), 0);
  const avgPutts = played ? (totalPutts / played).toFixed(1) : "–";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        padding: "12px 20px 4px",
      }}
    >
      <Stat label="Fairways" value={`${fwyHit}/${fwyEligible}`} />
      <Stat label="GIR" value={`${girHit}/${played}`} />
      <Stat label="Putts" value={totalPutts} />
      <Stat label="Avg" value={avgPutts} unit="ppr" />
    </div>
  );
}

function RoundScreen({
  round,
  geo,
  clubs,
  balls,
  handicap,
  onMenu,
  onOpenShoot,
  onFinishHole,
}: {
  round: Round;
  geo: GeoState;
  clubs: Club[];
  balls: Ball[];
  handicap: number | null;
  onMenu: () => void;
  onOpenShoot: () => void;
  onFinishHole: () => void;
}) {
  const course = getCourse(round.courseId);
  const hole = course.holes[round.currentHole - 1];
  const shots = round.currentShots;
  const pin = greenLatLng(round.courseId, round.currentHole);
  const distToPin = geo.position ? haversine(geo.position, pin) : null;
  const totalHoles = course.holes.length;
  const ch = computeCourseHandicap(handicap, course);
  const strokesHere = computeStrokesReceived(ch, hole.strokeIndex, totalHoles);
  const scoring = scoreRound(course, round.scores, handicap);

  return (
    <div
      className="no-scrollbar"
      style={{
        height: "100%",
        overflow: "auto",
        background: PAPER,
      }}
    >
      <RoundHeader round={round} course={course} onMenu={onMenu} />

      <div style={{ padding: "0 0 14px" }}>
        <HoleStrip holes={course.holes} round={round} />
      </div>

      <Hairline />

      <HoleHeader hole={hole} teeId={round.teeId} strokesReceived={strokesHere} />

      <div style={{ padding: "0 16px 16px" }}>
        <HoleMap hole={hole} shots={shots} height={250} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            padding: "0 4px",
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: 11,
            color: "rgba(26,38,32,0.55)",
          }}
        >
          <span>
            To pin ·{" "}
            <strong style={{ color: INK, fontWeight: 500 }}>
              {formatDistance(distToPin)}
            </strong>
          </span>
          <GpsPill geo={geo} />
        </div>
      </div>

      <Hairline />

      <div
        style={{
          padding: "16px 20px 4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "rgba(26,38,32,0.5)",
            fontWeight: 500,
          }}
        >
          This hole · {shots.length} shot{shots.length !== 1 ? "s" : ""}
        </div>
        {shots.length > 0 && (
          <ScoreBadge score={shots.length} par={hole.par} size={26} />
        )}
      </div>

      <div style={{ padding: "0 20px" }}>
        {shots.map((s) => (
          <ShotRow
            key={s.n}
            shot={s}
            club={
              clubs.find((c) => c.id === s.club) ??
              CLUBS.find((c) => c.id === s.club)
            }
            ball={
              s.ball !== "none"
                ? balls.find((b) => b.id === s.ball) ??
                  BALLS.find((b) => b.id === s.ball)
                : undefined
            }
          />
        ))}
      </div>

      <div
        style={{
          padding: "14px 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <PrimaryButton variant="outline" onClick={onFinishHole}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path
              d="M3 7l3 3 5-6"
              stroke={INK}
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Finish hole
        </PrimaryButton>
        <PrimaryButton onClick={onOpenShoot}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path
              d="M2 7h9m-3-4l4 4-4 4"
              stroke={PAPER}
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Shoot · shot {shots.length + 1}
        </PrimaryButton>
      </div>
      <div
        style={{
          padding: "8px 20px 0",
          fontSize: 11,
          color: "rgba(26,38,32,0.5)",
          textAlign: "center",
        }}
      >
        Tap to start the next shot. We measure the previous one automatically.
      </div>

      <Hairline style={{ margin: "20px 0 0" }} />

      <div style={{ padding: "4px 0 16px" }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "rgba(26,38,32,0.5)",
            fontWeight: 500,
            padding: "14px 20px 0",
          }}
        >
          Round stats · {totalHoles}-hole
        </div>
        <StatsGlance round={round} />
        <ScoringGlance scoring={scoring} handicap={handicap} />
      </div>

      <div style={{ height: 56 }} />
    </div>
  );
}

function CourseScreen({
  onPick,
  onMenu,
  resume,
}: {
  onPick: (id: string) => void;
  onMenu: () => void;
  resume: {
    courseName: string;
    currentHole: number;
    totalHoles: number;
    strokes: number;
    onResume: () => void;
  } | null;
}) {
  return (
    <div
      className="no-scrollbar"
      style={{ height: "100%", overflow: "auto", background: PAPER }}
    >
      <div
        style={{
          padding: "20px 20px 8px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(26,38,32,0.5)",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            {resume ? "Welcome back" : "Start a round"}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: -0.6,
              color: INK,
            }}
          >
            {resume ? "Continue or choose course" : "Choose course"}
          </div>
        </div>
        <button
          aria-label="Open menu"
          onClick={onMenu}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 0,
            background: "rgba(26,38,32,0.06)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <svg width="14" height="12" viewBox="0 0 14 12">
            <path d="M0 1h14M0 6h14M0 11h14" stroke={INK} strokeWidth="1.2" />
          </svg>
        </button>
      </div>

      {resume && (
        <div style={{ padding: "12px 16px 6px" }}>
          <button
            onClick={resume.onResume}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "16px 18px",
              border: 0,
              borderRadius: 14,
              background: INK,
              color: PAPER,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(242,239,232,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path
                  d="M3 2v10l8-5z"
                  fill={PAPER}
                />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.65, letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 500 }}>
                Resume round
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, marginTop: 2 }}>
                {resume.courseName}
                <span style={{ opacity: 0.6, fontWeight: 400 }}>
                  {" "}· {resume.totalHoles} holes
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  marginTop: 2,
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                }}
              >
                Hole {resume.currentHole} of {resume.totalHoles} ·{" "}
                {resume.strokes} stroke{resume.strokes === 1 ? "" : "s"}
              </div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14">
              <path d="M1 1l6 6-6 6" stroke={PAPER} strokeWidth="1.4" fill="none" />
            </svg>
          </button>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "rgba(26,38,32,0.4)",
              fontWeight: 500,
              padding: "16px 4px 4px",
            }}
          >
            Or start a new round
          </div>
        </div>
      )}

      {(() => {
        const list = getCourseList();
        const singles = list.filter((c) => c.holes === 9);
        const combos = list.filter((c) => c.holes === 18);
        const renderGroup = (label: string, list: typeof singles) => (
          <div style={{ padding: "12px 16px 4px" }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "rgba(26,38,32,0.5)",
                fontWeight: 500,
                padding: "10px 4px 6px",
              }}
            >
              {label}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {list.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => onPick(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 12px",
                    borderTop:
                      i === 0 ? "1px solid rgba(26,38,32,0.1)" : "none",
                    borderBottom: "1px solid rgba(26,38,32,0.1)",
                    background: "transparent",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 500,
                        color: INK,
                        letterSpacing: -0.2,
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(26,38,32,0.55)",
                        marginTop: 2,
                        fontFamily:
                          "var(--font-geist-mono), ui-monospace, monospace",
                      }}
                    >
                      {c.region} · par {c.par} · {c.holes} holes
                    </div>
                  </div>
                  <svg width="8" height="14" viewBox="0 0 8 14">
                    <path
                      d="M1 1l6 6-6 6"
                      stroke="rgba(26,38,32,0.4)"
                      strokeWidth="1.2"
                      fill="none"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        );
        return (
          <>
            {renderGroup("9-hole courses", singles)}
            {renderGroup("18-hole combinations", combos)}
          </>
        );
      })()}
    </div>
  );
}

function TeeScreen({
  courseId,
  onPick,
  onBack,
}: {
  courseId: string | null;
  onPick: (id: TeeId) => void;
  onBack: () => void;
}) {
  const course = getCourse(courseId ?? "puisto");
  const headline = `${course.name} · ${course.holes.length} holes`;
  return (
    <div
      className="no-scrollbar"
      style={{ height: "100%", overflow: "auto", background: PAPER }}
    >
      <div style={{ padding: "20px 20px 8px" }}>
        <button
          onClick={onBack}
          style={{
            border: 0,
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            fontSize: 13,
            color: "rgba(26,38,32,0.55)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 12,
          }}
        >
          <svg width="6" height="11" viewBox="0 0 6 11">
            <path d="M5 1L1 5.5 5 10" stroke="currentColor" strokeWidth="1.3" fill="none" />
          </svg>
          Courses
        </button>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "rgba(26,38,32,0.5)",
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: -0.6,
            color: INK,
          }}
        >
          Choose tee
        </div>
      </div>

      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {course.tees.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 18px",
              background: "#FFFFFF",
              border: "1px solid rgba(26,38,32,0.08)",
              borderRadius: 14,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: t.color,
                border: "1px solid rgba(26,38,32,0.2)",
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: INK }}>
                {t.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(26,38,32,0.55)",
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  marginTop: 2,
                }}
              >
                {t.total} m · CR {course.rating} · SR {course.slope}
              </div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14">
              <path
                d="M1 1l6 6-6 6"
                stroke="rgba(26,38,32,0.4)"
                strokeWidth="1.2"
                fill="none"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function MenuItem({
  label,
  badge,
  onClick,
  active,
}: {
  label: string;
  badge?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "14px 24px",
        border: 0,
        background: active ? "rgba(26,38,32,0.05)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 16, color: INK, fontWeight: 500 }}>{label}</span>
      {badge && (
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            color: "rgba(26,38,32,0.6)",
            padding: "4px 8px",
            borderRadius: 6,
            background: "rgba(26,38,32,0.06)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function MenuDrawer({
  open,
  onClose,
  onNav,
  currentHole,
  totalHoles,
  roundActive,
  userEmail,
  handicap,
  history,
}: {
  open: boolean;
  onClose: () => void;
  onNav: (s: Screen) => void;
  currentHole: number;
  totalHoles: number;
  roundActive: boolean;
  userEmail: string | null;
  handicap: number | null;
  history: RoundSummary[];
}) {
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200 }}>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(26,38,32,0.4)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "78%",
          maxWidth: 420,
          background: PAPER,
          boxShadow: "-20px 0 40px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "32px 24px 8px" }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(26,38,32,0.5)",
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {userEmail ?? "Signed out"}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: -0.5,
              color: INK,
            }}
          >
            {handicap != null ? `HCP ${handicap.toFixed(1)}` : "HCP —"}
          </div>
        </div>

        <div style={{ padding: "20px 0", flex: 1, overflow: "auto" }}>
          {roundActive && (
            <MenuItem
              label="Round in progress"
              badge={`Hole ${currentHole}/${totalHoles}`}
              onClick={() => onNav("round")}
              active
            />
          )}
          <MenuItem label="Courses" onClick={() => onNav("course")} />
          <a
            href="/account"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "14px 24px",
              color: INK,
              fontSize: 16,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Account
          </a>
          <Hairline style={{ margin: "12px 24px" }} />
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(26,38,32,0.5)",
              fontWeight: 500,
              padding: "6px 24px 10px",
            }}
          >
            History
          </div>
          {history.length === 0 && (
            <div
              style={{
                padding: "12px 24px",
                fontSize: 13,
                color: "rgba(26,38,32,0.5)",
              }}
            >
              No completed rounds yet.
            </div>
          )}
          {history.map((r) => {
            const course = getCourse(r.courseId);
            const dateLabel = new Date(r.startedAt).toLocaleDateString(
              undefined,
              { month: "short", day: "numeric" },
            );
            const toParStr =
              r.toPar === 0 ? "E" : r.toPar > 0 ? `+${r.toPar}` : `${r.toPar}`;
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 24px",
                  borderBottom: "1px solid rgba(26,38,32,0.06)",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, color: INK, fontWeight: 500 }}>
                    {course.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(26,38,32,0.5)",
                      marginTop: 2,
                      fontFamily:
                        "var(--font-geist-mono), ui-monospace, monospace",
                    }}
                  >
                    {dateLabel} · {r.teeId} · {r.fairwaysHit}/{r.fairwayEligible}{" "}
                    fwy · {r.girHit}/{r.holesPlayed} gir
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily:
                        "var(--font-geist-mono), ui-monospace, monospace",
                      fontSize: 17,
                      fontWeight: 500,
                      color: INK,
                    }}
                  >
                    {r.totalScore}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily:
                        "var(--font-geist-mono), ui-monospace, monospace",
                      color: r.toPar > 0 ? BRICK : MOSS,
                    }}
                  >
                    {toParStr}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          aria-label="Close menu"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 24,
            right: 18,
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 0,
            background: "rgba(26,38,32,0.06)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" stroke={INK} strokeWidth="1.3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function GolfApp() {
  const { user } = useUser();
  const [screen, setScreen] = useState<Screen>("course");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [roundActive, setRoundActive] = useState(false);
  const [round, setRound] = useState<Round>(() =>
    makeEmptyRound("puisto", "white"),
  );
  const [roundDbId, setRoundDbId] = useState<string | null>(null);
  const [clubs, setClubs] = useState<Club[]>(CLUBS);
  const [balls, setBalls] = useState<Ball[]>(BALLS);
  const [history, setHistory] = useState<RoundSummary[]>([]);
  const [handicap, setHandicap] = useState<number | null>(null);
  const [coursesVersion, setCoursesVersion] = useState(0);
  const geo = useGeolocation();

  // Load shared course catalog (public read; falls back to static when unconfigured)
  useEffect(() => {
    let cancelled = false;
    fetchAllCourses()
      .then((cs) => {
        if (cancelled) return;
        installCourses(cs);
        setCoursesVersion((v) => v + 1);
      })
      .catch((e) => console.error("fetchAllCourses", e));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load user-scoped data on auth
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchUserClubs(user.id)
      .then((cs) => !cancelled && cs.length > 0 && setClubs(cs))
      .catch((e) => console.error("fetchUserClubs", e));
    fetchUserBalls(user.id)
      .then((bs) => !cancelled && bs.length > 0 && setBalls(bs))
      .catch((e) => console.error("fetchUserBalls", e));
    fetchActiveRound(user.id)
      .then((r) => {
        if (cancelled || !r) return;
        setRound(r.round);
        setRoundDbId(r.id);
        setRoundActive(true);
        setCourseId(r.round.courseId);
      })
      .catch((e) => console.error("fetchActiveRound", e));
    fetchRoundHistory(user.id, 10)
      .then((h) => !cancelled && setHistory(h))
      .catch((e) => console.error("fetchRoundHistory", e));
    fetchProfile(user.id)
      .then((p) => !cancelled && setHandicap(p?.handicap ?? null))
      .catch((e) => console.error("fetchProfile", e));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const goto = (s: Screen) => {
    setScreen(s);
    setMenuOpen(false);
  };

  const inFlight = useMemo(
    () => round.currentShots.find((s) => s.status === "in_flight"),
    [round.currentShots],
  );

  function snapshotFix(): ShotPosition | undefined {
    const p = geo.positionRef.current;
    if (!p) return undefined;
    return { lat: p.lat, lng: p.lng, accuracy: p.accuracy };
  }

  function clubCarry(clubId: string): number {
    return (
      clubs.find((c) => c.id === clubId)?.carry ??
      CLUBS.find((c) => c.id === clubId)?.carry ??
      100
    );
  }

  function takeShot({ club, ball, lie }: { club: string; ball: string; lie: string }) {
    const fix = snapshotFix();
    let updatedShots: Shot[] = [];
    let prevInFlight: Shot | null = null;
    let newShot: Shot | null = null;
    let holeNumber = 1;
    setRound((prev) => {
      holeNumber = prev.currentHole;
      const shots = [...prev.currentShots];
      const inFlightIdx = shots.findIndex((s) => s.status === "in_flight");
      if (inFlightIdx >= 0) {
        const prevShot = shots[inFlightIdx];
        let dist: number;
        let measured = false;
        if (prevShot.position && fix) {
          dist = Math.round(haversine(prevShot.position, fix));
          measured = true;
        } else {
          dist = clubCarry(prevShot.club);
        }
        shots[inFlightIdx] = {
          ...prevShot,
          status: "done",
          result: "in_play",
          dist,
          measured,
        };
        prevInFlight = shots[inFlightIdx];
      }
      newShot = {
        n: shots.length + 1,
        club,
        ball,
        startLie: lie as Shot["startLie"],
        status: "in_flight",
        result: null,
        dist: null,
        position: fix,
      };
      shots.push(newShot);
      updatedShots = shots;
      return { ...prev, ball, currentShots: shots };
    });
    setSheetOpen(false);

    if (roundDbId) {
      if (prevInFlight) upsertShot(roundDbId, holeNumber, prevInFlight).catch(console.error);
      if (newShot) upsertShot(roundDbId, holeNumber, newShot).catch(console.error);
      updateRound(roundDbId, { ball }).catch(console.error);
    }
    void updatedShots;
  }

  function markResult(result: Exclude<ShotResult, "in_play">) {
    let updated: Shot | null = null;
    let holeNumber = 1;
    setRound((prev) => {
      holeNumber = prev.currentHole;
      const shots = [...prev.currentShots];
      const inFlightIdx = shots.findIndex((s) => s.status === "in_flight");
      if (inFlightIdx >= 0) {
        shots[inFlightIdx] = {
          ...shots[inFlightIdx],
          status: "done",
          result,
          dist: 0,
        };
        updated = shots[inFlightIdx];
      }
      return { ...prev, currentShots: shots };
    });
    setSheetOpen(false);
    if (roundDbId && updated) {
      upsertShot(roundDbId, holeNumber, updated).catch(console.error);
    }
  }

  function finishHole() {
    const fix = snapshotFix();
    let finishedHole = 1;
    let nextHole = 1;
    let totalShots: number | undefined;
    let par = 4;
    let finishedShots: Shot[] = [];
    let isLastHole = false;
    setRound((prev) => {
      const course = getCourse(prev.courseId);
      const courseHoles = course.holes.length;
      const pin = greenLatLng(prev.courseId, prev.currentHole);
      par = course.holes[prev.currentHole - 1].par;
      const shots = prev.currentShots.map((s) => {
        if (s.status !== "in_flight") return s;
        let dist: number;
        let measured = false;
        if (s.position && fix) {
          dist = Math.round(haversine(s.position, fix));
          measured = true;
        } else if (s.position) {
          dist = Math.round(haversine(s.position, pin));
          measured = true;
        } else {
          dist = clubCarry(s.club);
        }
        return {
          ...s,
          status: "done" as const,
          result: "in_play" as const,
          dist,
          measured,
        };
      });
      totalShots = shots.length || undefined;
      finishedShots = shots;
      finishedHole = prev.currentHole;
      const scores = [...prev.scores];
      scores[prev.currentHole - 1] = totalShots;
      nextHole = Math.min(courseHoles, prev.currentHole + 1);
      isLastHole = prev.currentHole >= courseHoles;
      return {
        ...prev,
        scores,
        currentShots: [],
        currentHole: nextHole,
      };
    });

    if (roundDbId) {
      upsertRoundHole(roundDbId, finishedHole, par, { score: totalShots ?? null })
        .catch(console.error);
      finishedShots.forEach((s) =>
        upsertShot(roundDbId, finishedHole, s).catch(console.error),
      );
      if (isLastHole) {
        updateRound(roundDbId, {
          status: "completed",
          finishedAt: new Date().toISOString(),
          currentHole: finishedHole,
        }).catch(console.error);
        setRoundActive(false);
        setRoundDbId(null);
        if (user) {
          fetchRoundHistory(user.id, 10)
            .then(setHistory)
            .catch(console.error);
        }
      } else {
        updateRound(roundDbId, { currentHole: nextHole }).catch(console.error);
      }
    }
  }

  const activeCourseName = getCourse(round.courseId).name;
  const activeStrokes = round.scores.reduce<number>(
    (s, v) => s + (v || 0),
    0,
  ) + round.currentShots.filter((s) => s.status === "done").length;

  function startRound(newCourseId: string, teeId: TeeId) {
    const fresh = makeEmptyRound(newCourseId, teeId);
    setRound(fresh);
    setRoundActive(true);
    setScreen("round");
    setMenuOpen(false);
    if (user) {
      createRound(user.id, newCourseId, teeId, fresh.ball)
        .then((id) => setRoundDbId(id))
        .catch(console.error);
    }
  }

  function handleCoursePick(id: string) {
    if (roundActive) {
      const ok = window.confirm(
        "Starting a new round will discard the round in progress. Continue?",
      );
      if (!ok) return;
      if (roundDbId) {
        updateRound(roundDbId, { status: "abandoned" }).catch(console.error);
        setRoundDbId(null);
      }
    }
    setCourseId(id);
    goto("tee");
  }

  let body: React.ReactNode;
  if (screen === "course") {
    body = (
      <CourseScreen
        onPick={handleCoursePick}
        onMenu={() => setMenuOpen(true)}
        resume={
          roundActive
            ? {
                courseName: activeCourseName,
                currentHole: round.currentHole,
                totalHoles: getCourse(round.courseId).holes.length,
                strokes: activeStrokes,
                onResume: () => goto("round"),
              }
            : null
        }
      />
    );
  } else if (screen === "tee") {
    body = (
      <TeeScreen
        courseId={courseId}
        onPick={(teeId) => startRound(courseId ?? "puisto", teeId)}
        onBack={() => goto("course")}
      />
    );
  } else {
    body = (
      <RoundScreen
        round={round}
        geo={geo}
        clubs={clubs}
        balls={balls}
        handicap={handicap}
        onMenu={() => setMenuOpen(true)}
        onOpenShoot={() => setSheetOpen(true)}
        onFinishHole={finishHole}
      />
    );
  }

  return (
    <div className="golf-stage">
      <div className="golf-phone">
        <div
          style={{
            position: "relative",
            height: "100%",
            background: PAPER,
            overflow: "hidden",
          }}
        >
          {body}
          <MenuDrawer
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onNav={goto}
            currentHole={round.currentHole}
            totalHoles={getCourse(round.courseId).holes.length}
            roundActive={roundActive}
            userEmail={user?.email ?? null}
            handicap={handicap}
            history={history}
          />
          <Sheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title={`Shoot · hole ${round.currentHole}`}
          >
            <ShootSheet
              shotN={round.currentShots.length + 1}
              inFlight={inFlight}
              defaultBall={round.ball}
              clubs={clubs}
              balls={balls}
              onShoot={takeShot}
              onMark={markResult}
              onClose={() => setSheetOpen(false)}
            />
          </Sheet>
        </div>
      </div>
      <style jsx>{`
        .golf-stage {
          width: 100vw;
          min-height: 100dvh;
          display: flex;
          align-items: stretch;
          justify-content: center;
          background: var(--stage);
        }
        .golf-phone {
          width: 100%;
          min-height: 100dvh;
          background: var(--paper);
          position: relative;
        }
        @media (min-width: 480px) {
          .golf-stage {
            align-items: center;
            padding: 24px 0;
          }
          .golf-phone {
            width: 402px;
            min-height: 0;
            height: 874px;
            border-radius: 36px;
            box-shadow: 0 30px 80px rgba(26, 38, 32, 0.18),
              0 2px 0 rgba(26, 38, 32, 0.04) inset;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}
