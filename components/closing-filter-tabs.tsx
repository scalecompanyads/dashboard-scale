"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ClosingFilter } from "@/lib/data/leads";

const FILTERS: { value: ClosingFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "mesmo_mes", label: "Leads do mês" },
  { value: "outros_meses", label: "Outros meses" },
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
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-display text-[12px] font-bold uppercase tracking-wider text-accent-primary">Fechamentos</span>

      <div className="flex items-center gap-1 rounded-none bg-black/20 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setParam({ filter: f.value === "all" ? undefined : f.value })}
            className={
              "rounded-none px-3 py-1.5 text-[12.5px] font-bold transition-all duration-200 " +
              (filter === f.value
                ? "bg-gradient-to-r from-accent-primary to-accent-light text-ink-strong shadow-[0_0_14px_var(--accent-primary-glow)]"
                : "text-secondary hover:text-white")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "outros_meses" && (
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span>entrada de</span>
          <input
            type="date"
            value={dateFrom ?? ""}
            onChange={(e) => setParam({ dateFrom: e.target.value || undefined })}
            className="rounded-none border border-hairline bg-black/20 px-2 py-1.5 text-[12px] text-primary outline-none [color-scheme:dark] transition-colors duration-200 focus:border-accent-primary"
          />
          <span>até</span>
          <input
            type="date"
            value={dateTo ?? ""}
            onChange={(e) => setParam({ dateTo: e.target.value || undefined })}
            className="rounded-none border border-hairline bg-black/20 px-2 py-1.5 text-[12px] text-primary outline-none [color-scheme:dark] transition-colors duration-200 focus:border-accent-primary"
          />
        </div>
      )}
    </div>
  );
}
