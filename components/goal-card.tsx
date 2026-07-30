"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtBRL } from "@/lib/constants";

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
    <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-1 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-hairline-strong hover:shadow-[0_16px_48px_rgba(0,0,0,0.65)]">
      <div
        className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-status-good opacity-[0.16] blur-2xl transition-opacity duration-300 group-hover:opacity-25"
        aria-hidden
      />

      <div className="relative flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.6)]" aria-hidden />
        <p className="truncate text-[10.5px] font-bold uppercase tracking-wider text-muted">Meta do Mês</p>
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
          className="relative mt-2.5 w-full rounded-lg border border-accent-primary bg-black/30 px-2 py-1 text-[1.7rem] font-extrabold leading-none tabular-nums text-primary shadow-[0_0_15px_var(--accent-primary-glow)] outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="relative -mx-1 mt-2.5 truncate rounded-lg px-1 text-left text-[1.7rem] font-extrabold leading-none tracking-tight tabular-nums text-primary transition hover:bg-white/5"
        >
          {goalValue ? fmtBRL(goalValue) : "—"}
        </button>
      )}

      <p className="relative mt-2 text-[11px] font-medium text-accent-primary">
        {editing ? "Enter para salvar · Esc para cancelar" : "clique para editar"}
      </p>
    </div>
  );
}
