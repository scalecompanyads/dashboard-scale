import type { FunnelData } from "@/lib/metrics/funnel";
import { StatusBadge, toneFromPct } from "@/components/status-badge";

// One hue, monotone light -> dark — ordinal ramp validated against this
// app's canvas with scripts/validate_palette.js --ordinal. Rendered as a
// gradient (not a flat fill) per stage for depth.
const STAGE_GRADIENT = [
  "linear-gradient(135deg, var(--color-funnel-1), var(--color-funnel-2))",
  "linear-gradient(135deg, var(--color-funnel-2), var(--color-funnel-3))",
  "linear-gradient(135deg, var(--color-funnel-3), var(--color-funnel-4))",
  "linear-gradient(135deg, var(--color-funnel-4), #0d2c56)",
];

const CLIP_PATH = [
  "polygon(0% 0%, 100% 0%, 94% 100%, 6% 100%)",
  "polygon(6% 0%, 94% 0%, 88% 100%, 12% 100%)",
  "polygon(12% 0%, 88% 0%, 82% 100%, 18% 100%)",
  "polygon(18% 0%, 82% 0%, 76% 100%, 24% 100%)",
];

export function FunnelChart({ data }: { data: FunnelData }) {
  return (
    <div className="flex h-full flex-col rounded-card border border-hairline bg-surface-1 p-5 shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-primary">Funil de Conversão</h3>
        <StatusBadge label={`${data.totalConversionPct.toFixed(1)}% conversão total`} tone={toneFromPct(data.totalConversionPct)} />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-3">
        {data.stages.map((stage, i) => (
          <div key={stage.key} className="grid grid-cols-2 items-center gap-4">
            <div
              className="relative flex h-16 items-center justify-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.12),0_6px_18px_rgba(0,0,0,0.35)] transition-all duration-200 hover:brightness-110 hover:saturate-125"
              style={{ clipPath: CLIP_PATH[i], background: STAGE_GRADIENT[i], borderRadius: 6 }}
            >
              <span className="text-2xl font-black text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                {stage.value.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="min-w-0 border-l-2 border-hairline pl-4">
              <p className="truncate text-[13.5px] font-semibold text-primary">
                {stage.conversionFromPrevious !== null && (
                  <span className="mr-1.5 font-extrabold text-accent-light">{stage.conversionFromPrevious.toFixed(1)}%</span>
                )}
                {stage.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
