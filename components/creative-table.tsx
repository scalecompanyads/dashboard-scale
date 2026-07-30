import { fmtBRL } from "@/lib/constants";
import type { CreativeRow } from "@/lib/metrics/marketing";
import {
  emptyStateClass,
  tableHeaderTitleClass,
  tableHeaderWrapClass,
  tableScrollClass,
  tableShellClass,
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

// Bespoke (not the shared table-styles) — every numeric column is centered
// and runs a touch bigger than the other tables since it's the one people
// actually study row by row. The Criativo column stays left-aligned (name +
// thumbnail read better that way than centered).
const thClass =
  "sticky top-0 z-10 whitespace-nowrap bg-surface-1 px-4 py-3 text-center text-[clamp(11.5px,0.75cqw,14px)] font-bold uppercase tracking-wide text-muted backdrop-blur-xl";
const thLeftClass = `${thClass} text-left`;
const tdClass = "whitespace-nowrap border-b border-hairline/70 px-4 py-3.5 text-center text-[clamp(14px,0.9cqw,17px)]";
const tdNum = `${tdClass} font-bold tabular-nums text-primary`;
const tdNumMuted = `${tdClass} tabular-nums text-secondary`;

function CreativeThumb({ url, name }: { url?: string; name: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Meta CDN URL, domain varies per creative
      <img src={url} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-hairline object-cover" loading="lazy" />
    );
  }
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-hairline bg-white/[0.06] text-[14px] font-bold text-secondary">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function CreativeTable({ creatives, thumbnails }: { creatives: CreativeRow[]; thumbnails: Map<string, string> }) {
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
                <th key={h} className={i === 0 ? thLeftClass : thClass}>
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
                  <td className={`${tdClass} whitespace-normal text-left`}>
                    <div className="flex items-center justify-start gap-2.5">
                      <CreativeThumb url={c.adId ? thumbnails.get(c.adId) : undefined} name={c.name} />
                      <span className="max-w-[220px] truncate text-left font-bold text-primary">{c.name}</span>
                    </div>
                  </td>
                  <td className={tdNum}>{fmtBRL(c.spend)}</td>
                  <td className={tdNum}>{c.leads}</td>
                  <td className={tdNumMuted}>{c.cpl ? fmtBRL(c.cpl) : "—"}</td>
                  <td className={tdNum}>{c.agendamentos}</td>
                  <td className={tdNumMuted}>{c.custoAgendamento ? fmtBRL(c.custoAgendamento) : "—"}</td>
                  <td className={tdNum}>{c.comparecimentos}</td>
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
