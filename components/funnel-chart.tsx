import type { FunnelData } from "@/lib/metrics/funnel";

const CLIP_PATH: Record<number, string> = {
  0: "polygon(0% 0%, 100% 0%, 94% 100%, 6% 100%)",
  1: "polygon(6% 0%, 94% 0%, 88% 100%, 12% 100%)",
  2: "polygon(12% 0%, 88% 0%, 82% 100%, 18% 100%)",
  3: "polygon(18% 0%, 82% 0%, 76% 100%, 24% 100%)",
};

// Ordinal ramp — one hue (blue), monotone light -> dark. Validated with
// scripts/validate_palette.js --ordinal against this app's #03050a canvas.
const STAGE_COLOR = ["var(--color-funnel-1)", "var(--color-funnel-2)", "var(--color-funnel-3)", "var(--color-funnel-4)"];

export function FunnelChart({ data }: { data: FunnelData }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-surface-1 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-secondary">
        Taxa de Conversão por Etapa (Funil)
      </h3>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-3">
        {data.stages.map((stage, i) => (
          <div key={stage.key} className="grid grid-cols-2 items-center gap-4">
            <div
              className="relative flex h-14 items-center justify-center shadow-[inset_0_2px_10px_rgba(255,255,255,0.1),0_4px_15px_rgba(0,0,0,0.3)] transition hover:brightness-110"
              style={{ clipPath: CLIP_PATH[i], background: STAGE_COLOR[i], borderRadius: 8 }}
            >
              <span className="text-2xl font-black text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                {stage.value.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="min-w-0 border-l-2 border-hairline pl-4">
              <p className="truncate text-sm font-semibold text-primary">
                {stage.conversionFromPrevious !== null && (
                  <span className="mr-1.5 font-extrabold text-accent-primary">
                    {stage.conversionFromPrevious.toFixed(1)}%
                  </span>
                )}
                {stage.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-hairline pt-3 text-center text-sm font-semibold text-secondary">
        {data.totalConversionPct.toFixed(1)}% conversão total
      </p>
    </div>
  );
}
