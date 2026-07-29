"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await fetch("/api/sync/trigger", { method: "POST" });
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-2 rounded-xl border border-accent-primary/30 bg-accent-primary/15 px-4 py-2 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:bg-accent-primary/25 hover:shadow-[0_0_20px_var(--accent-primary-glow)] disabled:opacity-60"
    >
      <span className={pending ? "inline-block animate-spin" : ""}>↻</span>
      {pending ? "Sincronizando…" : "Atualizar"}
    </button>
  );
}
