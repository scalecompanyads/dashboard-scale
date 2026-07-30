import { fmtBRL } from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";
import {
  emptyStateClass,
  tableHeaderTitleClass,
  tableHeaderWrapClass,
  tableScrollClass,
  tableShellClass,
  tdMutedClass,
  tdNameClass,
  tdNumClass,
  tdNumMutedClass,
  thBaseClass,
  thRightClass,
  trBaseClass,
} from "@/lib/table-styles";

export function ClosedDealsTable({ closings }: { closings: Lead[] }) {
  const sorted = [...closings].sort((a, b) => (b.dt_fecha ?? "").localeCompare(a.dt_fecha ?? ""));

  return (
    <div className={tableShellClass}>
      <div className={tableHeaderWrapClass}>
        <span className={tableHeaderTitleClass}>Clientes Fechados</span>
        <span className="text-[11px] font-medium text-muted">{sorted.length} no período</span>
      </div>
      <div className={tableScrollClass}>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {["Cliente", "Closer", "Data", "Valor"].map((h, i) => (
                <th key={h} className={i >= 2 ? thRightClass : thBaseClass}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className={emptyStateClass}>
                  Sem dados para este mês
                </td>
              </tr>
            ) : (
              sorted.map((item) => (
                <tr key={item.monday_item_id} className={trBaseClass}>
                  <td className={tdNameClass}>{item.item_name || "—"}</td>
                  <td className={tdMutedClass}>{item.closer || "—"}</td>
                  <td className={tdNumMutedClass}>
                    {item.dt_fecha ? item.dt_fecha.split("-").reverse().join("/").slice(0, 5) : "—"}
                  </td>
                  <td className={tdNumClass}>{fmtBRL(item.mrr_value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
