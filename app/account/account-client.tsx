"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Ball, Club } from "../data";
import { useUser } from "../lib/db/auth";
import { fetchUserBalls, setBallEnabled, upsertBall } from "../lib/db/balls";
import { fetchUserClubs, setClubEnabled, updateClubCarry } from "../lib/db/clubs";
import { fetchProfile, type Profile, updateProfile } from "../lib/db/profile";

const INK = "#1A2620";
const PAPER = "#F2EFE8";
const MOSS = "#3F5B47";

function H({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: "rgba(26,38,32,0.5)",
        fontWeight: 500,
        margin: "20px 0 10px",
      }}
    >
      {label}
    </div>
  );
}

export default function AccountClient() {
  const { user, loading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<(Club & { enabled: boolean })[]>([]);
  const [balls, setBalls] = useState<(Ball & { enabled: boolean })[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      fetchProfile(user.id),
      fetchUserClubs(user.id).then((cs) =>
        cs.map((c) => ({ ...c, enabled: true })),
      ),
      fetchUserBalls(user.id).then((bs) =>
        bs.map((b) => ({ ...b, enabled: true })),
      ),
    ])
      .then(([p, c, b]) => {
        if (cancelled) return;
        setProfile(p);
        setClubs(c);
        setBalls(b);
      })
      .catch((e) => !cancelled && setErr(String(e.message ?? e)));
    return () => {
      cancelled = true;
    };
  }, [user]);

  function flashSaved() {
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt((t) => (t && Date.now() - t > 1200 ? null : t)), 1300);
  }

  async function onProfileChange(patch: Partial<Profile>) {
    if (!user || !profile) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    try {
      await updateProfile(user.id, {
        displayName: next.displayName,
        handicap: next.handicap,
        defaultBall: next.defaultBall,
      });
      flashSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  async function onCarryChange(clubId: string, carry: number) {
    if (!user) return;
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, carry } : c)),
    );
    try {
      await updateClubCarry(user.id, clubId, carry);
      flashSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  async function onClubToggle(clubId: string, enabled: boolean) {
    if (!user) return;
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, enabled } : c)),
    );
    try {
      await setClubEnabled(user.id, clubId, enabled);
      flashSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  async function onBallToggle(ballId: string, enabled: boolean) {
    if (!user) return;
    setBalls((prev) =>
      prev.map((b) => (b.id === ballId ? { ...b, enabled } : b)),
    );
    try {
      await setBallEnabled(user.id, ballId, enabled);
      flashSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  async function onAddBall(label: string) {
    if (!user || !label.trim()) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
    const position = balls.length;
    setBalls((prev) => [...prev, { id, label, enabled: true }]);
    try {
      await upsertBall(user.id, id, label.trim(), position);
      flashSaved();
    } catch (e) {
      setErr(String((e as Error).message));
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: INK }}>Loading…</div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: PAPER,
        padding: "20px 20px 60px",
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
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            style={{
              border: 0,
              background: "transparent",
              color: "rgba(26,38,32,0.55)",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Sign out
          </button>
        </form>
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
        {user?.email}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>
        Account
      </div>

      {err && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(168,88,75,0.1)",
            color: "#A8584B",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {err}
        </div>
      )}
      {savedAt && (
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
          }}
        >
          Saved
        </div>
      )}

      <H label="Profile" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(26,38,32,0.55)" }}>
            Display name
          </span>
          <input
            type="text"
            value={profile?.displayName ?? ""}
            onChange={(e) => onProfileChange({ displayName: e.target.value })}
            placeholder="Linnea Holm"
            style={{
              height: 44,
              borderRadius: 10,
              border: "1px solid rgba(26,38,32,0.18)",
              background: "#fff",
              padding: "0 12px",
              fontSize: 14,
              color: INK,
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, color: "rgba(26,38,32,0.55)" }}>
            Handicap
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={-10}
            max={54}
            value={profile?.handicap ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              onProfileChange({ handicap: v === "" ? null : Number(v) });
            }}
            placeholder="14.6"
            style={{
              height: 44,
              borderRadius: 10,
              border: "1px solid rgba(26,38,32,0.18)",
              background: "#fff",
              padding: "0 12px",
              fontSize: 14,
              color: INK,
            }}
          />
        </label>
      </div>

      <H label="Clubs · default carry (m)" />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {clubs.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: "1px solid rgba(26,38,32,0.06)",
              opacity: c.enabled ? 1 : 0.45,
            }}
          >
            <input
              type="checkbox"
              checked={c.enabled}
              onChange={(e) => onClubToggle(c.id, e.target.checked)}
              style={{ width: 18, height: 18, accentColor: MOSS }}
            />
            <div style={{ flex: 1, fontSize: 15 }}>{c.label}</div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={350}
              value={c.carry}
              onChange={(e) => onCarryChange(c.id, Number(e.target.value || 0))}
              style={{
                width: 80,
                height: 36,
                borderRadius: 8,
                border: "1px solid rgba(26,38,32,0.18)",
                background: "#fff",
                padding: "0 10px",
                fontSize: 14,
                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                textAlign: "right",
                color: INK,
              }}
            />
            <span
              style={{
                fontSize: 11,
                color: "rgba(26,38,32,0.5)",
                width: 14,
              }}
            >
              m
            </span>
          </div>
        ))}
      </div>

      <H label="Balls" />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {balls.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid rgba(26,38,32,0.06)",
              opacity: b.enabled || b.id === "none" ? 1 : 0.45,
            }}
          >
            <input
              type="checkbox"
              checked={b.enabled}
              disabled={b.id === "none"}
              onChange={(e) => onBallToggle(b.id, e.target.checked)}
              style={{ width: 18, height: 18, accentColor: MOSS }}
            />
            <div style={{ flex: 1, fontSize: 15 }}>{b.label}</div>
          </div>
        ))}
        <AddBallRow onAdd={onAddBall} />
      </div>
    </div>
  );
}

function AddBallRow({ onAdd }: { onAdd: (label: string) => Promise<void> }) {
  const [val, setVal] = useState("");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
      }}
    >
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add a ball (e.g. Bridgestone Tour B)"
        style={{
          flex: 1,
          height: 36,
          borderRadius: 8,
          border: "1px solid rgba(26,38,32,0.18)",
          background: "#fff",
          padding: "0 10px",
          fontSize: 14,
          color: INK,
        }}
      />
      <button
        type="button"
        onClick={async () => {
          if (!val.trim()) return;
          await onAdd(val);
          setVal("");
        }}
        style={{
          height: 36,
          padding: "0 14px",
          borderRadius: 8,
          border: 0,
          background: INK,
          color: PAPER,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        Add
      </button>
    </div>
  );
}
