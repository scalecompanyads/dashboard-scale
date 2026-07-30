"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtBRL } from "@/lib/constants";
import { AnimatedNumber } from "@/components/animated-number";
import { CardSpotlight } from "@/components/card-spotlight";

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function GoalCard({ monthKey, goalValue }: { monthKey: string; goalValue: number }) {
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
      className="group flex h-full min-w-0 flex-col items-center overflow-hidden rounded-card p-4 shadow-[0_10px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(12,163,12,0.22)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125 hover:shadow-[0_16px_42px_rgba(0,0,0,0.55),0_0_0_1px_rgba(12,163,12,0.4)]"
      style={{
        containerType: "inline-size",
        backgroundImage:
          "linear-gradient(160deg, color-mix(in srgb, var(--color-status-good) 20%, transparent) 0%, rgba(13,18,27,0.82) 45%, rgba(13,18,27,0.9) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-accent-primary via-accent-light to-transparent opacity-30 blur-3xl"
        aria-hidden
      />

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          aria-label="Editar meta do mês"
          className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition-opacity duration-200 hover:bg-white/[0.06] hover:text-accent-light group-hover:opacity-100"
        >
          <EditIcon />
        </button>
      )}

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
          className="relative w-full rounded-md border border-accent-primary bg-canvas px-2 py-1 text-center font-bold leading-none tabular-nums text-primary outline-none"
          style={{ fontSize: "clamp(1.05rem, 13cqw, 4rem)" }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          title={goalValue ? fmtBRL(goalValue) : undefined}
          className="relative overflow-hidden whitespace-nowrap rounded-md text-center font-extrabold leading-none tracking-tight tabular-nums text-primary transition-colors duration-200 hover:text-accent-light"
          style={{ fontSize: "clamp(1.05rem, 13cqw, 4rem)" }}
        >
          {/* compact by default ("R$ 150k") — metas costumam ser números
              redondos e grandes, então abrevia sempre em vez de arriscar
              precisar cortar o texto; valor exato aparece no title/hover */}
          <AnimatedNumber value={goalValue || null} format={{ type: "currencyCompact" }} />
        </button>
      )}

      <p className="relative mt-2.5 truncate text-center text-[clamp(10px,2.2cqw,13px)] font-bold uppercase tracking-wide text-muted">Meta do Mês</p>

      <p className="relative mt-1 text-center text-[clamp(11px,2.4cqw,14px)] font-medium text-secondary">
        {editing ? "Enter para salvar · Esc para cancelar" : goalValue ? "meta definida para o mês" : "nenhuma meta definida"}
      </p>
    </CardSpotlight>
  );
}
