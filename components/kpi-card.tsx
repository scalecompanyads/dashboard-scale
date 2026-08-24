import { CardSpotlight } from "@/components/card-spotlight";

export type KpiAccent = "primary" | "good" | "warning" | "critical" | "muted";
export type KpiSurface = "dark" | "blue";

const ACCENT_COLOR: Record<KpiAccent, string> = {
  primary: "var(--color-accent-primary)",
  good: "var(--color-status-good)",
  warning: "var(--color-status-warning)",
  critical: "var(--color-status-critical)",
  muted: "#ffffff",
};

const ICON_BADGE_DARK: Record<KpiAccent, string> = {
  primary: "bg-gradient-to-br from-accent-primary/25 to-accent-light/10 text-accent-light shadow-[0_0_12px_var(--accent-primary-glow)]",
  good: "bg-gradient-to-br from-status-good/30 to-status-good/5 text-status-good shadow-[0_0_12px_rgba(12,163,12,0.4)]",
  warning: "bg-gradient-to-br from-status-warning/30 to-status-warning/5 text-status-warning shadow-[0_0_12px_rgba(250,178,25,0.35)]",
  critical: "bg-gradient-to-br from-status-critical/30 to-status-critical/5 text-status-critical shadow-[0_0_12px_rgba(208,59,59,0.4)]",
  muted: "bg-white/[0.06] text-secondary",
};

// Color baked into the card's own background — dark cards share the same
// cohesive navy surface as every other panel in the app (colored-stripe on
// top carries the status meaning), so the dashboard reads as one consistent
// dark theme instead of disconnected black/white/blue blocks. "blue" is the
// one deliberate solid-color hero, reserved for the single most important stat.
function cardBackground(surface: KpiSurface, accent: KpiAccent, featured: boolean) {
  if (surface === "blue") {
    return "linear-gradient(160deg, color-mix(in srgb, var(--color-accent-primary) 100%, white 8%) 0%, var(--color-accent-primary) 55%, color-mix(in srgb, var(--color-accent-primary) 88%, black) 100%)";
  }
  // Liquid glass: translucent instead of flat opaque, so backdrop-blur has
  // something to actually blur — the ambient body glow shows through soft
  // and frosted instead of the card reading as a solid black box.
  const strength = featured ? 20 : 8;
  const glass = "color-mix(in srgb, var(--color-surface-solid) 72%, transparent)";
  return `linear-gradient(160deg, color-mix(in srgb, ${ACCENT_COLOR[accent]} ${strength}%, transparent) 0%, ${glass} 40%, ${glass} 100%)`;
}

const VALUE_TEXT: Record<KpiAccent, string> = {
  primary: "text-primary",
  good: "text-status-good",
  warning: "text-status-warning",
  critical: "text-status-critical",
  muted: "text-primary",
};

export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = "primary",
  valueColor,
  featured = false,
  surface = "dark",
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
  /** "blue" is reserved for the single most important stat on the page (e.g. TCV Fechado) — a deliberate one-off highlight, not something derived automatically from accent/featured. Every other card stays "dark". */
  surface?: KpiSurface;
  children?: React.ReactNode;
}) {
  const labelClass = surface === "blue" ? "text-white" : "text-accent-primary";
  const valueClass = surface === "blue" ? "text-white" : VALUE_TEXT[valueColor ?? accent];
  const subClass = surface === "blue" ? "text-white/75" : "text-secondary";
  const iconBadgeClass = surface === "blue" ? "bg-white/15 text-white" : ICON_BADGE_DARK[accent];
  const dotColor = surface === "blue" ? "#ffffff" : ACCENT_COLOR[accent];

  return (
    <CardSpotlight
      className={
        "group flex h-full min-w-0 flex-col items-start overflow-hidden rounded-card border border-white/15 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_35px_rgba(0,0,0,0.3)] " +
        (surface === "dark" ? "backdrop-blur-xl" : "")
      }
      style={{ containerType: "inline-size", backgroundImage: cardBackground(surface, accent, featured) }}
    >
      {/* editorial "kicker" stripe — only on dark cards (status meaning shows through here since flattening those into the blue hero color would erase it); the blue card is already a bold solid block, a stripe on top would be redundant */}
      {surface === "dark" && <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: ACCENT_COLOR[accent] }} aria-hidden />}

      {icon ? (
        // icon sits above the title (its own row) with real breathing room
        // below it — cramming it beside the title left them touching
        <>
          <span className={`relative mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-none ${iconBadgeClass}`}>
            <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
          </span>
          <p
            className={`font-display relative mb-1.5 line-clamp-2 w-full text-left font-bold uppercase leading-snug tracking-wider ${labelClass} ${
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
              surface === "dark" && featured
                ? { backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }
                : { backgroundColor: dotColor, opacity: surface === "dark" ? 0.55 : 0.8 }
            }
            aria-hidden
          />
          <p
            className={`font-display line-clamp-2 text-left font-bold uppercase leading-snug tracking-wider ${labelClass} ${
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
        className={`relative w-full overflow-hidden whitespace-nowrap text-left font-extrabold leading-none tracking-tight tabular-nums ${valueClass}`}
        style={{ fontSize: "clamp(1.05rem, 13cqw, 5rem)" }}
      >
        {value}
      </p>

      {sub && <p className={`relative mt-1 w-full truncate text-left text-[clamp(11px,2.4cqw,16px)] font-medium ${subClass}`}>{sub}</p>}
      {children}
    </CardSpotlight>
  );
}
