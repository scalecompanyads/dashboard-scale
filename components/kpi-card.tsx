export type KpiAccent = "primary" | "good" | "warning" | "critical" | "muted";

const BAR_COLOR: Record<KpiAccent, string> = {
  primary: "var(--color-accent-primary)",
  good: "var(--color-status-good)",
  warning: "var(--color-status-warning)",
  critical: "var(--color-status-critical)",
  muted: "var(--color-hairline-strong)",
};

const TEXT_COLOR: Record<KpiAccent, string> = {
  primary: "var(--color-primary)",
  good: "var(--color-status-good)",
  warning: "var(--color-status-warning)",
  critical: "var(--color-status-critical)",
  muted: "var(--color-primary)",
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
  return (
    <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-1 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.7)]">
      <span
        className="absolute inset-x-0 top-0 h-1 opacity-90"
        style={{ background: BAR_COLOR[accent], boxShadow: `0 2px 20px ${BAR_COLOR[accent]}66` }}
        aria-hidden
      />
      <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p
        className="mt-1 truncate text-2xl font-extrabold tracking-tight"
        style={{ color: TEXT_COLOR[valueColor ?? accent] }}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs font-medium text-muted">{sub}</p>}
      {children}
    </div>
  );
}
