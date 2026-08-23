"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MONTHS } from "@/lib/constants";

const FIRST_YEAR = 2025;

const selectClass =
  "cursor-pointer appearance-none rounded-none border border-hairline bg-black/20 py-1.5 pl-3 pr-7 text-[12.5px] font-semibold text-primary outline-none transition-colors duration-200 hover:border-hairline-strong focus:border-accent-primary";

const chevronBg =
  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")";

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

  const bgStyle = { backgroundImage: chevronBg, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "14px" };

  return (
    <div className="flex items-center gap-2">
      <select value={month} onChange={(e) => update("month", e.target.value)} className={selectClass} style={bgStyle}>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select value={year} onChange={(e) => update("year", e.target.value)} className={selectClass} style={bgStyle}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
