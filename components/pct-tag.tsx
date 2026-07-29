export function PctTag({ num, den }: { num: number; den: number }) {
  if (!den) {
    return (
      <span className="inline-block rounded-full border border-white/10 bg-accent-primary/15 px-2.5 py-1 text-xs font-extrabold text-accent-primary">
        —
      </span>
    );
  }

  const pct = (num / den) * 100;
  const cls =
    pct >= 50
      ? "bg-status-good/15 text-status-good shadow-[0_0_15px_rgba(12,163,12,0.35)]"
      : pct >= 20
        ? "bg-accent-primary/15 text-accent-primary shadow-[0_0_15px_var(--accent-primary-glow)]"
        : "bg-status-critical/15 text-status-critical shadow-[0_0_15px_rgba(208,59,59,0.35)]";

  return (
    <span className={`inline-block rounded-full border border-white/10 px-2.5 py-1 text-xs font-extrabold ${cls}`}>
      {pct.toFixed(1)}%
    </span>
  );
}
