import { fmtBRL, fmtBRLCompact } from "@/lib/constants";
import type { RevenueTrendPoint } from "@/lib/data/trend";

const WIDTH = 1200;
const HEIGHT = 230;
const PADDING_TOP = 34; // headroom so the current-month value label never clips
const PADDING_BOTTOM = 26;
const PADDING_LEFT = 4;
const BAR_GAP = 10;
const GRID_LINES = 3;

export function RevenueTrendChart({ points }: { points: RevenueTrendPoint[] }) {
  const plotTop = PADDING_TOP;
  const plotBottom = HEIGHT - PADDING_BOTTOM;
  const plotHeight = plotBottom - plotTop;

  const max = Math.max(1, ...points.map((p) => p.total));
  const barWidth = points.length ? (WIDTH - PADDING_LEFT) / points.length - BAR_GAP : 0;

  const total = points.reduce((sum, p) => sum + p.total, 0);
  const monthsWithData = points.filter((p) => p.total > 0).length;
  const average = monthsWithData ? total / monthsWithData : 0;

  const gridValues = Array.from({ length: GRID_LINES + 1 }, (_, i) => (max / GRID_LINES) * i);

  return (
    <div className="flex h-full flex-col rounded-card bg-surface-1 p-5 shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[14px] font-bold text-primary">Faturamento Fechado — Últimos Meses</h3>
        <div className="flex gap-5 text-right">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Total período</p>
            <p className="text-sm font-bold tabular-nums text-primary">{fmtBRL(total)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Média mensal</p>
            <p className="text-sm font-bold tabular-nums text-primary">{fmtBRL(average)}</p>
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-xs text-muted">Sem dados suficientes ainda.</p>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full flex-1" preserveAspectRatio="xMidYMid meet" role="img">
          <title>Faturamento fechado por mês</title>
          <defs>
            <linearGradient id="trendBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-light)" />
              <stop offset="100%" stopColor="var(--color-accent-primary)" />
            </linearGradient>
          </defs>

          {gridValues.map((gv, i) => {
            const y = plotBottom - (gv / max) * plotHeight;
            return (
              <g key={i}>
                <line x1={PADDING_LEFT} y1={y} x2={WIDTH} y2={y} stroke="var(--color-hairline)" strokeWidth={1} />
                {gv > 0 && (
                  <text x={PADDING_LEFT} y={y - 4} fontSize={9} fill="var(--color-muted)">
                    {fmtBRLCompact(gv)}
                  </text>
                )}
              </g>
            );
          })}

          {points.map((p, i) => {
            const barHeight = max > 0 ? (p.total / max) * plotHeight : 0;
            const x = PADDING_LEFT + i * (barWidth + BAR_GAP);
            const y = plotBottom - barHeight;
            const isLast = i === points.length - 1;

            return (
              <g key={p.monthKey}>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(barWidth, 2)}
                  height={Math.max(barHeight, 2)}
                  rx={5}
                  fill={isLast ? "url(#trendBarGradient)" : "var(--color-funnel-3)"}
                  className="transition-opacity hover:opacity-80"
                >
                  <title>
                    {p.label}: {fmtBRL(p.total)}
                  </title>
                </rect>

                {isLast && p.total > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 10}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={800}
                    fill="var(--color-primary)"
                  >
                    {fmtBRLCompact(p.total)}
                  </text>
                )}

                <text x={x + barWidth / 2} y={HEIGHT - 6} textAnchor="middle" fontSize={9.5} fill="var(--color-muted)">
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
