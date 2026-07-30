"use client";

import { useEffect, useRef, useState } from "react";
import { fmtBRL, fmtBRLCompact } from "@/lib/constants";

const DURATION_MS = 700;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// A plain function prop can't cross the Server -> Client Component boundary
// (it isn't serializable), so formatting is expressed as this small
// serializable spec instead of a callback.
export type NumberFormat =
  | { type: "currency"; sign?: boolean }
  | { type: "currencyCompact" }
  | { type: "percent"; decimals?: number }
  | { type: "integer" }
  | { type: "multiplier"; decimals?: number };

function formatValue(n: number, format: NumberFormat): string {
  switch (format.type) {
    case "currency":
      return format.sign ? `+${fmtBRL(n)}` : fmtBRL(n);
    case "currencyCompact":
      return fmtBRLCompact(n);
    case "percent":
      return `${n.toFixed(format.decimals ?? 1)}%`;
    case "integer":
      return Math.round(n).toLocaleString("pt-BR");
    case "multiplier":
      return `${n.toFixed(format.decimals ?? 2)}x`;
  }
}

/**
 * Counts from whatever it last showed up to `value` whenever `value`
 * changes (month switch, filter change, "Atualizar" refresh). Renders a
 * static `fallback` instead of animating when there's no real number yet
 * (e.g. "—" for an unset goal).
 */
export function AnimatedNumber({
  value,
  format,
  fallback = "—",
}: {
  value: number | null | undefined;
  format: NumberFormat;
  fallback?: string;
}) {
  const [display, setDisplay] = useState(value ?? 0);
  const shownValue = useRef(value ?? 0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (value == null) return;
    const from = shownValue.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const eased = easeOutCubic(progress);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        shownValue.current = to;
        setDisplay(to);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  if (value == null) return <>{fallback}</>;
  return <>{formatValue(display, format)}</>;
}
