import type { CSSProperties } from "react";

// Near-transparent glass card: barely-there fill so the ambient neon blobs
// (see app/layout.tsx) show through the blur. No visible border — just the
// translucent fill + blur + shadow to separate it from the canvas.
export const glassPanelClass = "rounded-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl";

export const glassPanelStyle: CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.025)",
};
