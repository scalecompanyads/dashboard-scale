export type StatusTone = "good" | "warning" | "critical" | "accent" | "neutral";

// Solid, saturated fills — checked with the dataviz skill's contrast() helper
// against each exact status hex. Dark ink reads best on every tone except
// critical (its red is dark enough that white text clears 4.5:1 while dark
// ink only reaches ~4:1).
const TONE_CLASSES: Record<StatusTone, string> = {
  good: "bg-status-good text-ink-strong shadow-[0_0_14px_rgba(12,163,12,0.45)]",
  warning: "bg-status-warning text-ink-strong shadow-[0_0_14px_rgba(250,178,25,0.4)]",
  critical: "bg-status-critical text-white shadow-[0_0_14px_rgba(208,59,59,0.45)]",
  accent: "bg-gradient-to-r from-accent-primary to-accent-light text-ink-strong shadow-[0_0_14px_var(--accent-primary-glow)]",
  neutral: "bg-white/[0.08] text-secondary border border-hairline-strong",
};

export function StatusBadge({ label, tone = "neutral" }: { label: React.ReactNode; tone?: StatusTone }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-none px-2.5 py-1 text-[11px] font-extrabold tabular-nums ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}

/** Consistent good/accent/critical thresholds for conversion-style percentages, shared across tables/funnel. */
export function toneFromPct(pct: number): StatusTone {
  if (pct >= 50) return "good";
  if (pct >= 20) return "accent";
  return "critical";
}

export function PctBadge({ num, den }: { num: number; den: number }) {
  if (!den) return <StatusBadge label="—" tone="accent" />;
  const pct = (num / den) * 100;
  return <StatusBadge label={`${pct.toFixed(1)}%`} tone={toneFromPct(pct)} />;
}
