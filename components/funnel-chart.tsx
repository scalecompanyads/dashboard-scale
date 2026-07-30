import type { FunnelData } from "@/lib/metrics/funnel";
import { StatusBadge } from "@/components/status-badge";
import { glassPanelClass, glassPanelStyle } from "@/lib/glass-panel";

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

const CLIP_PATH = [
  "polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)",
  "polygon(5% 0%, 95% 0%, 83% 100%, 17% 100%)",
  "polygon(10% 0%, 90% 0%, 76% 100%, 24% 100%)",
  "polygon(15% 0%, 85% 0%, 69% 100%, 31% 100%)",
];

// Row layout — bar on the left, label + conversion % beside it on the
// right (not stacked below), so each stage reads as one line instead of
// forcing the eye to jump down before finding out what a number means.
export function FunnelChart({ data }: { data: FunnelData }) {
  return (
    <div className={`relative flex h-full flex-col overflow-hidden ${glassPanelClass}`} style={glassPanelStyle}>
      {/* discreet ambient light behind the whole stack, matching the glow
          treatment already used behind the podiums' 1st place */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-primary">Funil de Conversão</h3>
        {/* purely informative (no target to fall short of), so always the
            neutral blue tone — red/green would wrongly imply a goal */}
        <StatusBadge label={`${data.totalConversionPct.toFixed(1)}% conversão total`} tone="accent" />
      </div>

      {/* min-h-0 lets this flex-1 child actually shrink to the space the
          panel has (440px minus header/padding) instead of forcing the
          panel taller than its row — the classic flexbox overflow trap.
          justify-center + a small fixed gap keeps the 4 rows close together
          instead of justify-between stretching the leftover height into
          growing gaps between them. */}
      <div className="relative flex min-h-0 w-full flex-1 flex-col justify-center gap-2.5">
        {data.stages.map((stage, i) => (
          <div key={stage.key} className="group flex items-center gap-3">
            {/* pseudo-3D bar: light-blue top edge + inset bottom shadow read
                as a beveled, lit-from-above volume; filter drop-shadow (not
                box-shadow) so the elevation shadow follows the clipped
                trapezoid silhouette instead of the invisible bounding box */}
            <div
              className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-[1.04]"
              style={{
                clipPath: CLIP_PATH[i],
                background: STAGE_GRADIENT[i],
                borderRadius: 6,
                boxShadow:
                  "inset 0 2px 0 color-mix(in srgb, var(--color-accent-light) 70%, white), inset 0 -10px 14px rgba(0,0,0,0.4)",
                filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.5))",
              }}
            >
              {/* soft vertical reflection sweep */}
              <div
                className="pointer-events-none absolute inset-y-0 left-[18%] w-[22%] opacity-40"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.28), transparent)" }}
                aria-hidden
              />
              <span className="relative text-lg font-black text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                {stage.value.toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              {stage.conversionFromPrevious !== null && (
                <span className="shrink-0 rounded-full bg-accent-primary px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_10px_rgba(47,128,237,0.5)]">
                  {stage.conversionFromPrevious.toFixed(1)}%
                </span>
              )}
              <p className="text-[12px] font-semibold leading-snug text-secondary">{stage.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
