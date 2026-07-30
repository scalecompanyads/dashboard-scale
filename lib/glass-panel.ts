import type { CSSProperties } from "react";

// Glass card with real color baked in — a flat near-invisible tint reads as
// dull/opaque when there isn't a strong neon blob directly behind it. A
// subtle blue gradient gives the card its own identity regardless of what's
// behind it, while staying translucent enough for the ambient glow to still
// show through on top of it.
export const glassPanelClass = "rounded-card p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl";

export const glassPanelStyle: CSSProperties = {
  backgroundImage: "linear-gradient(160deg, rgba(47,128,237,0.14) 0%, rgba(13,18,27,0.78) 42%, rgba(13,18,27,0.85) 100%)",
};
