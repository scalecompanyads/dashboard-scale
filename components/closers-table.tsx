import { fmtBRL } from "@/lib/constants";
import type { CloserStats } from "@/lib/metrics/closers";
import { PctBadge } from "@/components/status-badge";
import {
  emptyStateClass,
  tableHeaderTitleClass,
  tableHeaderWrapClass,
  tableScrollClass,
  tableShellClass,
  tdNameClass,
  tdNumClass,
  thBaseClass,
  thRightClass,
  trBaseClass,
} from "@/lib/table-styles";

export function ClosersTable({ closers }: { closers: CloserStats[] }) {
  return (
    <div className={tableShellClass}>
      <div className={tableHeaderWrapClass}>
        <span className={tableHeaderTitleClass}>Closers</span>
        <span className="text-[11px] font-medium text-muted">{closers.length} no período</span>
      </div>
      <div className={tableScrollClass}>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {["Closer", "Reuniões", "Fechados", "Conv.", "Valor Fechado"].map((h, i) => (
                <th key={h} className={i > 0 ? thRightClass : thBaseClass}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {closers.length === 0 ? (
              <tr>
                <td colSpan={5} className={emptyStateClass}>
                  Sem dados para este mês
                </td>
              </tr>
            ) : (
              closers.map((c) => (
                <tr key={c.name} className={trBaseClass}>
                  <td className={tdNameClass}>{c.name}</td>
                  <td className={tdNumClass}>{c.reunioes}</td>
                  <td className={tdNumClass}>{c.fechados}</td>
                  <td className="whitespace-nowrap border-b border-hairline/70 px-4 py-3.5 text-right">
                    <PctBadge num={c.fechados} den={c.reunioes} />
                  </td>
                  <td className={tdNumClass}>{fmtBRL(c.mrr)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
