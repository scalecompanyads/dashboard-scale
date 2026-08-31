"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  FIRST_DATA_MONTH,
  MONTHS,
  monthRangeOf,
  parseISODate,
  previousRange,
  rangeLabel,
  rangeLength,
  type DateRange,
} from "@/lib/constants";
import { controlClass, dateInputClass, chevronStyle } from "@/lib/control-styles";

// Filtro de período do Marketing. Substitui o par de selects mês/ano por um
// intervalo livre ('from'/'to' na URL) — o time precisa isolar recortes
// específicos (a semana em que um criativo novo subiu, os 10 dias de um
// teste) e comparar um contra o outro, o que o recorte mensal não permitia.
// O mês inteiro continua a um clique de distância nos atalhos.

interface Preset {
  id: string;
  label: string;
  range: (today: string) => DateRange;
}

const SHORTCUTS: Preset[] = [
  { id: "hoje", label: "Hoje", range: (t) => ({ from: t, to: t }) },
  { id: "7d", label: "Últimos 7 dias", range: (t) => ({ from: addDays(t, -6), to: t }) },
  { id: "14d", label: "Últimos 14 dias", range: (t) => ({ from: addDays(t, -13), to: t }) },
  { id: "30d", label: "Últimos 30 dias", range: (t) => ({ from: addDays(t, -29), to: t }) },
  {
    id: "mes-atual",
    label: "Este mês",
    range: (t) => monthRangeOf(parseISODate(t).getUTCFullYear(), parseISODate(t).getUTCMonth() + 1),
  },
  {
    id: "mes-anterior",
    label: "Mês passado",
    range: (t) => {
      const d = parseISODate(t);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      return m === 1 ? monthRangeOf(y - 1, 12) : monthRangeOf(y, m - 1);
    },
  },
];

/** Meses fechados disponíveis, do mais recente para o mais antigo. */
function monthOptions(today: string) {
  const d = parseISODate(today);
  const [firstYear, firstMonth] = FIRST_DATA_MONTH.split("-").map(Number);
  const out: { id: string; label: string; range: DateRange }[] = [];
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth() + 1;
  while (y > firstYear || (y === firstYear && m >= firstMonth)) {
    out.push({ id: `m:${y}-${m}`, label: `${MONTHS[m - 1]} ${y}`, range: monthRangeOf(y, m) });
    m--;
    if (m < 1) {
      m = 12;
      y--;
    }
  }
  return out;
}

export function DateRangeSelect({ range, today }: { range: DateRange; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Espelho local das duas pontas: o input nativo dispara onChange também
  // com data incompleta/vazia, e navegar a cada tecla deixaria o filtro
  // inutilizável — o commit só sai quando as duas pontas formam um
  // intervalo válido. Enquanto o router.push do commit não resolve, é o
  // draft que segura o valor recém-digitado na tela.
  const [draft, setDraft] = useState(range);
  const [committed, setCommitted] = useState(range);
  // Ajuste de estado derivado durante o render (e não num efeito): quando o
  // intervalo muda por fora — atalho, botão de voltar — o draft acompanha.
  if (committed.from !== range.from || committed.to !== range.to) {
    setCommitted(range);
    setDraft(range);
  }

  const months = monthOptions(today);
  const shortcuts = SHORTCUTS.map((p) => ({ id: p.id, label: p.label, range: p.range(today) }));
  const matched = [...shortcuts, ...months].find((p) => p.range.from === range.from && p.range.to === range.to);

  function apply(next: DateRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", next.from);
    params.set("to", next.to);
    // 'year'/'month' eram o filtro antigo; deixá-los para trás evitaria que
    // um link salvo sobrescrevesse o intervalo recém-escolhido.
    params.delete("year");
    params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  }

  function onPreset(id: string) {
    const preset = [...shortcuts, ...months].find((p) => p.id === id);
    if (preset) apply(preset.range);
  }

  function onEdge(edge: "from" | "to", value: string) {
    const next = { ...draft, [edge]: value };
    setDraft(next);
    if (!next.from || !next.to) return;
    // Inverter as pontas é erro de digitação comum ("de 20 até 10") — em vez
    // de devolver zero linhas, o intervalo é normalizado.
    apply(next.from <= next.to ? next : { from: next.to, to: next.from });
  }

  const dias = rangeLength(range);
  const anterior = previousRange(range);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        value={matched?.id ?? "custom"}
        onChange={(e) => onPreset(e.target.value)}
        className={controlClass}
        style={chevronStyle}
        aria-label="Período"
      >
        {!matched && <option value="custom">Personalizado</option>}
        <optgroup label="Atalhos">
          {shortcuts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Meses">
          {months.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </optgroup>
      </select>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={draft.from}
          max={today}
          onChange={(e) => onEdge("from", e.target.value)}
          className={dateInputClass}
          aria-label="Data inicial"
        />
        <span className="text-[12px] font-semibold text-muted">até</span>
        <input
          type="date"
          value={draft.to}
          max={today}
          onChange={(e) => onEdge("to", e.target.value)}
          className={dateInputClass}
          aria-label="Data final"
        />
      </div>

      {/* Deixa explícito contra qual janela os indicadores de variação comparam
          — sem isso um "+12%" num recorte livre não diz +12% em relação a quê. */}
      <span className="whitespace-nowrap text-[11.5px] font-medium text-muted">
        {dias} {dias === 1 ? "dia" : "dias"} · vs. {rangeLabel(anterior)}
      </span>
    </div>
  );
}
