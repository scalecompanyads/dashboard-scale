import type { FunnelData } from "@/lib/metrics/funnel";
import { panelClass, panelStyle } from "@/lib/glass-panel";
import { IconUsers, IconCalendarCheck, IconCheckCircle, IconFlag } from "@/components/kpi-icons";

const STAGE_ICON = [IconUsers, IconCalendarCheck, IconCheckCircle, IconFlag];

// Curved 3D blocks — real <path> geometry (not a clip-path trapezoid), each
// narrower than the last, ported 1:1 from the reference design. viewBox
// (see below, "18 15 344 455") is cropped tight around just the funnel
// artwork so it lines up flush with the title above it instead of sitting
// behind a big empty margin; the labels that used to live at x>400 in the
// reference are rendered as HTML instead so they can use the app's own
// icon set.
const STAGE_PATH = [
  "M 42 82 Q 190 55 338 82 L 315 158 Q 190 178 65 158 Z",
  "M 64 180 Q 190 160 316 180 L 295 247 Q 190 264 85 247 Z",
  "M 86 267 Q 190 250 294 267 L 275 328 Q 190 343 105 328 Z",
  "M 108 347 Q 190 334 272 347 L 257 408 Q 190 421 123 408 Z",
];
const STAGE_RIM = [
  "M 42 82 Q 190 55 338 82",
  "M 64 180 Q 190 160 316 180",
  "M 86 267 Q 190 250 294 267",
  "M 108 347 Q 190 334 272 347",
];
const STAGE_TEXT_Y = [127, 222, 307, 389];
const STAGE_SHINE_OPACITY = [1, 0.6, 0.5, 0.35];
// Same y-coordinates as each block's connector dot in the reference,
// converted to a % of the cropped viewBox's visible range so the HTML
// label row lines up with its block exactly regardless of how big the
// card actually renders.
const VIEWBOX_Y0 = 35;
const VIEWBOX_HEIGHT = 435;
const STAGE_LABEL_TOP_PCT = [111, 208, 293, 374].map((y) => ((y - VIEWBOX_Y0) / VIEWBOX_HEIGHT) * 100);

function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />
    </svg>
  );
}

// Static ids — fine since this chart only ever renders once per page (SVG
// defs are global to the document by id, so a second instance on the same
// page would need these namespaced, but there isn't one).
const gid = (name: string) => `funnel-${name}`;

export function FunnelChart({ data }: { data: FunnelData }) {
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden ${panelClass("white")}`}
      style={{ ...panelStyle("white"), containerType: "inline-size" }}
    >
      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-2">
        {/* cqw (this card's own width) instead of a flat px size — grows on
            a wide TV layout, doesn't move at normal desktop widths */}
        <h3 className="font-display flex items-center gap-2 text-[clamp(15px,2.8cqw,19px)] font-bold text-ink-strong">
          <FunnelIcon className="text-accent-primary" />
          Funil de Conversão
        </h3>
        <div
          className="inline-flex items-center gap-1 rounded-none border px-3.5 py-2 text-[clamp(11px,2cqw,14px)]"
          style={{
            borderColor: "rgba(58,67,227,0.3)",
            background: "rgba(58,67,227,0.06)",
            color: "var(--color-ink-secondary)",
          }}
        >
          <strong className="text-accent-primary">{data.totalConversionPct.toFixed(1)}%</strong> conversão total
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-stretch gap-6">
        <svg
          viewBox="28 35 324 435"
          className="h-auto shrink-0"
          style={{ width: "min(340px, 48%)" }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Funil de conversão"
        >
          <defs>
            <linearGradient id={gid("stage-1")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5fa8ff" />
              <stop offset="22%" stopColor="#b4d8ff" />
              <stop offset="48%" stopColor="#4b94f2" />
              <stop offset="78%" stopColor="#3178d8" />
              <stop offset="100%" stopColor="#1260c6" />
            </linearGradient>
            <linearGradient id={gid("stage-2")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#096ee8" />
              <stop offset="22%" stopColor="#3c9bff" />
              <stop offset="50%" stopColor="#0968d8" />
              <stop offset="100%" stopColor="#024ba8" />
            </linearGradient>
            <linearGradient id={gid("stage-3")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0756bc" />
              <stop offset="25%" stopColor="#2579e2" />
              <stop offset="55%" stopColor="#074da8" />
              <stop offset="100%" stopColor="#033276" />
            </linearGradient>
            <linearGradient id={gid("stage-4")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#072b65" />
              <stop offset="28%" stopColor="#124b9c" />
              <stop offset="58%" stopColor="#06275c" />
              <stop offset="100%" stopColor="#031939" />
            </linearGradient>
            <linearGradient id={gid("surface-shine")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity=".38" />
              <stop offset="30%" stopColor="#ffffff" stopOpacity=".1" />
              <stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#001531" stopOpacity=".32" />
            </linearGradient>
            <filter id={gid("blue-shadow")} x="-40%" y="-50%" width="180%" height="220%">
              <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#0b1226" floodOpacity=".28" />
            </filter>
          </defs>

          {data.stages.map((stage, i) => (
            <g key={stage.key} filter={`url(#${gid("blue-shadow")})`} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <path d={STAGE_PATH[i]} fill={`url(#${gid(`stage-${i + 1}`)})`} />
              <path d={STAGE_PATH[i]} fill={`url(#${gid("surface-shine")})`} opacity={STAGE_SHINE_OPACITY[i]} />
              <path
                d={STAGE_RIM[i]}
                fill="none"
                stroke="rgba(208,234,255,0.92)"
                strokeWidth="2.2"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 5px rgba(102,181,255,0.7))" }}
              />
              <text
                x="190"
                y={STAGE_TEXT_Y[i]}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="32"
                fontWeight="800"
                paintOrder="stroke"
                stroke="rgba(8,26,55,0.25)"
                strokeWidth="4"
                style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }}
              >
                {stage.value.toLocaleString("pt-BR")}
              </text>
            </g>
          ))}
        </svg>

        <div className="relative min-w-0 flex-1">
          {data.stages.map((stage, i) => {
            const Icon = STAGE_ICON[i];
            return (
              <div
                key={stage.key}
                className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-2.5"
                style={{ top: `${STAGE_LABEL_TOP_PCT[i]}%` }}
              >
                <span className="h-px w-5 shrink-0" style={{ background: "rgba(58,67,227,0.25)" }} aria-hidden />
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary" aria-hidden />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none border border-accent-primary/20 bg-accent-primary/10">
                  <Icon className="h-4 w-4 text-accent-primary" />
                </span>
                <div className="min-w-0">
                  {stage.conversionFromPrevious !== null ? (
                    <>
                      <p className="text-accent-primary text-[clamp(13px,2.6cqw,18px)] font-extrabold leading-tight">
                        {stage.conversionFromPrevious.toFixed(1)}%
                      </p>
                      <p className="text-ink-secondary truncate text-[clamp(11px,2.2cqw,15px)] font-medium">{stage.label}</p>
                      {stage.nextMilestone && (
                        <p className="truncate text-[clamp(9px,1.6cqw,11px)] font-medium leading-none text-black/40">
                          faltam {stage.nextMilestone.needed} p/ {stage.nextMilestone.targetPct}%
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-ink-strong truncate text-[clamp(13px,2.6cqw,18px)] font-bold">{stage.label}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
