// Shared visual tokens for every DataTable-style component (closers,
// closed-deals, creative). Keeps header/row/cell treatment identical across
// tables without duplicating the same class strings in each file.

// @container (container-type: inline-size) lets th/td use cqw below —
// text scales with this shell's own rendered width, which only actually
// grows on a wide TV layout. At normal desktop widths the cqw term stays
// under the clamp's floor, so the size resolves to the exact old fixed
// px value — nothing moves there.
export const tableShellClass =
  "@container flex h-full flex-col overflow-hidden rounded-card border border-white/15 bg-surface-solid shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_35px_rgba(0,0,0,0.3)]";

export const tableHeaderWrapClass = "flex items-center justify-between border-b border-hairline px-5 py-3.5";

export const tableHeaderTitleClass = "font-display font-bold text-[clamp(15px,1.1cqw,19px)] text-primary";

export const tableScrollClass = "min-h-0 flex-1 overflow-auto px-2 pb-2";

export const thBaseClass =
  "sticky top-0 z-10 whitespace-nowrap bg-surface-1 px-4 py-3 text-left text-[clamp(10.5px,0.7cqw,13px)] font-bold uppercase tracking-wide text-muted backdrop-blur-xl";
export const thRightClass = `${thBaseClass} text-right`;

export const trBaseClass = "transition-colors duration-200 odd:bg-white/[0.02] hover:bg-accent-primary/[0.09]";

export const tdBaseClass = "whitespace-nowrap border-b border-hairline/70 px-4 py-3.5 text-[clamp(13px,0.85cqw,16px)]";
export const tdNameClass = `${tdBaseClass} font-bold text-primary`;
export const tdMutedClass = `${tdBaseClass} text-secondary`;
export const tdNumClass = `${tdBaseClass} text-right font-bold tabular-nums text-primary`;
export const tdNumMutedClass = `${tdBaseClass} text-right tabular-nums text-secondary`;

export const emptyStateClass = "px-4 py-4 text-[13px] text-muted";

// Cor de texto por status de meta (ver statusLowerIsBetter/statusHigherIsBetter
// em lib/constants). "critical" usa o vermelho claro: o vermelho cheio some
// contra o preto do card quando é só texto, sem fundo.
export const metaTextClass = {
  good: "text-status-good",
  warning: "text-status-warning",
  critical: "text-status-critical-light",
  neutral: "text-secondary",
} as const;
