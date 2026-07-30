"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtBRL } from "@/lib/constants";

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
    <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-card bg-surface-2 p-4 shadow-[0_10px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(47,128,237,0.2)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(0,0,0,0.55),0_0_0_1px_rgba(47,128,237,0.35)]">
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-gradient-to-br from-accent-primary via-accent-light to-transparent opacity-25 blur-3xl"
        aria-hidden
      />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-good shadow-[0_0_8px_rgba(12,163,12,0.7)]" aria-hidden />
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-muted">Meta do Mês</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Editar meta do mês"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted opacity-0 transition-opacity duration-200 hover:bg-white/[0.06] hover:text-accent-light group-hover:opacity-100"
          >
            <EditIcon />
          </button>
        )}
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
          className="relative mt-2.5 w-full rounded-md border border-accent-primary bg-canvas px-2 py-1 text-[2rem] font-bold leading-none tabular-nums text-primary outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="relative -mx-1 mt-2.5 truncate rounded-md px-1 text-left text-[2rem] font-bold leading-none tracking-tight tabular-nums text-primary transition-colors duration-200 hover:text-accent-light"
        >
          {goalValue ? fmtBRL(goalValue) : "—"}
        </button>
      )}

      <p className="relative mt-2 text-[12px] font-medium text-secondary">
        {editing ? "Enter para salvar · Esc para cancelar" : goalValue ? "meta definida para o mês" : "nenhuma meta definida"}
      </p>
    </div>
  );
}
