import { fmtBRL } from "@/lib/constants";
import type { CloserStats } from "@/lib/metrics/closers";
import { PctTag } from "@/components/pct-tag";

export function ClosersTable({ closers }: { closers: CloserStats[] }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      <div className="border-b border-hairline bg-black/20 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">👤 Closers</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {["Closer", "Reuniões", "Fechados", "Conv.", "Valor Fechado"].map((h, i) => (
                <th
                  key={h}
                  className={
                    "sticky top-0 z-10 bg-surface-1 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted backdrop-blur-md " +
                    (i > 0 ? "text-right" : "")
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {closers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-xs text-muted">
                  Sem dados para este mês
                </td>
              </tr>
            ) : (
              closers.map((c) => (
                <tr key={c.name} className="transition hover:bg-white/5">
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-xs font-bold text-primary">
                    {c.name}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {c.reunioes}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {c.fechados}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right">
                    <PctTag num={c.fechados} den={c.reunioes} />
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {fmtBRL(c.mrr)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
