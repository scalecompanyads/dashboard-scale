import { fmtBRL } from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";

export function ClosedDealsTable({ closings }: { closings: Lead[] }) {
  const sorted = [...closings].sort((a, b) => (b.dt_fecha ?? "").localeCompare(a.dt_fecha ?? ""));

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      <div className="border-b border-hairline bg-black/20 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">✅ Clientes Fechados</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {["Cliente", "Closer", "Data", "Valor"].map((h, i) => (
                <th
                  key={h}
                  className={
                    "sticky top-0 z-10 bg-surface-1 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted backdrop-blur-md " +
                    (i >= 2 ? "text-right" : "")
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-xs text-muted">
                  Sem dados para este mês
                </td>
              </tr>
            ) : (
              sorted.map((item) => (
                <tr key={item.monday_item_id} className="transition hover:bg-white/5">
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-xs font-bold text-primary">
                    {item.item_name || "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-xs text-secondary">
                    {item.closer || "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs tabular-nums text-primary">
                    {item.dt_fecha ? item.dt_fecha.split("-").reverse().join("/").slice(0, 5) : "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {fmtBRL(item.mrr_value)}
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
