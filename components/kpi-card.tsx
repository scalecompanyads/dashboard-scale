import { CardSpotlight } from "@/components/card-spotlight";

export type KpiAccent = "primary" | "good" | "warning" | "critical" | "muted";

const VALUE_TEXT: Record<KpiAccent, string> = {
  primary: "text-primary",
  good: "text-status-good",
  warning: "text-status-warning",
  critical: "text-status-critical",
  muted: "text-primary",
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

// Every card is a flat black block — color lives only in the top stripe and
// a faint tint bleeding down from it, never in a gray/graphite fill.
function cardBackground(accent: KpiAccent, featured: boolean) {
  const strength = featured ? 20 : 8;
  return `linear-gradient(160deg, color-mix(in srgb, ${ACCENT_COLOR[accent]} ${strength}%, transparent) 0%, #000000 40%, #000000 100%)`;
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
        "group flex h-full min-w-0 flex-col items-start overflow-hidden rounded-card border border-[rgba(88,141,255,0.5)] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125 " +
        (featured
          ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(58,67,227,0.35)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_42px_rgba(0,0,0,0.55),0_0_0_1px_rgba(58,67,227,0.55)]"
          : "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_35px_rgba(0,0,0,0.3)]")
      }
      style={{ containerType: "inline-size", backgroundImage: cardBackground(accent, featured) }}
    >
      {/* editorial "kicker" stripe — every card gets one, in its own accent color, so the color-coding reads at a glance even though the fill underneath is always flat black */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: ACCENT_COLOR[accent] }} aria-hidden />

      {icon ? (
        // icon sits above the title (its own row) with real breathing room
        // below it — cramming it beside the title left them touching
        <>
          <span className={`relative mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-none ${ICON_BADGE[accent]}`}>
            <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          </span>
          <p
            className={`font-display relative mb-1.5 line-clamp-2 w-full text-left font-bold uppercase leading-snug tracking-wider text-accent-primary ${
              featured ? "text-[clamp(11px,2.4cqw,17px)]" : "text-[clamp(10px,2.1cqw,15px)]"
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
            className={`font-display line-clamp-2 text-left font-bold uppercase leading-snug tracking-wider text-accent-primary ${
              featured ? "text-[clamp(11px,2.4cqw,17px)]" : "text-[clamp(10px,2.1cqw,15px)]"
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
        style={{ fontSize: "clamp(1.05rem, 13cqw, 5rem)" }}
      >
        {value}
      </p>

      {sub && <p className="relative mt-1 w-full truncate text-left text-[clamp(11px,2.4cqw,16px)] font-medium text-secondary">{sub}</p>}
      {children}
    </CardSpotlight>
  );
}
