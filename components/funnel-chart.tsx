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
  "polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)",
  "polygon(6% 0%, 94% 0%, 86% 100%, 14% 100%)",
  "polygon(12% 0%, 88% 0%, 80% 100%, 20% 100%)",
  "polygon(18% 0%, 82% 0%, 74% 100%, 26% 100%)",
];

// Single-column stack (not a two-column shape+label grid) so the funnel
// reads cleanly at the narrower ~30% width it now shares a row with the
// two podiums — the count sits right on the bar, label+conversion below.
export function FunnelChart({ data }: { data: FunnelData }) {
  return (
    <div className={`relative flex h-full flex-col overflow-hidden ${glassPanelClass}`} style={glassPanelStyle}>
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-primary">Funil de Conversão</h3>
        {/* purely informative (no target to fall short of), so always the
            neutral blue tone — red/green would wrongly imply a goal */}
        <StatusBadge label={`${data.totalConversionPct.toFixed(1)}% conversão total`} tone="accent" />
      </div>

      {/* min-h-0 lets this flex-1 child actually shrink to the space the
          panel has (440px minus header/padding) instead of forcing the
          panel taller than its row — the classic flexbox overflow trap.
          justify-between (gap as a floor) spreads the 4 bars evenly across
          that space instead of clumping in the vertical center. */}
      <div className="relative flex min-h-0 w-full flex-1 flex-col justify-between gap-3">
        {data.stages.map((stage, i) => (
          <div key={stage.key} className="group relative">
            {/* bar-wrapper: the % badge anchors to THIS (the bar), not the
                stage block as a whole, so it straddles the bar's own bottom
                edge instead of drifting down to the label's edge */}
            <div className="relative">
              {/* pseudo-3D bar: inset top highlight + bottom-inner shadow read
                  as a beveled, lit-from-above volume; filter drop-shadow (not
                  box-shadow) so the elevation shadow follows the clipped
                  trapezoid silhouette instead of the invisible bounding box */}
              <div
                className="relative flex h-14 items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]"
                style={{
                  clipPath: CLIP_PATH[i],
                  background: STAGE_GRADIENT[i],
                  borderRadius: 7,
                  boxShadow: "inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -10px 14px rgba(0,0,0,0.4)",
                  filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.5))",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                  style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3), transparent)" }}
                  aria-hidden
                />
                <span className="relative text-xl font-black text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                  {stage.value.toLocaleString("pt-BR")}
                </span>
              </div>

              {/* conversion % stamped straddling the bar's bottom edge, like a seal */}
              {stage.conversionFromPrevious !== null && (
                <span className="absolute left-1/2 bottom-0 z-10 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent-primary px-2 py-0.5 text-[10.5px] font-extrabold text-white shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_10px_rgba(47,128,237,0.5)]">
                  {stage.conversionFromPrevious.toFixed(1)}%
                </span>
              )}
            </div>

            <p className="mt-2.5 truncate text-center text-[11.5px] font-semibold text-secondary">{stage.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
