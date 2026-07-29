"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MONTHS } from "@/lib/constants";

const FIRST_YEAR = 2025;

export function MonthYearSelect({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const years: number[] = [];
  for (let y = new Date().getFullYear(); y >= FIRST_YEAR; y--) years.push(y);

  function update(key: "year" | "month", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={(e) => update("month", e.target.value)}
        className="cursor-pointer rounded-xl border border-hairline bg-black/40 px-3 py-2 text-xs font-medium text-primary outline-none transition hover:border-accent-primary focus:border-accent-primary"
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => update("year", e.target.value)}
        className="cursor-pointer rounded-xl border border-hairline bg-black/40 px-3 py-2 text-xs font-medium text-primary outline-none transition hover:border-accent-primary focus:border-accent-primary"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
