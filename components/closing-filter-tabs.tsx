"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ClosingFilter } from "@/lib/data/leads";

const FILTERS: { value: ClosingFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "mesmo_mes", label: "Leads do mês" },
  { value: "outros_meses", label: "Leads de outros meses" },
];

export function ClosingFilterTabs({
  filter,
  dateFrom,
  dateTo,
}: {
  filter: ClosingFilter;
  dateFrom?: string;
  dateTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-secondary">Fechamentos:</span>
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => setParam({ filter: f.value === "all" ? undefined : f.value })}
          className={
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition " +
            (filter === f.value
              ? "border-accent-primary bg-accent-primary/20 text-white shadow-[0_0_16px_var(--accent-primary-glow)]"
              : "border-hairline bg-black/30 text-secondary hover:border-hairline-strong hover:text-white")
          }
        >
          {f.label}
        </button>
      ))}

      {filter === "outros_meses" && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>entrada de</span>
          <input
            type="date"
            value={dateFrom ?? ""}
            onChange={(e) => setParam({ dateFrom: e.target.value || undefined })}
            className="rounded-lg border border-hairline bg-black/30 px-2 py-1.5 text-xs text-primary outline-none [color-scheme:dark] focus:border-accent-primary"
          />
          <span>até</span>
          <input
            type="date"
            value={dateTo ?? ""}
            onChange={(e) => setParam({ dateTo: e.target.value || undefined })}
            className="rounded-lg border border-hairline bg-black/30 px-2 py-1.5 text-xs text-primary outline-none [color-scheme:dark] focus:border-accent-primary"
          />
        </div>
      )}
    </div>
  );
}
