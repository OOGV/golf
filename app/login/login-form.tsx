"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const INK = "#1A2620";
const PAPER = "#F2EFE8";
const MOSS = "#3F5B47";
const BRICK = "#A8584B";

const initial: LoginState = { ok: false, message: "" };

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initial);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: PAPER,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <form
        action={formAction}
        style={{
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: 18,
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
            Golf scorecard
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: -0.6,
              color: INK,
            }}
          >
            Sign in
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(26,38,32,0.6)",
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            We&apos;ll email you a link to sign in. No password needed.
          </div>
        </div>

        <input type="hidden" name="next" value={next} />
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(26,38,32,0.5)",
              fontWeight: 500,
            }}
          >
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            style={{
              height: 48,
              borderRadius: 10,
              border: "1px solid rgba(26,38,32,0.18)",
              background: "#fff",
              color: INK,
              padding: "0 14px",
              fontSize: 15,
              outline: "none",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          style={{
            height: 52,
            borderRadius: 12,
            border: 0,
            background: pending ? "rgba(26,38,32,0.5)" : INK,
            color: PAPER,
            fontSize: 15,
            fontWeight: 500,
            cursor: pending ? "default" : "pointer",
          }}
        >
          {pending ? "Sending…" : "Send sign-in link"}
        </button>

        {state.message && (
          <div
            style={{
              fontSize: 13,
              color: state.ok ? MOSS : BRICK,
              padding: "8px 12px",
              borderRadius: 8,
              background: state.ok
                ? "rgba(63,91,71,0.08)"
                : "rgba(168,88,75,0.08)",
            }}
          >
            {state.message}
          </div>
        )}
      </form>
    </div>
  );
}
