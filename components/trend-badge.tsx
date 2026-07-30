function pctChange(current: number, previous: number): number | null {
  // No meaningful percentage when there's no baseline to compare against
  // (avoids a misleading "+∞%" jump from a zero previous month).
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Small "+12% vs mês anterior" indicator — renders nothing if there's no sane baseline. */
export function TrendBadge({ current, previous, label = "vs mês anterior" }: { current: number; previous: number; label?: string }) {
  const change = pctChange(current, previous);
  if (change === null) return null;

  const positive = change >= 0.05;
  const negative = change <= -0.05;
  const tone = positive ? "text-status-good" : negative ? "text-status-critical" : "text-muted";

  return (
    <span className={`relative mt-1 inline-flex items-center gap-1 text-[11px] font-bold ${tone}`}>
      {positive && <span aria-hidden>▲</span>}
      {negative && <span aria-hidden>▼</span>}
      {Math.abs(change).toFixed(1)}% {label}
    </span>
  );
}
