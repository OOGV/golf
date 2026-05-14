"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Ball, Club, Hole, Round, Shot } from "./data";

const INK = "#1A2620";
const MOSS = "#3F5B47";
const BRICK = "#A8584B";
const PAPER = "#F2EFE8";
const PAPER_TINT = "#EBE6DC";

export function ScoreBadge({
  score,
  par,
  size = 28,
  muted = false,
}: {
  score: number | null | undefined;
  par: number;
  size?: number;
  muted?: boolean;
}) {
  const diff = score == null ? null : score - par;
  const isBirdie = diff != null && diff <= -1;
  const isEagle = diff != null && diff <= -2;
  const isDouble = diff != null && diff >= 2;
  const isBogey = diff === 1;

  const color = isBirdie ? MOSS : isDouble || isBogey ? BRICK : INK;
  const dim = muted ? 0.5 : 1;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: dim,
      }}
    >
      {(isBirdie || isEagle) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px solid ${color}`,
          }}
        />
      )}
      {isEagle && (
        <div
          style={{
            position: "absolute",
            inset: 3,
            borderRadius: "50%",
            border: `1px solid ${color}`,
          }}
        />
      )}
      {(isDouble || isBogey) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: `1px solid ${color}`,
          }}
        />
      )}
      {isDouble && (
        <div
          style={{
            position: "absolute",
            inset: 3,
            border: `1px solid ${color}`,
          }}
        />
      )}
      <span
        style={{
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: size <= 22 ? 11 : 13,
          fontWeight: 500,
          color,
          lineHeight: 1,
        }}
      >
        {score == null ? "–" : score}
      </span>
    </div>
  );
}

export function HoleStrip({
  holes,
  round,
  onSelect,
}: {
  holes: Hole[];
  round: Round;
  onSelect?: (n: number) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${holes.length}, 1fr)`,
        gap: 2,
        padding: "0 16px",
      }}
    >
      {holes.map((h, i) => {
        const score = round.scores[i];
        const isCur = i + 1 === round.currentHole;
        const isPlayed = score != null;
        const diff = isPlayed ? (score as number) - h.par : null;
        const tone = !isPlayed
          ? "rgba(26,38,32,0.18)"
          : (diff as number) < 0
          ? MOSS
          : diff === 0
          ? INK
          : BRICK;
        return (
          <button
            key={i}
            onClick={() => onSelect?.(i + 1)}
            style={{
              border: 0,
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                fontSize: 9,
                fontWeight: 500,
                color: isCur ? INK : "rgba(26,38,32,0.4)",
                lineHeight: 1,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                width: "100%",
                height: 22,
                borderRadius: 2,
                background: isPlayed ? tone : "transparent",
                border: isCur
                  ? `1px solid ${INK}`
                  : isPlayed
                  ? "none"
                  : "1px solid rgba(26,38,32,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              {isPlayed && (
                <span
                  style={{
                    fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
                    fontSize: 10,
                    fontWeight: 500,
                    color: PAPER,
                    lineHeight: 1,
                  }}
                >
                  {score}
                </span>
              )}
              {isCur && !isPlayed && (
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: INK,
                  }}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function HoleMap({
  hole,
  shots = [],
  height = 260,
  showTrail = true,
}: {
  hole: Hole;
  shots?: Shot[];
  height?: number;
  showTrail?: boolean;
}) {
  const W = 100;
  const H = 140;
  const fw = hole.fairway
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");

  const lastShot = shots[shots.length - 1];
  const playerPos = lastShot
    ? hole.fairway[Math.min(hole.fairway.length - 2, shots.length)] ||
      hole.fairway[1]
    : null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        background: PAPER_TINT,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <pattern id="rough" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.25" fill="rgba(26,38,32,0.08)" />
          </pattern>
          <pattern id="grass" width="2" height="2" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.15" fill="rgba(63,91,71,0.18)" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#rough)" />

        <path
          d={fw}
          stroke="#D6D2C2"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d={fw}
          stroke="url(#grass)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {(hole.water || []).map((w, i) => (
          <rect
            key={i}
            x={w[0] - w[2] / 2}
            y={w[1] - w[3] / 2}
            width={w[2]}
            height={w[3]}
            rx="3"
            fill="#9EAFB3"
          />
        ))}

        {(hole.bunkers || []).map((b, i) => (
          <ellipse
            key={i}
            cx={b[0]}
            cy={b[1]}
            rx={b[2]}
            ry={b[3]}
            fill="#DCCFAE"
            stroke="#C4B58E"
            strokeWidth="0.4"
          />
        ))}

        <circle
          cx={hole.green[0]}
          cy={hole.green[1]}
          r={hole.green[2]}
          fill="#7E9E83"
        />
        <line
          x1={hole.green[0]}
          y1={hole.green[1]}
          x2={hole.green[0]}
          y2={hole.green[1] - 6}
          stroke={INK}
          strokeWidth="0.5"
        />
        <path
          d={`M ${hole.green[0]} ${hole.green[1] - 6} L ${hole.green[0] + 3.5} ${
            hole.green[1] - 5
          } L ${hole.green[0]} ${hole.green[1] - 4} Z`}
          fill={INK}
        />

        <rect
          x={hole.tee[0] - 3}
          y={hole.tee[1] - 2}
          width="6"
          height="2.5"
          rx="0.5"
          fill={INK}
        />

        {showTrail && shots.length > 0 && (
          <g>
            {[hole.tee, ...hole.fairway.slice(1, shots.length + 1)].map(
              (p, i, arr) => {
                if (i === arr.length - 1) return null;
                const a = arr[i];
                const b = arr[i + 1];
                return (
                  <line
                    key={i}
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    stroke={INK}
                    strokeWidth="0.4"
                    strokeDasharray="1 1.2"
                  />
                );
              }
            )}
            {hole.fairway.slice(1, shots.length + 1).map((p, i) => (
              <circle
                key={i}
                cx={p[0]}
                cy={p[1]}
                r="1.4"
                fill={PAPER}
                stroke={INK}
                strokeWidth="0.5"
              />
            ))}
          </g>
        )}

        {playerPos && (
          <circle
            cx={playerPos[0]}
            cy={playerPos[1]}
            r="3"
            fill="none"
            stroke={INK}
            strokeWidth="0.3"
            strokeDasharray="0.6 0.6"
          />
        )}
      </svg>

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 12,
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: 9,
          color: "rgba(26,38,32,0.65)",
          letterSpacing: 0.5,
        }}
      >
        GREEN
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 12,
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: 9,
          color: "rgba(26,38,32,0.65)",
          letterSpacing: 0.5,
        }}
      >
        TEE
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  mono = true,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.6,
          color: "rgba(26,38,32,0.5)",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: mono
            ? 'var(--font-geist-mono), ui-monospace, monospace'
            : 'var(--font-geist-sans), ui-sans-serif',
          fontSize: 18,
          color: INK,
          fontWeight: 500,
          letterSpacing: -0.2,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 11,
              color: "rgba(26,38,32,0.5)",
              marginLeft: 2,
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function ShotRow({
  shot,
  club,
  ball,
  onTap,
}: {
  shot: Shot;
  club?: Club;
  ball?: Ball;
  onTap?: () => void;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 0",
        borderBottom: "1px solid rgba(26,38,32,0.08)",
        cursor: onTap ? "pointer" : "default",
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: 11,
          color: "rgba(26,38,32,0.45)",
          width: 14,
        }}
      >
        {shot.n}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 15,
          color: INK,
          fontWeight: 500,
        }}
      >
        {club ? club.label : "Shot"}
        {ball && (
          <span
            style={{
              color: "rgba(26,38,32,0.45)",
              fontWeight: 400,
              marginLeft: 6,
            }}
          >
            · {ball.label}
          </span>
        )}
      </div>
      {shot.status === "in_flight" ? (
        <div
          style={{
            fontSize: 10,
            letterSpacing: 0.6,
            color: "rgba(26,38,32,0.55)",
            textTransform: "uppercase",
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            padding: "4px 8px",
            border: "1px dashed rgba(26,38,32,0.3)",
            borderRadius: 4,
          }}
        >
          In flight
        </div>
      ) : shot.result && shot.result !== "in_play" ? (
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.5,
            color: BRICK,
            textTransform: "uppercase",
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          }}
        >
          {shot.result}
        </div>
      ) : shot.dist != null ? (
        <div
          style={{
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            fontSize: 14,
            color: INK,
          }}
        >
          {shot.dist}
          <span
            style={{
              fontSize: 10,
              color: "rgba(26,38,32,0.45)",
              marginLeft: 2,
            }}
          >
            m
          </span>
        </div>
      ) : null}
      <div
        style={{
          fontSize: 11,
          color: "rgba(26,38,32,0.45)",
          textTransform: "capitalize",
          minWidth: 50,
          textAlign: "right",
        }}
      >
        {shot.startLie}
      </div>
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(26,38,32,0.35)",
        }}
      />
      <div
        style={{
          position: "relative",
          background: PAPER,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: "12px 0 36px",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.18)",
          maxHeight: "80%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: "rgba(26,38,32,0.18)",
            margin: "4px auto 14px",
          }}
        />
        {title && (
          <div
            style={{
              padding: "0 22px 12px",
              fontSize: 11,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(26,38,32,0.5)",
              fontWeight: 500,
            }}
          >
            {title}
          </div>
        )}
        <div style={{ overflow: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={onCancel}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(26,38,32,0.45)",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          position: "relative",
          background: PAPER,
          borderRadius: 16,
          padding: "22px 22px 18px",
          maxWidth: 340,
          width: "100%",
          boxShadow: "0 30px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          id="confirm-dialog-title"
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: INK,
            letterSpacing: -0.2,
            marginBottom: 8,
            fontFamily: 'var(--font-geist-sans), ui-sans-serif',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "rgba(26,38,32,0.7)",
            lineHeight: 1.45,
            marginBottom: 20,
          }}
        >
          {message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <PrimaryButton
            variant="outline"
            onClick={onCancel}
            style={{ flex: 1 }}
          >
            {cancelLabel}
          </PrimaryButton>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 12,
              background: destructive ? BRICK : INK,
              color: PAPER,
              border: 0,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: -0.1,
              fontFamily: 'var(--font-geist-sans), ui-sans-serif',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  variant = "solid",
  style = {},
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline" | "ghost";
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    height: 52,
    borderRadius: 12,
    fontFamily: 'var(--font-geist-sans), ui-sans-serif',
    fontSize: 15,
    fontWeight: 500,
    border: 0,
    cursor: "pointer",
    letterSpacing: -0.1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "transform 80ms",
    ...style,
  };
  if (variant === "solid") {
    return (
      <button
        onClick={onClick}
        style={{ ...base, background: INK, color: PAPER }}
      >
        {children}
      </button>
    );
  }
  if (variant === "outline") {
    return (
      <button
        onClick={onClick}
        style={{
          ...base,
          background: "transparent",
          color: INK,
          border: "1px solid rgba(26,38,32,0.2)",
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{ ...base, background: "rgba(26,38,32,0.06)", color: INK }}
    >
      {children}
    </button>
  );
}

export function Hairline({
  inset = 0,
  style = {},
}: {
  inset?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(26,38,32,0.1)",
        margin: `0 ${inset}px`,
        ...style,
      }}
    />
  );
}

export const TOKENS = { INK, MOSS, BRICK, PAPER, PAPER_TINT };
