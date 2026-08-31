"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtBRL, fmtBRLCompact } from "@/lib/constants";
import { AnimatedNumber } from "@/components/animated-number";
import { CardSpotlight } from "@/components/card-spotlight";
import { ProgressIndicator } from "@/components/progress-indicator";
import type { GoalProgress, Pace, PeriodGoal } from "@/lib/metrics/goal-pacing";

/**
 * O que este card edita: a meta do MÊS (que o time negocia e que fica em
 * monthly_goals) ou o override de uma SEMANA (a exceção ao rateio, em
 * period_goals).
 *
 * O dia não entra: quem planeja, planeja a semana. No modo Diário a página
 * mostra a produção do dia, mas a meta aqui é a da semana daquele dia.
 */
export type GoalTarget = { kind: "month"; monthKey: string } | { kind: "period"; periodKey: string };

// A meta de faturamento inteira num card só: quanto da meta já saiu (%), de
// quanto para quanto (R$), o que falta, o ritmo, e a meta editável.
//
// Eram quatro cards — "% da Meta", "TCV Fechado", "Meta" e "Gap" — mais a
// metade esquerda da faixa de contexto. Cinco lugares para três números: o
// realizado aparecia três vezes e a meta, três. Juntar não é só economia de
// espaço; é parar de fazer o olho conferir se R$ 28.100 num card é o mesmo
// R$ 28.100 do card ao lado.
//
// O % é o herói porque foi o que o time pediu: a meta se lê em percentual, e
// o valor em reais fica de apoio.

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function GoalSummaryCard({
  label,
  target,
  periodGoal,
  progress,
  pace,
  showPace = true,
}: {
  label: string;
  target: GoalTarget;
  periodGoal: PeriodGoal;
  progress: GoalProgress;
  pace: Pace;
  showPace?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(periodGoal.value || ""));
  const [saving, setSaving] = useState(false);

  async function post(goalValue: number | null) {
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        target.kind === "month"
          ? { month: target.monthKey, metric: "tcv", goalValue }
          : { periodType: "week", periodKey: target.periodKey, metric: "tcv", goalValue }
      ),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function save() {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      setValue(String(periodGoal.value || ""));
      setEditing(false);
      return;
    }
    await post(parsed);
  }

  const semMeta = periodGoal.source === "ausente";

  return (
    <CardSpotlight
      className="group flex h-full min-w-0 flex-col items-start overflow-hidden rounded-card border border-white/15 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_35px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125"
      style={{
        containerType: "inline-size",
        backgroundImage:
          "linear-gradient(160deg, color-mix(in srgb, var(--color-accent-primary) 26%, transparent) 0%, color-mix(in srgb, var(--color-accent-primary) 10%, var(--color-surface-solid)) 55%, color-mix(in srgb, var(--color-surface-solid) 82%, transparent) 100%)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-accent-primary" aria-hidden />

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          aria-label={`Editar ${label.toLowerCase()}`}
          className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-none text-muted opacity-0 transition-opacity duration-200 hover:bg-white/[0.06] hover:text-accent-light group-hover:opacity-100"
        >
          <EditIcon />
        </button>
      )}

      <div className="relative mb-1.5 flex w-full items-start justify-start gap-1.5">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light opacity-70" aria-hidden />
        <p className="font-display line-clamp-2 text-left text-[clamp(10px,2.1cqw,15px)] font-bold uppercase leading-snug tracking-wider text-white">
          {label}
        </p>
      </div>

      {editing ? (
        <input
          autoFocus
          type="number"
          min={0}
          step={1000}
          value={value}
          disabled={saving}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setValue(String(periodGoal.value || ""));
              setEditing(false);
            }
          }}
          className="relative w-full rounded-none border border-accent-primary bg-canvas px-2 py-1 text-left font-bold leading-none tabular-nums text-primary outline-none"
          style={{ fontSize: "clamp(1.05rem, 13cqw, 5rem)" }}
        />
      ) : (
        <span
          className="relative overflow-hidden whitespace-nowrap text-left font-extrabold leading-none tracking-tight tabular-nums text-primary"
          style={{ fontSize: "clamp(1.05rem, 13cqw, 5rem)" }}
        >
          <AnimatedNumber value={semMeta ? null : progress.pct} format={{ type: "percent" }} />
        </span>
      )}

      <p className="relative mt-1.5 text-left text-[clamp(11px,2.4cqw,16px)] font-semibold tabular-nums text-secondary">
        {editing ? (
          "Enter para salvar · Esc para cancelar"
        ) : semMeta ? (
          "sem meta definida"
        ) : (
          <>
            {fmtBRL(progress.achieved)} <span className="font-medium text-muted">de {fmtBRLCompact(progress.goal)}</span>
          </>
        )}
      </p>

      {/* Mesma regra do "faltam N" dos cards de taxa: déficit é sempre
          vermelho. O percentual acima pode ficar azul quando está quase lá —
          esta linha, não, porque ela só aparece quando falta dinheiro. */}
      {!editing && !semMeta && (
        <p
          className={
            "relative text-left text-[clamp(11px,2.3cqw,15px)] font-bold tabular-nums " +
            (progress.reached ? "text-status-good" : "text-status-critical")
          }
        >
          {progress.reached ? "✓ meta superada" : `faltam ${fmtBRL(progress.gap)}`}
        </p>
      )}

      {!editing && !semMeta && (
        <div className="relative mt-2 w-full">
          <ProgressIndicator pct={progress.pct} tone={progress.metaTone} />
        </div>
      )}

      {/* Ritmo: a meta é sempre do período INTEIRO, então é aqui que aparece
          quanto dele já se viveu. Sem isso, 60% na segunda-feira e 60% na
          sexta leem igual. */}
      {!editing && showPace && !semMeta && (
        <p className="relative mt-1.5 text-left text-[clamp(10px,2.1cqw,14px)] font-medium text-muted">
          {pace.phase === "futuro"
            ? "período ainda não começou"
            : `ritmo ${pace.elapsedBusinessDays} de ${pace.totalBusinessDays} ${
                pace.totalBusinessDays === 1 ? "dia útil" : "dias úteis"
              } · esperado ${fmtBRLCompact(pace.expected)}`}
        </p>
      )}

      {!editing && periodGoal.source === "derivada" && (
        <p className="relative mt-0.5 text-left text-[clamp(10px,2.1cqw,14px)] font-medium text-muted">
          rateio de {fmtBRLCompact(periodGoal.monthlyGoal)} · {periodGoal.businessDays} de {periodGoal.monthBusinessDays}{" "}
          dias úteis
        </p>
      )}

      {!editing && periodGoal.source === "manual" && target.kind === "period" && (
        <button
          onClick={() => post(null)}
          disabled={saving}
          className="relative mt-0.5 rounded-none text-left text-[clamp(10px,2.1cqw,14px)] font-medium text-muted underline decoration-dotted underline-offset-2 transition-colors duration-200 hover:text-white disabled:opacity-50"
        >
          definida manualmente · voltar ao rateio
        </button>
      )}
    </CardSpotlight>
  );
}
