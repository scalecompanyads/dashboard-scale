import { fmtBRL } from "@/lib/constants";
import type { RevenueTrendPoint } from "@/lib/data/trend";

const WIDTH = 560;
const HEIGHT = 160;
const PADDING_BOTTOM = 22;
const BAR_GAP = 6;

export function RevenueTrendChart({ points }: { points: RevenueTrendPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.total));
  const plotHeight = HEIGHT - PADDING_BOTTOM;
  const barWidth = points.length ? WIDTH / points.length - BAR_GAP : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-surface-1 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">Faturamento Fechado — Últimos Meses</h3>

      {points.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-xs text-muted">Sem dados suficientes ainda.</p>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full flex-1" preserveAspectRatio="xMidYMid meet" role="img">
          <title>Faturamento fechado por mês</title>
          {/* recessive baseline */}
          <line
            x1={0}
            y1={plotHeight}
            x2={WIDTH}
            y2={plotHeight}
            stroke="var(--color-hairline)"
            strokeWidth={1}
          />
          {points.map((p, i) => {
            const barHeight = max > 0 ? (p.total / max) * (plotHeight - 12) : 0;
            const x = i * (barWidth + BAR_GAP);
            const y = plotHeight - barHeight;
            const isLast = i === points.length - 1;
            return (
              <g key={p.monthKey}>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(barWidth, 2)}
                  height={Math.max(barHeight, 2)}
                  rx={4}
                  fill={isLast ? "var(--color-accent-primary)" : "var(--color-funnel-3)"}
                >
                  <title>
                    {p.label}: {fmtBRL(p.total)}
                  </title>
                </rect>
                {isLast && p.total > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={700}
                    fill="var(--color-primary)"
                  >
                    {fmtBRL(p.total)}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-muted)"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
