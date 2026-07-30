import type { FunnelData } from "@/lib/metrics/funnel";
import { StatusBadge, toneFromPct } from "@/components/status-badge";
import { glassPanelClass, glassPanelStyle } from "@/lib/glass-panel";
import { IconCalendarCheck, IconCheckCircle, IconHandshake, IconUsers } from "@/components/kpi-icons";

// Same vivid brand blue as the base for every stage (not the pale end of
// the old light->dark ramp) — each stage just mixes in progressively more
// black, so the funnel reads as "the logo's blue" fading to depth rather
// than fading to pale.
const STAGE_GRADIENT = [
  "linear-gradient(135deg, var(--color-accent-light), var(--color-accent-primary))",
  "linear-gradient(135deg, var(--color-accent-primary), color-mix(in srgb, var(--color-accent-primary) 72%, black))",
  "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-primary) 72%, black), color-mix(in srgb, var(--color-accent-primary) 48%, black))",
  "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-primary) 48%, black), color-mix(in srgb, var(--color-accent-primary) 26%, black))",
];

const STAGE_ICON = [IconUsers, IconCalendarCheck, IconCheckCircle, IconHandshake];

const CLIP_PATH = [
  "polygon(0% 0%, 100% 0%, 94% 100%, 6% 100%)",
  "polygon(6% 0%, 94% 0%, 88% 100%, 12% 100%)",
  "polygon(12% 0%, 88% 0%, 82% 100%, 18% 100%)",
  "polygon(18% 0%, 82% 0%, 76% 100%, 24% 100%)",
];

export function FunnelChart({ data }: { data: FunnelData }) {
  return (
    <div className={`relative flex h-full flex-col overflow-hidden ${glassPanelClass}`} style={glassPanelStyle}>
      <div className="relative mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-primary">Funil de Conversão</h3>
        <StatusBadge label={`${data.totalConversionPct.toFixed(1)}% conversão total`} tone={toneFromPct(data.totalConversionPct)} />
      </div>

      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-3.5">
        {data.stages.map((stage, i) => {
          const Icon = STAGE_ICON[i];
          return (
            <div key={stage.key} className="grid grid-cols-2 items-center gap-4">
              <div className="group relative flex h-16 items-center justify-center transition-transform duration-200 hover:scale-[1.02]">
                <div
                  className="absolute inset-0 shadow-[inset_0_2px_14px_rgba(255,255,255,0.18),0_4px_14px_rgba(0,0,0,0.3)]"
                  style={{ clipPath: CLIP_PATH[i], background: STAGE_GRADIENT[i], borderRadius: 6 }}
                  aria-hidden
                />
                <span className="relative text-2xl font-black text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                  {stage.value.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2.5 border-l-2 border-hairline pl-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-primary/12 text-accent-light">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="truncate text-[13.5px] font-semibold text-primary">
                  {stage.conversionFromPrevious !== null && (
                    <span className="mr-1.5 font-extrabold text-accent-light">{stage.conversionFromPrevious.toFixed(1)}%</span>
                  )}
                  {stage.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
