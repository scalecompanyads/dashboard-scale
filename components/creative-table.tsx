import { fmtBRL } from "@/lib/constants";
import type { CreativeRow } from "@/lib/metrics/marketing";
import {
  emptyStateClass,
  tableHeaderTitleClass,
  tableHeaderWrapClass,
  tableScrollClass,
  tableShellClass,
  tdNameClass,
  tdNumClass,
  tdNumMutedClass,
  thBaseClass,
  thRightClass,
  trBaseClass,
} from "@/lib/table-styles";

const COLUMNS = [
  "Criativo",
  "Investimento",
  "Leads",
  "CPL",
  "Agend.",
  "Custo/Agend.",
  "Compar.",
  "Custo/Compar.",
  "Fechados",
  "CAC",
  "Valor Fechado",
  "ROAS",
];

export function CreativeTable({ creatives }: { creatives: CreativeRow[] }) {
  return (
    <div className={tableShellClass}>
      <div className={tableHeaderWrapClass}>
        <span className={tableHeaderTitleClass}>Por Criativo</span>
        <span className="text-[11px] font-medium text-muted">{creatives.length} criativos</span>
      </div>
      <div className={tableScrollClass}>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {COLUMNS.map((h, i) => (
                <th key={h} className={i > 0 ? thRightClass : thBaseClass}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {creatives.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className={emptyStateClass}>
                  Sem dados para este mês
                </td>
              </tr>
            ) : (
              creatives.map((c) => (
                <tr key={c.name} className={trBaseClass}>
                  <td className={tdNameClass}>{c.name}</td>
                  <td className={tdNumClass}>{fmtBRL(c.spend)}</td>
                  <td className={tdNumClass}>{c.leads}</td>
                  <td className={tdNumMutedClass}>{c.cpl ? fmtBRL(c.cpl) : "—"}</td>
                  <td className={tdNumClass}>{c.agendamentos}</td>
                  <td className={tdNumMutedClass}>{c.custoAgendamento ? fmtBRL(c.custoAgendamento) : "—"}</td>
                  <td className={tdNumClass}>{c.comparecimentos}</td>
                  <td className={tdNumMutedClass}>{c.custoComparecimento ? fmtBRL(c.custoComparecimento) : "—"}</td>
                  <td className={tdNumClass}>{c.fechamentos}</td>
                  <td className={tdNumMutedClass}>{c.cac ? fmtBRL(c.cac) : "—"}</td>
                  <td className={tdNumClass}>{fmtBRL(c.valorFechado)}</td>
                  <td className={tdNumClass}>{c.roas ? `${c.roas.toFixed(2)}x` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
