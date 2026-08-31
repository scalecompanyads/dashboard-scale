"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addDays, nextBusinessDay, previousBusinessDay } from "@/lib/constants";
import { FIRST_DATA_DAY, VIEW_MODES, type ViewMode } from "@/lib/comercial-period";
import { dateInputClass, filterKickerClass, tabClass, tabTrackClass } from "@/lib/control-styles";

// O seletor de granularidade da página: Mensal (o padrão de sempre), Semanal
// ou Diário. Escreve `view` e `date` na URL — e apaga os dois no modo Mensal,
// para que a URL padrão continue sendo exatamente a de antes (mesma convenção
// do ClosingFilterTabs).

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

const stepperClass =
  "flex h-[30px] w-[30px] items-center justify-center rounded-none border border-hairline-strong bg-bg-secondary text-secondary transition-colors duration-200 hover:border-accent-light hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-hairline-strong disabled:hover:text-secondary";

export function PeriodViewTabs({
  view,
  anchor,
  label,
  today,
}: {
  view: ViewMode;
  anchor: string;
  /** O rótulo da janela, já formatado ("Semana de 10 ago a 16 ago"). */
  label: string;
  today: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function push(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  /** Mantém year/month alinhados com a âncora — são eles que o MonthYearSelect mostra. */
  function withMonthOf(date: string, rest: Record<string, string | undefined>) {
    return { ...rest, date, year: date.slice(0, 4), month: String(Number(date.slice(5, 7))) };
  }

  function setView(next: ViewMode) {
    // Voltar para Mensal apaga os dois parâmetros: a URL do modo padrão tem
    // que continuar sendo a URL de sempre.
    if (next === "mes") {
      push({ view: undefined, date: undefined });
      return;
    }
    // A âncora já vem resolvida (hoje, se hoje cai no mês visível; senão o
    // último dia dele) — sair de julho para o Diário cai em julho, não em
    // hoje de agosto.
    push(withMonthOf(anchor, { view: next }));
  }

  function goTo(date: string) {
    push(withMonthOf(date, { view }));
  }

  const prevAnchor = view === "dia" ? previousBusinessDay(anchor) : addDays(anchor, -7);
  const nextAnchor = view === "dia" ? nextBusinessDay(anchor) : addDays(anchor, 7);
  // Os steppers travam nas pontas em vez de navegar: nada antes do primeiro
  // dia com dado, e nada depois de hoje.
  const canGoBack = prevAnchor >= FIRST_DATA_DAY;
  const canGoForward = nextAnchor <= today;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={filterKickerClass}>Visão</span>

      <div className={tabTrackClass}>
        {VIEW_MODES.map((m) => (
          <button key={m.value} onClick={() => setView(m.value)} className={tabClass(view === m.value)}>
            {m.label}
          </button>
        ))}
      </div>

      {view !== "mes" && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(prevAnchor)}
            disabled={!canGoBack}
            className={stepperClass}
            aria-label={view === "dia" ? "Dia útil anterior" : "Semana anterior"}
          >
            <ChevronLeft />
          </button>

          <input
            type="date"
            value={anchor}
            min={FIRST_DATA_DAY}
            max={today}
            onChange={(e) => e.target.value && goTo(e.target.value)}
            className={dateInputClass}
            aria-label={view === "dia" ? "Dia" : "Dia dentro da semana"}
          />

          <button
            onClick={() => goTo(nextAnchor)}
            disabled={!canGoForward}
            className={stepperClass}
            aria-label={view === "dia" ? "Próximo dia útil" : "Próxima semana"}
          >
            <ChevronRight />
          </button>

          <span className="whitespace-nowrap text-[11.5px] font-medium text-muted">{label}</span>
        </div>
      )}
    </div>
  );
}
