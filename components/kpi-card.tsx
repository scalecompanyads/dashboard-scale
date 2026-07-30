export type KpiAccent = "primary" | "good" | "warning" | "critical" | "muted";

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
  accent = "primary",
  valueColor,
  featured = false,
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: KpiAccent;
  valueColor?: KpiAccent;
  /** Reserve the blue gradient + glow treatment for the 3-4 cards that matter most (TCV, Meta, % Realizada, Gap). */
  featured?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={
        "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-card p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 " +
        (featured
          ? "bg-surface-2 shadow-[0_10px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(47,128,237,0.2)] hover:shadow-[0_16px_42px_rgba(0,0,0,0.55),0_0_0_1px_rgba(47,128,237,0.35)]"
          : "bg-surface-1 shadow-[0_6px_20px_rgba(0,0,0,0.35)] hover:bg-surface-2/70")
      }
      style={{ containerType: "inline-size" }}
    >
      {featured && (
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-accent-primary via-accent-light to-transparent opacity-25 blur-3xl"
          aria-hidden
        />
      )}

      {/* fluid, container-relative size: shrinks to fit narrow grid columns
          (never truncates/ellipsis) and grows well past the old fixed cap
          on wide layouts/TV screens instead of staying small */}
      <p
        className={`relative overflow-hidden whitespace-nowrap text-center font-extrabold leading-none tracking-tight tabular-nums ${VALUE_TEXT[valueColor ?? accent]}`}
        style={{ fontSize: "clamp(1.05rem, 13cqw, 4rem)" }}
      >
        {value}
      </p>

      <p className="relative mt-2.5 truncate text-center text-[clamp(10px,2.2cqw,13px)] font-bold uppercase tracking-wide text-muted">{label}</p>

      {sub && <p className="relative mt-1 truncate text-center text-[clamp(11px,2.4cqw,14px)] font-medium text-secondary">{sub}</p>}
      {children}
    </div>
  );
}
