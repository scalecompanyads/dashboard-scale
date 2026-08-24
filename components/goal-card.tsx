"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtBRL } from "@/lib/constants";
import { AnimatedNumber } from "@/components/animated-number";
import { CardSpotlight } from "@/components/card-spotlight";
import { ProgressIndicator } from "@/components/progress-indicator";

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

/** progressPct: how much of THIS goal has been reached so far (same figure the %Meta card plots), shown as a small fill under the value — the "small visual indicator" every metric card now carries. */
export function GoalCard({ monthKey, goalValue, progressPct }: { monthKey: string; goalValue: number; progressPct?: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(goalValue || ""));
  const [saving, setSaving] = useState(false);

  async function save() {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: monthKey, goalValue: parsed }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <CardSpotlight
      className="group flex h-full min-w-0 flex-col items-start overflow-hidden rounded-card border border-white/15 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_35px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125"
      style={{
        containerType: "inline-size",
        backgroundImage:
          "linear-gradient(160deg, color-mix(in srgb, var(--color-status-good) 12%, transparent) 0%, color-mix(in srgb, var(--color-surface-solid) 72%, transparent) 45%, color-mix(in srgb, var(--color-surface-solid) 72%, transparent) 100%)",
      }}
    >
      {/* editorial "kicker" stripe — matches every KPI card's top accent band */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-status-good" aria-hidden />

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          aria-label="Editar meta do mês"
          className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-none text-muted opacity-0 transition-opacity duration-200 hover:bg-white/[0.06] hover:text-accent-light group-hover:opacity-100"
        >
          <EditIcon />
        </button>
      )}

      <div className="relative mb-1.5 flex w-full items-start justify-start gap-1.5">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-status-good)", opacity: 0.55 }} aria-hidden />
        <p className="font-display line-clamp-2 text-left text-[clamp(10px,2.1cqw,15px)] font-bold uppercase leading-snug tracking-wider text-accent-primary">
          Meta do Mês
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
            if (e.key === "Escape") setEditing(false);
          }}
          className="relative w-full rounded-none border border-accent-primary bg-canvas px-2 py-1 text-left font-bold leading-none tabular-nums text-primary outline-none"
          style={{ fontSize: "clamp(1.05rem, 13cqw, 5rem)" }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          title={goalValue ? fmtBRL(goalValue) : undefined}
          className="relative overflow-hidden whitespace-nowrap rounded-none text-left font-extrabold leading-none tracking-tight tabular-nums text-primary transition-colors duration-200 hover:text-accent-light"
          style={{ fontSize: "clamp(1.05rem, 13cqw, 5rem)" }}
        >
          {/* compact by default ("R$ 150k") — metas costumam ser números
              redondos e grandes, então abrevia sempre em vez de arriscar
              precisar cortar o texto; valor exato aparece no title/hover */}
          <AnimatedNumber value={goalValue || null} format={{ type: "currencyCompact" }} />
        </button>
      )}

      {(editing || !goalValue) && (
        <p className="relative mt-1 text-left text-[clamp(11px,2.4cqw,16px)] font-medium text-secondary">
          {editing ? "Enter para salvar · Esc para cancelar" : "nenhuma meta definida"}
        </p>
      )}

      {!editing && goalValue > 0 && progressPct !== undefined && (
        <div className="relative mt-2 w-full">
          <ProgressIndicator pct={progressPct} tone={progressPct >= 100 ? "good" : "accent"} />
        </div>
      )}
    </CardSpotlight>
  );
}
