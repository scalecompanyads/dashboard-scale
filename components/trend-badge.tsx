function pctChange(current: number, previous: number): number | null {
  // No meaningful percentage when there's no baseline to compare against
  // (avoids a misleading "+∞%" jump from a zero previous month).
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

// A small organic wave instead of a straight diagonal — reads as a real
// trend line (like a stock chart), not a ramp. Same two control curves,
// just mirrored vertically for the down case.
function TrendSpark({ direction }: { direction: "up" | "down" }) {
  const d =
    direction === "up"
      ? "M1,10 Q5,11 7,8 Q9,5 12,6 Q15,7 17,4 Q19,1 22,2 Q24,2.5 27,1"
      : "M1,2 Q5,1 7,4 Q9,7 12,6 Q15,5 17,8 Q19,11 22,10 Q24,9.5 27,11";
  return (
    <svg viewBox="0 0 28 12" width="22" height="10" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Small "+12% vs mês anterior" indicator — renders nothing if there's no sane baseline. */
export function TrendBadge({ current, previous, label = "vs mês anterior" }: { current: number; previous: number; label?: string }) {
  const change = pctChange(current, previous);
  if (change === null) return null;

  const positive = change >= 0.05;
  const negative = change <= -0.05;
  const tone = positive ? "text-status-good" : negative ? "text-status-critical" : "text-muted";

  return (
    <span className={`relative mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold ${tone}`}>
      {positive && <TrendSpark direction="up" />}
      {negative && <TrendSpark direction="down" />}
      {Math.abs(change).toFixed(1)}% {label}
    </span>
  );
}
