import { fmtBRL, ORIGEM_ORGANICO } from "@/lib/constants";
import { panelClass, panelStyle } from "@/lib/glass-panel";
import type { ComercialKPIs } from "@/lib/metrics/kpis";

// Quanto do mês veio sozinho pelo site — um RECORTE dos números de cima,
// não uma parcela tirada deles. Estes leads já estão contados no funil, nos
// pódios e no faturamento; aqui eles aparecem de novo, sozinhos, para
// responder "e o site, trouxe alguma coisa?".
//
// Faixa, e não uma segunda KpiRow: os cinco números não competem com TCV
// Fechado e Meta. Card cheio para cada um faria o olho ler dois dashboards
// de mesmo peso na mesma tela.
//
// Aparece mesmo zerado, de propósito. Sumir com a faixa num mês sem lead
// orgânico esconderia justamente o fato que ela existe para mostrar — que
// o site não trouxe nada —, e ainda faria a página mudar de forma de um mês
// para o outro.

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function Stat({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="font-display text-[10.5px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <span
        className={
          "text-[clamp(15px,1.6vw,22px)] font-extrabold leading-none tracking-tight tabular-nums " +
          (muted ? "text-secondary" : "text-primary")
        }
      >
        {value}
      </span>
    </div>
  );
}

export function OrganicSummary({ kpis }: { kpis: ComercialKPIs }) {
  const vazio = kpis.total === 0;

  return (
    <div className={`relative overflow-hidden ${panelClass("dark")}`} style={panelStyle("dark")}>
      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-display flex items-center gap-2 text-[15px] font-bold text-primary">
            <LeafIcon className="text-status-good" />
            Orgânico
          </h3>
          <p className="text-[11.5px] text-muted">
            {ORIGEM_ORGANICO.join(" · ")} — já incluídos nos números acima
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-x-7 gap-y-4">
          <Stat label="Leads" value={String(kpis.total)} muted={vazio} />
          <Stat label="Agendadas" value={String(kpis.agendadas)} muted={vazio} />
          <Stat label="Realizadas" value={String(kpis.realizadas)} muted={vazio} />
          <Stat label="Fechados" value={String(kpis.fechados)} muted={vazio} />
          <Stat label="Faturamento" value={fmtBRL(kpis.mrr)} muted={kpis.mrr === 0} />
        </div>
      </div>
    </div>
  );
}
