import { fmtBRL } from "@/lib/constants";
import type { CreativeRow } from "@/lib/metrics/marketing";

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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      <div className="border-b border-hairline bg-black/20 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">🎨 Por Criativo</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {COLUMNS.map((h, i) => (
                <th
                  key={h}
                  className={
                    "sticky top-0 z-10 whitespace-nowrap bg-surface-1 px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-muted backdrop-blur-md " +
                    (i > 0 ? "text-right" : "")
                  }
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {creatives.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-3 text-xs text-muted">
                  Sem dados para este mês
                </td>
              </tr>
            ) : (
              creatives.map((c) => (
                <tr key={c.name} className="transition hover:bg-white/5">
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-xs font-bold text-primary">
                    {c.name}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {fmtBRL(c.spend)}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {c.leads}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs tabular-nums text-primary">
                    {c.cpl ? fmtBRL(c.cpl) : "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {c.agendamentos}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs tabular-nums text-primary">
                    {c.custoAgendamento ? fmtBRL(c.custoAgendamento) : "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {c.comparecimentos}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs tabular-nums text-primary">
                    {c.custoComparecimento ? fmtBRL(c.custoComparecimento) : "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {c.fechamentos}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs tabular-nums text-primary">
                    {c.cac ? fmtBRL(c.cac) : "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {fmtBRL(c.valorFechado)}
                  </td>
                  <td className="whitespace-nowrap border-b border-white/[0.03] px-3 py-2.5 text-right text-xs font-bold tabular-nums text-primary">
                    {c.roas ? `${c.roas.toFixed(2)}x` : "—"}
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
