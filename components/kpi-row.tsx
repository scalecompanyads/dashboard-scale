import type { CSSProperties } from "react";

export function KpiRow({
  children,
  cols = 7,
  staggerBase = 0,
}: {
  children: React.ReactNode;
  cols?: number;
  /** Delay (ms) before the first card's entrance — lets a second KpiRow on the same page cascade in after the first. */
  staggerBase?: number;
}) {
  return (
    <div
      className="stagger grid gap-3.5"
      style={
        {
          gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(120, Math.floor(920 / cols))}px, 1fr))`,
          "--stagger-base": `${staggerBase}ms`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
