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
    <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-1 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.7)]">
      <span
        className="absolute inset-x-0 top-0 h-1 opacity-90"
        style={{ background: "var(--color-status-good)", boxShadow: "0 2px 20px var(--color-status-good)66" }}
        aria-hidden
      />
      <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted">Meta do Mês</p>

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
          className="mt-1 w-full rounded-lg border border-accent-primary bg-black/30 px-2 py-1 text-2xl font-extrabold text-primary shadow-[0_0_15px_var(--accent-primary-glow)] outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-1 -mx-1 truncate rounded-lg px-1 text-left text-2xl font-extrabold tracking-tight text-primary transition hover:bg-white/5"
        >
          {goalValue ? fmtBRL(goalValue) : "—"}
        </button>
      )}

      <p className="mt-1 text-xs font-medium text-accent-primary">
        {editing ? "Enter para salvar · Esc para cancelar" : "clique para editar"}
      </p>
    </div>
  );
}
