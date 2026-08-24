import type { KpiSurface } from "@/components/kpi-card";

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

// Same good/critical/neutral meaning on both surfaces, but the plain status
// colors are unreadably low-contrast directly on the solid blue hero card,
// so that one surface gets lighter tints instead.
const TONE_BY_SURFACE: Record<KpiSurface, { positive: string; negative: string; neutral: string }> = {
  dark: { positive: "text-status-good", negative: "text-status-critical", neutral: "text-muted" },
  blue: { positive: "text-[#c2e8c2]", negative: "text-[#f3cece]", neutral: "text-white/75" },
};

/** Small "+12% vs mês anterior" indicator — renders nothing if there's no sane baseline. */
export function TrendBadge({
  current,
  previous,
  label = "vs mês anterior",
  surface = "dark",
}: {
  current: number;
  previous: number;
  label?: string;
  /** Must match the KpiCard this badge is rendered inside, so the color stays legible against that card's background. */
  surface?: KpiSurface;
}) {
  const change = pctChange(current, previous);
  if (change === null) return null;

  const positive = change >= 0.05;
  const negative = change <= -0.05;
  const tones = TONE_BY_SURFACE[surface];
  const tone = positive ? tones.positive : negative ? tones.negative : tones.neutral;

  return (
    <span className={`relative mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold ${tone}`}>
      {positive && <TrendSpark direction="up" />}
      {negative && <TrendSpark direction="down" />}
      {Math.abs(change).toFixed(1)}% {label}
    </span>
  );
}
