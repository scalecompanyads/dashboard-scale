import type { CSSProperties } from "react";

export type PanelSurface = "dark" | "white" | "blue";

// Solid, opaque cards (editorial — no glass/blur), color-blocked per surface:
// dark = flat black with a faint accent tint bleeding in; white = a plain
// white card; blue = a bold solid blue block. Mixing white/blue across the
// funnel + podiums (instead of every panel being the same dark tone) is
// what gives that row its "mesclado" editorial rhythm.
export function panelClass(surface: PanelSurface): string {
  const base = "rounded-card border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_35px_rgba(0,0,0,0.35)]";
  if (surface === "white") return `${base} border-black/10`;
  if (surface === "blue") return `${base} border-white/15`;
  return `${base} border-white/15`;
}

export function panelStyle(surface: PanelSurface): CSSProperties {
  if (surface === "white") {
    return { backgroundImage: "linear-gradient(160deg, #ffffff 0%, #ffffff 100%)", boxShadow: "0 14px 35px rgba(0,0,0,0.5)" };
  }
  if (surface === "blue") {
    return {
      backgroundImage:
        "linear-gradient(160deg, color-mix(in srgb, var(--color-accent-primary) 100%, white 8%) 0%, var(--color-accent-primary) 55%, color-mix(in srgb, var(--color-accent-primary) 88%, black) 100%)",
    };
  }
  return { backgroundImage: "linear-gradient(160deg, rgba(58,67,227,0.14) 0%, var(--color-surface-solid) 42%, var(--color-surface-solid) 100%)" };
}

// Back-compat named export for any lingering dark-surface-only consumer.
export const glassPanelClass = panelClass("dark");
export const glassPanelStyle = panelStyle("dark");
