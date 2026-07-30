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
      className="flex items-center gap-1.5 rounded-lg border border-accent-primary/30 bg-accent-primary/[0.08] px-3.5 py-1.5 text-[12.5px] font-bold text-accent-light transition-all duration-200 hover:border-transparent hover:bg-gradient-to-r hover:from-accent-primary hover:to-accent-light hover:text-ink-strong hover:shadow-[0_0_22px_var(--accent-primary-glow)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={pending ? "inline-block animate-spin" : ""} aria-hidden>
        ↻
      </span>
      {pending ? "Sincronizando…" : "Atualizar"}
    </button>
  );
}
