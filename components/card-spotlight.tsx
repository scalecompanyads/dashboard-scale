"use client";

import { useRef } from "react";

/**
 * Wraps a card with a soft light that follows the cursor — the interactive
 * touch that makes a glass card feel alive instead of a static gradient.
 * Tracks the pointer via a plain ref + CSS custom properties (no per-frame
 * React state, no extra dependency) rather than a motion-value library.
 */
export function CardSpotlight({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current!.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    ref.current!.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={`group/spot relative ${className ?? ""}`} style={style}>
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(160px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(17,77,219,0.4), transparent 70%)",
        }}
        aria-hidden
      />
      {children}
    </div>
  );
}
