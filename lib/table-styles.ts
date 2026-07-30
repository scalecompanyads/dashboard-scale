// Shared visual tokens for every DataTable-style component (closers,
// closed-deals, creative). Keeps header/row/cell treatment identical across
// tables without duplicating the same class strings in each file.

export const tableShellClass =
  "flex h-full flex-col overflow-hidden rounded-card bg-surface-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-xl";

export const tableHeaderWrapClass = "flex items-center justify-between border-b border-hairline px-5 py-3.5";

export const tableHeaderTitleClass = "text-[14px] font-bold text-primary";

export const tableScrollClass = "min-h-0 flex-1 overflow-auto px-2 pb-2";

export const thBaseClass =
  "sticky top-0 z-10 whitespace-nowrap bg-surface-1 px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-wide text-muted backdrop-blur-xl";
export const thRightClass = `${thBaseClass} text-right`;

export const trBaseClass = "transition-colors duration-200 odd:bg-white/[0.02] hover:bg-accent-primary/[0.09]";

export const tdBaseClass = "whitespace-nowrap border-b border-hairline/70 px-4 py-3.5 text-[13px]";
export const tdNameClass = `${tdBaseClass} font-bold text-primary`;
export const tdMutedClass = `${tdBaseClass} text-secondary`;
export const tdNumClass = `${tdBaseClass} text-right font-bold tabular-nums text-primary`;
export const tdNumMutedClass = `${tdBaseClass} text-right tabular-nums text-secondary`;

export const emptyStateClass = "px-4 py-4 text-[13px] text-muted";
