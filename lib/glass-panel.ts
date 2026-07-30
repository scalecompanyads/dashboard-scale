import type { CSSProperties } from "react";

// Glass card with real color baked in — a flat near-invisible tint reads as
// dull/opaque when there isn't a strong neon blob directly behind it. A
// subtle blue gradient gives the card its own identity regardless of what's
// behind it, while staying translucent enough for the ambient glow to still
// show through on top of it.
export const glassPanelClass =
  "rounded-card border border-[rgba(96,165,250,0.12)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_35px_rgba(0,0,0,0.35)] backdrop-blur-2xl";

export const glassPanelStyle: CSSProperties = {
  backgroundImage: "linear-gradient(160deg, rgba(47,128,237,0.14) 0%, rgba(13,18,27,0.78) 42%, rgba(13,18,27,0.85) 100%)",
};
