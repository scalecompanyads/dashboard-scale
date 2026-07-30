export type KpiAccent = "primary" | "good" | "warning" | "critical" | "muted";

const GLOW: Record<KpiAccent, string> = {
  primary: "var(--color-accent-primary)",
  good: "var(--color-status-good)",
  warning: "var(--color-status-warning)",
  critical: "var(--color-status-critical)",
  muted: "var(--color-hairline-strong)",
};

const DOT: Record<KpiAccent, string> = {
  primary: "bg-accent-primary shadow-[0_0_8px_var(--accent-primary-glow)]",
  good: "bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.6)]",
  warning: "bg-status-warning shadow-[0_0_8px_rgba(250,178,25,0.6)]",
  critical: "bg-status-critical shadow-[0_0_8px_rgba(208,59,59,0.6)]",
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
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: KpiAccent;
  valueColor?: KpiAccent;
  children?: React.ReactNode;
}) {
  const glow = GLOW[accent];

  return (
    <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-1 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-hairline-strong hover:shadow-[0_16px_48px_rgba(0,0,0,0.65)]">
      {/* ambient accent glow, top-left */}
      <div
        className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full opacity-[0.16] blur-2xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ background: glow }}
        aria-hidden
      />

      <div className="relative flex items-center gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[accent]}`} aria-hidden />
        <p className="truncate text-[10.5px] font-bold uppercase tracking-wider text-muted">{label}</p>
      </div>

      <p
        className={`relative mt-2.5 truncate text-[1.7rem] font-extrabold leading-none tracking-tight tabular-nums ${VALUE_TEXT[valueColor ?? accent]}`}
      >
        {value}
      </p>

      {sub && <p className="relative mt-2 truncate text-[11px] font-medium text-muted">{sub}</p>}
      {children}
    </div>
  );
}
