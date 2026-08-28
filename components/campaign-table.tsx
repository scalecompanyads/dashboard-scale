import { fmtBRL, META_CPL, META_TAXA_CONVERSAO, statusHigherIsBetter, statusLowerIsBetter } from "@/lib/constants";
import type { CampaignRow } from "@/lib/metrics/marketing";
import {
  emptyStateClass,
  metaTextClass,
  tableHeaderTitleClass,
  tableHeaderWrapClass,
  tableScrollClass,
  tableShellClass,
  trBaseClass,
} from "@/lib/table-styles";

// Um nível acima da tabela de criativo: a campanha é onde a verba é de fato
// alocada, então é nela que a decisão de escalar/cortar acontece. Mesmas
// colunas do criativo (para as duas se lerem igual) + "Criativos" e a Taxa
// de Conversão colorida contra a meta.

const COLUMNS: { label: string; hint?: string }[] = [
  { label: "Campanha" },
  { label: "Criativos", hint: "Anúncios distintos que rodaram nesta campanha no período" },
  { label: "Investimento", hint: "Gasto em Meta Ads no período" },
  { label: "Leads", hint: "Leads no Monday com origem Meta Ads atribuídos a criativos desta campanha" },
  { label: "CPL", hint: `Investimento / leads — meta: até ${fmtBRL(META_CPL)}` },
  { label: "Agend.", hint: "Reuniões agendadas" },
  { label: "Taxa Agend.", hint: "Agendamentos / leads" },
  { label: "Compar.", hint: "Reuniões realizadas" },
  { label: "Taxa Compar.", hint: "Comparecimentos / agendamentos" },
  { label: "Taxa de Conversão", hint: `Comparecimentos / leads — meta: ${META_TAXA_CONVERSAO}%` },
  { label: "Custo/Compar.", hint: "Investimento / comparecimentos" },
  { label: "Fechados", hint: "Fechamentos no período" },
  { label: "CAC", hint: "Investimento / fechamentos" },
  { label: "Valor Fechado", hint: "MRR + TCV fechado" },
  { label: "ROAS", hint: "Valor fechado / investimento" },
];

const thClass =
  "sticky top-0 z-10 whitespace-nowrap bg-surface-1 px-4 py-3 text-center text-[clamp(11.5px,0.75cqw,14px)] font-bold uppercase tracking-wide text-muted backdrop-blur-xl";
const thLeftClass = `${thClass} text-left`;
const tdClass = "whitespace-nowrap border-b border-hairline/70 px-4 py-3.5 text-center text-[clamp(14px,0.9cqw,17px)]";
const tdNum = `${tdClass} font-bold tabular-nums text-primary`;
const tdNumMuted = `${tdClass} tabular-nums text-secondary`;

export function CampaignTable({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <div className={tableShellClass}>
      <div className={tableHeaderWrapClass}>
        <span className={tableHeaderTitleClass}>Por Campanha</span>
        <span className="text-[11px] font-medium text-muted">
          {campaigns.length} {campaigns.length === 1 ? "campanha" : "campanhas"} · meta CPL {fmtBRL(META_CPL)} · conversão {META_TAXA_CONVERSAO}%
        </span>
      </div>
      <div className={tableScrollClass}>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {COLUMNS.map((c, i) => (
                <th key={c.label} className={i === 0 ? thLeftClass : thClass} title={c.hint}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className={emptyStateClass}>
                  Sem dados para este período
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.name} className={trBaseClass}>
                  <td className={`${tdClass} whitespace-normal text-left`}>
                    <span className="block max-w-[320px] truncate font-bold text-primary" title={c.name}>
                      {c.name}
                    </span>
                  </td>
                  <td className={tdNumMuted}>{c.criativos || "—"}</td>
                  <td className={tdNum}>{fmtBRL(c.spend)}</td>
                  <td className={tdNum}>{c.leads}</td>
                  <td className={`${tdClass} font-bold tabular-nums ${metaTextClass[statusLowerIsBetter(c.cpl, META_CPL)]}`}>
                    {c.cpl ? fmtBRL(c.cpl) : "—"}
                  </td>
                  <td className={tdNum}>{c.agendamentos}</td>
                  <td className={tdNumMuted}>{c.leads ? `${c.taxaAgendamento.toFixed(1)}%` : "—"}</td>
                  <td className={tdNum}>{c.comparecimentos}</td>
                  <td className={tdNumMuted}>{c.agendamentos ? `${c.taxaComparecimento.toFixed(1)}%` : "—"}</td>
                  <td className={`${tdClass} font-bold tabular-nums ${metaTextClass[statusHigherIsBetter(c.taxaConversao, META_TAXA_CONVERSAO)]}`}>
                    {c.leads ? `${c.taxaConversao.toFixed(1)}%` : "—"}
                  </td>
                  <td className={tdNumMuted}>{c.custoComparecimento ? fmtBRL(c.custoComparecimento) : "—"}</td>
                  <td className={tdNum}>{c.fechamentos}</td>
                  <td className={tdNumMuted}>{c.cac ? fmtBRL(c.cac) : "—"}</td>
                  <td className={tdNum}>{fmtBRL(c.valorFechado)}</td>
                  <td className={tdNum}>{c.roas ? `${c.roas.toFixed(2)}x` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
