"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Course, TeeId } from "../../data";
import { useUser } from "../../lib/db/auth";
import {
  fetchAllCourses,
  updateCourseHoleMeta,
  updateCourseMeta,
  updateCourseTeeMeta,
} from "../../lib/db/courses";

const INK = "#1A2620";
const MOSS = "#3F5B47";
const PAPER = "#F2EFE8";
const BRICK = "#A8584B";

function H({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: "rgba(26,38,32,0.5)",
        fontWeight: 500,
        margin: "24px 0 10px",
      }}
    >
      {label}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flex: 1,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "rgba(26,38,32,0.55)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function NumInput({
  value,
  onCommit,
  step = "1",
  min,
  max,
  width,
}: {
  value: number;
  onCommit: (n: number) => void;
  step?: string;
  min?: number;
  max?: number;
  width?: number;
}) {
  // Uncontrolled: a key on `value` remounts when external state changes so
  // the input picks up new defaults without clobbering in-progress typing.
  return (
    <input
      key={String(value)}
      type="number"
      inputMode={step === "1" ? "numeric" : "decimal"}
      step={step}
      min={min}
      max={max}
      defaultValue={String(value)}
      onBlur={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n) && n !== value) onCommit(n);
        else e.target.value = String(value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      style={{
        width: width ?? "100%",
        height: 38,
        borderRadius: 8,
        border: "1px solid rgba(26,38,32,0.18)",
        background: "#fff",
        padding: "0 10px",
        fontSize: 14,
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        color: INK,
        textAlign: "right",
        boxSizing: "border-box",
      }}
    />
  );
}

export default function CoursesEditorClient() {
  const { user, loading } = useUser();
  const [coursesById, setCoursesById] = useState<Record<string, Course>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(0);
  const savedRef = useRef(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllCourses()
      .then((cs) => {
        if (cancelled) return;
        setCoursesById(cs);
        const firstSingle = Object.values(cs)
          .filter((c) => !c.comboParts && c.holes.length === 9)
          .sort((a, b) => a.id.localeCompare(b.id))[0];
        setSelectedId(firstSingle?.id ?? null);
      })
      .catch((e) => setErr(String((e as Error).message ?? e)));
    return () => {
      cancelled = true;
    };
  }, []);

  function flashSaved() {
    const t = ++savedRef.current;
    setSavedTick(t);
    setTimeout(
      () => setSavedTick((cur) => (cur === t ? 0 : cur)),
      1300,
    );
  }

  const singles = useMemo(
    () =>
      Object.values(coursesById)
        .filter((c) => !c.comboParts && c.holes.length === 9)
        .sort((a, b) => a.id.localeCompare(b.id)),
    [coursesById],
  );

  const course = selectedId ? coursesById[selectedId] : null;

  function patchLocal(next: Course) {
    setCoursesById((prev) => ({ ...prev, [next.id]: next }));
  }

  async function onCourseField(
    patch: Partial<Pick<Course, "name" | "region" | "par" | "rating" | "slope">>,
  ) {
    if (!course) return;
    const next = { ...course, ...patch };
    patchLocal(next);
    try {
      await updateCourseMeta(course.id, patch);
      flashSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  async function onTeeField(
    teeId: TeeId,
    patch: { rating?: number; slope?: number; par?: number },
  ) {
    if (!course) return;
    const next = {
      ...course,
      tees: course.tees.map((t) => (t.id === teeId ? { ...t, ...patch } : t)),
    };
    patchLocal(next);
    try {
      await updateCourseTeeMeta(course.id, teeId, patch);
      flashSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  async function onHoleField(
    holeNumber: number,
    patch: {
      par?: number;
      strokeIndex?: number;
      white_m?: number;
      yellow_m?: number;
      red_m?: number;
    },
  ) {
    if (!course) return;
    const idx = holeNumber - 1;
    const nextHoles = course.holes.map((h, i) => {
      if (i !== idx) return h;
      const m = { ...h.m };
      if (patch.white_m != null) m.white = patch.white_m;
      if (patch.yellow_m != null) m.yellow = patch.yellow_m;
      if (patch.red_m != null) m.red = patch.red_m;
      return {
        ...h,
        par: patch.par ?? h.par,
        strokeIndex: patch.strokeIndex ?? h.strokeIndex,
        m,
      };
    });
    patchLocal({ ...course, holes: nextHoles });
    try {
      await updateCourseHoleMeta(course.id, holeNumber, patch);
      flashSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  if (loading) {
    return <div style={{ padding: 24, color: INK }}>Loading…</div>;
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: PAPER,
        padding: "20px 20px 80px",
        color: INK,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: "rgba(26,38,32,0.55)",
            textDecoration: "none",
          }}
        >
          ← Round
        </Link>
        <Link
          href="/account"
          style={{
            fontSize: 13,
            color: "rgba(26,38,32,0.55)",
            textDecoration: "none",
          }}
        >
          Account
        </Link>
      </div>

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
        Course catalog
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>
        Edit courses
      </div>

      {!user && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(168,88,75,0.1)",
            color: BRICK,
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          Sign in to save changes — edits won&rsquo;t persist until you do.
        </div>
      )}
      {err && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(168,88,75,0.1)",
            color: BRICK,
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {err}
        </div>
      )}
      {savedTick > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: INK,
            color: PAPER,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 12,
            letterSpacing: 0.4,
            zIndex: 50,
          }}
        >
          Saved
        </div>
      )}

      {singles.length === 0 && (
        <div
          style={{
            padding: "20px 0",
            color: "rgba(26,38,32,0.55)",
            fontSize: 14,
          }}
        >
          No courses found.
        </div>
      )}

      {singles.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            margin: "20px 0 4px",
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {singles.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border:
                  selectedId === c.id
                    ? `1px solid ${INK}`
                    : "1px solid rgba(26,38,32,0.18)",
                background: selectedId === c.id ? INK : "transparent",
                color: selectedId === c.id ? PAPER : INK,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {course && (
        <>
          <H label="Course" />
          <div style={{ display: "flex", gap: 8 }}>
            <Field label="Name">
              <input
                key={`${course.id}-name-${course.name}`}
                type="text"
                defaultValue={course.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== course.name) onCourseField({ name: v });
                }}
                style={{
                  height: 38,
                  borderRadius: 8,
                  border: "1px solid rgba(26,38,32,0.18)",
                  background: "#fff",
                  padding: "0 10px",
                  fontSize: 14,
                  color: INK,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </Field>
            <Field label="Region">
              <input
                key={`${course.id}-region-${course.region}`}
                type="text"
                defaultValue={course.region}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== course.region) onCourseField({ region: v });
                }}
                style={{
                  height: 38,
                  borderRadius: 8,
                  border: "1px solid rgba(26,38,32,0.18)",
                  background: "#fff",
                  padding: "0 10px",
                  fontSize: 14,
                  color: INK,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </Field>
          </div>

          <H label="Tees" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr 1fr 1fr",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div />
            <div
              style={{
                fontSize: 10,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "rgba(26,38,32,0.55)",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              CR
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "rgba(26,38,32,0.55)",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              Slope
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "rgba(26,38,32,0.55)",
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              Par
            </div>
            {course.tees.map((t) => (
              <TeeRow
                key={t.id}
                color={t.color}
                label={t.label}
                total={t.total}
                rating={t.rating}
                slope={t.slope}
                par={t.par}
                onRating={(n) => onTeeField(t.id, { rating: n })}
                onSlope={(n) => onTeeField(t.id, { slope: n })}
                onPar={(n) => onTeeField(t.id, { par: n })}
              />
            ))}
          </div>

          <H label={`Holes · ${course.holes.length}`} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "28px 56px 56px 64px 64px 64px",
              gap: 6,
              alignItems: "center",
            }}
          >
            <HoleHeader label="#" />
            <HoleHeader label="Par" />
            <HoleHeader label="SI" />
            <HoleHeader label="White" />
            <HoleHeader label="Yellow" />
            <HoleHeader label="Red" />
            {course.holes.map((h) => (
              <HoleEditorRow
                key={h.n}
                n={h.n}
                par={h.par}
                strokeIndex={h.strokeIndex}
                whiteM={h.m.white}
                yellowM={h.m.yellow}
                redM={h.m.red}
                onChange={(patch) => onHoleField(h.n, patch)}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 12,
              color: "rgba(26,38,32,0.55)",
              lineHeight: 1.5,
            }}
          >
            Combos derive from singles — edit the single course and the combos
            update next time the app loads. Course par equals the sum of hole
            pars and is shown on the tee picker. CR ·{" "}
            <span style={{ color: MOSS, fontWeight: 500 }}>
              Course Rating
            </span>{" "}
            and Slope are stored per tee.
          </div>
        </>
      )}
    </div>
  );
}

function HoleHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "rgba(26,38,32,0.55)",
        fontWeight: 500,
        textAlign: "right",
      }}
    >
      {label}
    </div>
  );
}

function TeeRow({
  color,
  label,
  total,
  rating,
  slope,
  par,
  onRating,
  onSlope,
  onPar,
}: {
  color: string;
  label: string;
  total: number;
  rating: number;
  slope: number;
  par: number;
  onRating: (n: number) => void;
  onSlope: (n: number) => void;
  onPar: (n: number) => void;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: 4,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: color,
            border: "1px solid rgba(26,38,32,0.2)",
          }}
        />
        <div style={{ fontSize: 14, color: INK }}>
          {label}
          <span
            style={{
              fontSize: 11,
              color: "rgba(26,38,32,0.5)",
              marginLeft: 6,
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            }}
          >
            {total} m
          </span>
        </div>
      </div>
      <NumInput value={rating} step="0.1" min={50} max={85} onCommit={onRating} />
      <NumInput value={slope} step="1" min={55} max={155} onCommit={onSlope} />
      <NumInput value={par} step="1" min={27} max={80} onCommit={onPar} />
    </>
  );
}

function HoleEditorRow({
  n,
  par,
  strokeIndex,
  whiteM,
  yellowM,
  redM,
  onChange,
}: {
  n: number;
  par: number;
  strokeIndex: number;
  whiteM: number;
  yellowM: number;
  redM: number;
  onChange: (patch: {
    par?: number;
    strokeIndex?: number;
    white_m?: number;
    yellow_m?: number;
    red_m?: number;
  }) => void;
}) {
  return (
    <>
      <div
        style={{
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontSize: 12,
          color: "rgba(26,38,32,0.55)",
          textAlign: "right",
          paddingRight: 4,
        }}
      >
        {String(n).padStart(2, "0")}
      </div>
      <NumInput value={par} min={3} max={6} onCommit={(v) => onChange({ par: v })} />
      <NumInput
        value={strokeIndex}
        min={1}
        max={18}
        onCommit={(v) => onChange({ strokeIndex: v })}
      />
      <NumInput
        value={whiteM}
        min={50}
        max={700}
        onCommit={(v) => onChange({ white_m: v })}
      />
      <NumInput
        value={yellowM}
        min={50}
        max={700}
        onCommit={(v) => onChange({ yellow_m: v })}
      />
      <NumInput
        value={redM}
        min={50}
        max={700}
        onCommit={(v) => onChange({ red_m: v })}
      />
    </>
  );
}
