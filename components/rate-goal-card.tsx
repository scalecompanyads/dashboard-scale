"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { CardSpotlight } from "@/components/card-spotlight";
import { ProgressIndicator } from "@/components/progress-indicator";
import type { RateProgress } from "@/lib/metrics/goal-pacing";
import type { GoalAccent } from "@/lib/metrics/goal-pacing";

// Card de uma conversão do funil: a taxa realizada é o número grande, a meta
// fica editável na linha de apoio, e embaixo o que fazer para bater.
//
// É o inverso do GoalSummaryCard, e de propósito. Lá o herói é o percentual
// da meta de faturamento, porque é um número que o time NEGOCIA e persegue em
// reais. Aqui o herói é o resultado, porque uma taxa se lê sozinha ("38% dos
// leads marcaram") e a meta é a régua ao lado.
//
// A meta nunca fica vazia: sem valor gravado vale o padrão do time
// (META_PADRAO). "Padrão" devolve a ele em vez de zerar.

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const ACCENT_VAR: Record<GoalAccent, string> = {
  good: "var(--color-status-good)",
  primary: "var(--color-accent-primary)",
  critical: "var(--color-status-critical)",
  muted: "var(--color-text-muted)",
};

export function RateGoalCard({
  label,
  monthKey,
  metric,
  progress,
  isDefault,
  done,
  of,
  ofLabel,
  neededLabel,
}: {
  label: string;
  monthKey: string;
  metric: "agendamento" | "comparecimento" | "conversao";
  progress: RateProgress;
  /** true quando a meta veio do padrão do time e não de um valor digitado. */
  isDefault: boolean;
  done: number;
  of: number;
  /** O denominador por extenso: "leads", "agendadas", "realizadas". */
  ofLabel: string;
  /** O que falta, por extenso: "agendamentos", "comparecimentos", "fechamentos". */
  neededLabel: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(progress.target));
  const [saving, setSaving] = useState(false);

  async function post(goalValue: number | null) {
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: monthKey, metric, goalValue }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function save() {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setValue(String(progress.target));
      setEditing(false);
      return;
    }
    await post(parsed);
  }

  const color = ACCENT_VAR[progress.accent];

  return (
    <CardSpotlight
      className="group flex h-full min-w-0 flex-col items-start overflow-hidden rounded-card border border-white/12 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_35px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125"
      style={{
        containerType: "inline-size",
        backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${color} 10%, transparent) 0%, color-mix(in srgb, var(--color-surface-solid) 72%, transparent) 45%, color-mix(in srgb, var(--color-surface-solid) 72%, transparent) 100%)`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: color }} aria-hidden />

      <div className="relative mb-1.5 flex w-full items-start justify-start gap-1.5">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color, opacity: 0.55 }} aria-hidden />
        <p className="font-display line-clamp-2 text-left text-[clamp(10px,2.1cqw,15px)] font-bold uppercase leading-snug tracking-wider text-white">
          {label}
        </p>
      </div>

      <span
        className="relative overflow-hidden whitespace-nowrap text-left font-extrabold leading-none tracking-tight tabular-nums text-primary"
        style={{ fontSize: "clamp(1.05rem, 13cqw, 5rem)" }}
      >
        <AnimatedNumber value={of > 0 ? progress.rate : null} format={{ type: "percent", decimals: 1 }} />
      </span>

      <div className="relative mt-1 flex w-full flex-wrap items-center gap-x-1.5 text-left text-[clamp(11px,2.4cqw,16px)] font-medium text-secondary">
        <span className="tabular-nums">
          {done} de {of} {ofLabel}
        </span>
        <span aria-hidden>·</span>
        {editing ? (
          <span className="inline-flex items-center gap-1">
            <span>meta</span>
            <input
              autoFocus
              type="number"
              min={0}
              max={100}
              step={1}
              value={value}
              disabled={saving}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setValue(String(progress.target));
                  setEditing(false);
                }
              }}
              className="w-14 rounded-none border border-accent-primary bg-canvas px-1 py-0.5 text-left font-bold tabular-nums text-primary outline-none"
            />
          </span>
        ) : (
          <button
            onClick={() => setEditing(true)}
            aria-label={`Editar meta de ${label.toLowerCase()}`}
            className="inline-flex items-center gap-1 rounded-none font-semibold tabular-nums transition-colors duration-200 hover:text-accent-light"
            style={{ color }}
          >
            meta {Math.round(progress.target)}%
            <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <EditIcon />
            </span>
          </button>
        )}
      </div>

      {/* A linha acionável: onde se está é o número grande, o que fazer é
          aqui. Contra a META do time, e não contra um marco de 5 em 5 pontos
          que ninguém combinou.

          Déficit é SEMPRE vermelho, mesmo com a taxa quase lá. O número
          grande pode ficar no azul neutro (74,7% contra 75% não é motivo de
          alarme), mas isto aqui só existe quando falta alguma coisa — pintá-lo
          de azul faria uma pendência parecer informação. */}
      {!editing && (
        <p className="relative mt-0.5 text-left text-[clamp(10px,2.2cqw,15px)] font-bold tabular-nums">
          {progress.reached ? (
            <span className="text-status-good">✓ meta batida</span>
          ) : progress.needed !== null ? (
            <span className="text-status-critical">
              {progress.needed === 1 ? "falta" : "faltam"} {progress.needed}{" "}
              {progress.needed === 1 ? neededLabel.replace(/s$/, "") : neededLabel}
            </span>
          ) : (
            <span className="text-muted">sem base para calcular</span>
          )}
        </p>
      )}

      {!isDefault && !editing && (
        <button
          onClick={() => post(null)}
          disabled={saving}
          className="relative mt-0.5 rounded-none text-left text-[clamp(10px,2.1cqw,14px)] font-medium text-muted underline decoration-dotted underline-offset-2 transition-colors duration-200 hover:text-white disabled:opacity-50"
        >
          voltar ao padrão
        </button>
      )}

      {of > 0 && (
        <div className="relative mt-2 w-full">
          {/* A barra plota a TAXA, não a fração da meta — número herói e barra
              têm que contar a mesma história. */}
          <ProgressIndicator pct={progress.rate} tone={progress.tone} />
        </div>
      )}
    </CardSpotlight>
  );
}
