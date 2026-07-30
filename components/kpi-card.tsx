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

const ICON_BADGE: Record<KpiAccent, string> = {
  primary: "bg-gradient-to-br from-accent-primary/25 to-accent-light/10 text-accent-light shadow-[0_0_12px_var(--accent-primary-glow)]",
  good: "bg-gradient-to-br from-status-good/30 to-status-good/5 text-status-good shadow-[0_0_12px_rgba(12,163,12,0.4)]",
  warning: "bg-gradient-to-br from-status-warning/30 to-status-warning/5 text-status-warning shadow-[0_0_12px_rgba(250,178,25,0.35)]",
  critical: "bg-gradient-to-br from-status-critical/30 to-status-critical/5 text-status-critical shadow-[0_0_12px_rgba(208,59,59,0.4)]",
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
  const strength = featured ? 27 : 8;
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
        "group flex h-full min-w-0 flex-col items-start overflow-hidden rounded-card border border-[rgba(96,165,250,0.12)] p-3.5 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125 " +
        (featured
          ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(47,128,237,0.22)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_42px_rgba(0,0,0,0.55),0_0_0_1px_rgba(47,128,237,0.4)]"
          : "shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_35px_rgba(0,0,0,0.3)]")
      }
      style={{ containerType: "inline-size", backgroundImage: cardBackground(accent, featured) }}
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-gradient-to-br to-transparent blur-3xl ${GLOW_BLOB[accent]} ${featured ? "opacity-30" : "opacity-[0.16]"}`}
        aria-hidden
      />

      {icon ? (
        // icon sits above the title (its own row) with real breathing room
        // below it — cramming it beside the title left them touching
        <>
          <span className={`relative mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ICON_BADGE[accent]}`}>
            <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          </span>
          <p
            className={`relative mb-1.5 line-clamp-2 w-full text-left font-bold uppercase leading-snug tracking-wide ${
              featured ? "text-[clamp(11px,2.4cqw,14px)] text-primary" : "text-[clamp(10px,2.1cqw,12.5px)] text-secondary"
            }`}
          >
            {label}
          </p>
        </>
      ) : (
        <div className="relative mb-1.5 flex w-full items-start justify-start gap-1.5">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={
              featured
                ? { backgroundColor: ACCENT_COLOR[accent], boxShadow: `0 0 6px ${ACCENT_COLOR[accent]}` }
                : { backgroundColor: ACCENT_COLOR[accent], opacity: 0.55 }
            }
            aria-hidden
          />
          <p
            className={`line-clamp-2 text-left font-bold uppercase leading-snug tracking-wide ${
              featured ? "text-[clamp(11px,2.4cqw,14px)] text-primary" : "text-[clamp(10px,2.1cqw,12.5px)] text-secondary"
            }`}
          >
            {label}
          </p>
        </div>
      )}

      {/* fluid, container-relative size: shrinks to fit narrow grid columns
          (never truncates/ellipsis) and grows well past the old fixed cap
          on wide layouts/TV screens instead of staying small. Same clamp
          for every card — featured/non-featured hierarchy already comes
          through via the icon/title treatment and glow, not value size. */}
      <p
        className={`relative w-full overflow-hidden whitespace-nowrap text-left font-extrabold leading-none tracking-tight tabular-nums ${VALUE_TEXT[valueColor ?? accent]}`}
        style={{ fontSize: "clamp(1.05rem, 12cqw, 3.4rem)" }}
      >
        {value}
      </p>

      {sub && <p className="relative mt-1 w-full truncate text-left text-[clamp(11px,2.4cqw,14px)] font-medium text-secondary">{sub}</p>}
      {children}
    </CardSpotlight>
  );
}
