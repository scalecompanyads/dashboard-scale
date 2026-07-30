import { CardSpotlight } from "@/components/card-spotlight";

export type KpiAccent = "primary" | "good" | "warning" | "critical" | "muted";

const VALUE_TEXT: Record<KpiAccent, string> = {
  primary: "text-primary",
  good: "text-status-good",
  warning: "text-status-warning",
  critical: "text-status-critical",
  muted: "text-primary",
};

const GLOW_BLOB: Record<KpiAccent, string> = {
  primary: "from-accent-primary via-accent-light",
  good: "from-status-good via-status-good",
  warning: "from-status-warning via-status-warning",
  critical: "from-status-critical via-status-critical",
  muted: "from-white/40 via-white/10",
};

// Glowing top stripe — brought back from an earlier pass per explicit
// feedback that it looked good; a thin bright band with a soft outward
// glow, one per accent.
const TOP_BAR: Record<KpiAccent, { gradient: string; glow: string }> = {
  primary: { gradient: "linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-light))", glow: "var(--accent-primary-glow)" },
  good: { gradient: "linear-gradient(90deg, var(--color-status-good), #34d399)", glow: "rgba(12,163,12,0.5)" },
  warning: { gradient: "linear-gradient(90deg, var(--color-status-warning), #ffd764)", glow: "rgba(250,178,25,0.5)" },
  critical: { gradient: "linear-gradient(90deg, var(--color-status-critical), var(--color-status-critical-light))", glow: "rgba(208,59,59,0.5)" },
  muted: { gradient: "linear-gradient(90deg, var(--color-hairline-strong), var(--color-secondary))", glow: "transparent" },
};

const ICON_BADGE: Record<KpiAccent, string> = {
  primary: "bg-gradient-to-br from-accent-primary/25 to-accent-light/10 text-accent-light shadow-[0_0_16px_var(--accent-primary-glow)]",
  good: "bg-gradient-to-br from-status-good/30 to-status-good/5 text-status-good shadow-[0_0_16px_rgba(12,163,12,0.4)]",
  warning: "bg-gradient-to-br from-status-warning/30 to-status-warning/5 text-status-warning shadow-[0_0_16px_rgba(250,178,25,0.35)]",
  critical: "bg-gradient-to-br from-status-critical/30 to-status-critical/5 text-status-critical shadow-[0_0_16px_rgba(208,59,59,0.4)]",
  muted: "bg-white/[0.06] text-secondary",
};

const ACCENT_COLOR: Record<KpiAccent, string> = {
  primary: "var(--color-accent-primary)",
  good: "var(--color-status-good)",
  warning: "var(--color-status-warning)",
  critical: "var(--color-status-critical)",
  muted: "#ffffff",
};

// Color baked into the card's own background (not just a floating blob),
// mixed via color-mix() so every accent gets a matching tinted gradient
// instead of a flat gray panel — a plain low-opacity fill reads as dull
// when nothing colorful happens to sit behind it.
function cardBackground(accent: KpiAccent, featured: boolean) {
  const strength = featured ? 24 : 12;
  return `linear-gradient(160deg, color-mix(in srgb, ${ACCENT_COLOR[accent]} ${strength}%, transparent) 0%, rgba(13,18,27,0.82) 45%, rgba(13,18,27,0.9) 100%)`;
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "primary",
  valueColor,
  featured = false,
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: KpiAccent;
  valueColor?: KpiAccent;
  /** Reserve the stronger glow + tinted surface for the 3-4 cards that matter most (TCV, Meta, % Realizada, Gap). */
  featured?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <CardSpotlight
      className={
        "group flex h-full min-w-0 flex-col items-center overflow-hidden rounded-card p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125 " +
        (featured
          ? "shadow-[0_10px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(47,128,237,0.22)] hover:shadow-[0_16px_42px_rgba(0,0,0,0.55),0_0_0_1px_rgba(47,128,237,0.4)]"
          : "shadow-[0_6px_20px_rgba(0,0,0,0.35)]")
      }
      style={{ containerType: "inline-size", backgroundImage: cardBackground(accent, featured) }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] rounded-t-card"
        style={{ background: TOP_BAR[accent].gradient, boxShadow: `0 0 14px ${TOP_BAR[accent].glow}` }}
        aria-hidden
      />

      <div
        className={`pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-gradient-to-br to-transparent blur-3xl ${GLOW_BLOB[accent]} ${featured ? "opacity-30" : "opacity-[0.16]"}`}
        aria-hidden
      />

      {icon && (
        <div className={`relative mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl ${ICON_BADGE[accent]}`}>
          <span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
        </div>
      )}

      {/* fluid, container-relative size: shrinks to fit narrow grid columns
          (never truncates/ellipsis) and grows well past the old fixed cap
          on wide layouts/TV screens instead of staying small */}
      <p
        className={`relative w-full overflow-hidden whitespace-nowrap text-center font-extrabold leading-none tracking-tight tabular-nums ${VALUE_TEXT[valueColor ?? accent]}`}
        style={{ fontSize: "clamp(1.05rem, 13cqw, 4rem)" }}
      >
        {value}
      </p>

      <p className="relative mt-2.5 w-full truncate text-center text-[clamp(10px,2.2cqw,13px)] font-bold uppercase tracking-wide text-muted">{label}</p>

      {sub && <p className="relative mt-1 w-full truncate text-center text-[clamp(11px,2.4cqw,14px)] font-medium text-secondary">{sub}</p>}
      {children}
    </CardSpotlight>
  );
}
