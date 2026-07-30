export function KpiRow({ children, cols = 7 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div
      className="grid gap-3.5"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${Math.max(120, Math.floor(920 / cols))}px, 1fr))` }}
    >
      {children}
    </div>
  );
}
