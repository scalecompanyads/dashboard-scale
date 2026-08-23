import type { StatusTone } from "@/components/status-badge";

const FILL_CLASSES: Record<StatusTone, string> = {
  good: "bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.6)]",
  warning: "bg-status-warning shadow-[0_0_8px_rgba(250,178,25,0.6)]",
  critical: "bg-status-critical shadow-[0_0_8px_rgba(208,59,59,0.6)]",
  accent: "bg-gradient-to-r from-accent-primary to-accent-light shadow-[0_0_8px_var(--accent-primary-glow)]",
  neutral: "bg-hairline-strong",
};

export function ProgressIndicator({ pct, tone = "accent" }: { pct: number; tone?: StatusTone }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-none bg-white/[0.06]"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-none transition-[width] duration-300 ${FILL_CLASSES[tone]}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
