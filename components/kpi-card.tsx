export type KpiAccent = "primary" | "good" | "warning" | "critical" | "muted";

const DOT: Record<KpiAccent, string> = {
  primary: "bg-accent-primary shadow-[0_0_8px_var(--accent-primary-glow)]",
  good: "bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.7)]",
  warning: "bg-status-warning shadow-[0_0_8px_rgba(250,178,25,0.7)]",
  critical: "bg-status-critical shadow-[0_0_8px_rgba(208,59,59,0.7)]",
  muted: "bg-muted",
};

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
    >
      {featured && (
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-accent-primary via-accent-light to-transparent opacity-25 blur-3xl"
          aria-hidden
        />
      )}

      <div className="relative flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[accent]}`} aria-hidden />
        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
      </div>

      <p className={`relative mt-2.5 truncate text-[2rem] font-extrabold leading-none tracking-tight tabular-nums ${VALUE_TEXT[valueColor ?? accent]}`}>
        {value}
      </p>

      {sub && <p className="relative mt-2 truncate text-[12px] font-medium text-secondary">{sub}</p>}
      {children}
    </div>
  );
}
