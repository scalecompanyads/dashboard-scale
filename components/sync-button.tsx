"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setPending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/sync/trigger", { method: "POST" });
      // 207 = some sources failed but others succeeded, still worth a refresh.
      if (!res.ok && res.status !== 207) setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={failed ? "Falha ao sincronizar — tente novamente." : undefined}
      className={
        "flex items-center gap-1.5 rounded-none border px-3.5 py-1.5 text-[12.5px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 " +
        (failed
          ? "border-red-500/40 bg-red-500/[0.08] text-red-400 hover:border-red-400 hover:bg-red-500/20"
          : "border-accent-primary/30 bg-accent-primary/[0.08] text-accent-light hover:border-transparent hover:bg-gradient-to-r hover:from-accent-primary hover:to-accent-light hover:text-ink-strong hover:shadow-[0_0_22px_var(--accent-primary-glow)]")
      }
    >
      <span className={pending ? "inline-block animate-spin" : ""} aria-hidden>
        {failed ? "⚠" : "↻"}
      </span>
      {pending ? "Sincronizando…" : failed ? "Falhou — tentar de novo" : "Atualizar"}
    </button>
  );
}
