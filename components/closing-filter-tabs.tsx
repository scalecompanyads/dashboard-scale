"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ClosingFilter } from "@/lib/data/leads";
import { dateInputClass, filterKickerClass, tabClass, tabTrackClass } from "@/lib/control-styles";

const FILTERS: { value: ClosingFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "mesmo_mes", label: "Leads do mês" },
  { value: "outros_meses", label: "Outros meses" },
];

export function ClosingFilterTabs({
  filter,
  dateFrom,
  dateTo,
  showCohortCaveat = false,
}: {
  filter: ClosingFilter;
  dateFrom?: string;
  dateTo?: string;
  /** Modo Semanal/Diário com "Outros meses": ver a nota no rodapé do componente. */
  showCohortCaveat?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={filterKickerClass}>Fechamentos</span>

      <div className={tabTrackClass}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setParam({ filter: f.value === "all" ? undefined : f.value })}
            className={tabClass(filter === f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "outros_meses" && (
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span>entrada de</span>
          <input
            type="date"
            value={dateFrom ?? ""}
            onChange={(e) => setParam({ dateFrom: e.target.value || undefined })}
            className={dateInputClass}
          />
          <span>até</span>
          <input
            type="date"
            value={dateTo ?? ""}
            onChange={(e) => setParam({ dateTo: e.target.value || undefined })}
            className={dateInputClass}
          />
        </div>
      )}

      {/* A coorte é sempre MENSAL, em qualquer modo de visualização — "Leads
          do mês" precisa continuar significando "o lead entrou neste mês", e
          não "entrou hoje". A consequência é que, num dia ou numa semana,
          "Outros meses" zera as colunas de leads e reuniões por definição
          (quem entrou hoje entrou neste mês), enquanto a de fechamentos segue
          perfeitamente útil: dos que fecharam hoje, quantos vieram de lead
          antigo. Explicar o zero é melhor do que escondê-lo — e melhor do que
          sumir com a aba, que mudaria todo número da tela sem causa visível
          na hora de trocar de visão. */}
      {showCohortCaveat && filter === "outros_meses" && (
        <span className="text-[11.5px] font-medium text-muted">
          a coorte é sempre do mês — nenhum lead que entrou no período pertence a &ldquo;outros meses&rdquo;
        </span>
      )}
    </div>
  );
}
