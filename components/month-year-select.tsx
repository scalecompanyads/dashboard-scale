"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MONTHS } from "@/lib/constants";
import { controlClass, chevronStyle } from "@/lib/control-styles";
import { defaultAnchor } from "@/lib/comercial-period";

const FIRST_YEAR = 2025;

export function MonthYearSelect({ year, month, today }: { year: number; month: number; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const years: number[] = [];
  for (let y = Number(today.slice(0, 4)); y >= FIRST_YEAR; y--) years.push(y);

  function update(key: "year" | "month", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);

    // Nos modos Semanal/Diário quem manda é `date` (ver
    // resolveComercialPeriod). Setar só year/month aqui deixaria a âncora
    // apontando para o mês antigo, e o select pareceria não fazer nada.
    const view = params.get("view");
    if (view === "semana" || view === "dia") {
      const nextYear = Number(params.get("year")) || year;
      const nextMonth = Number(params.get("month")) || month;
      params.set("date", defaultAnchor(nextYear, nextMonth, today));
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <select value={month} onChange={(e) => update("month", e.target.value)} className={controlClass} style={chevronStyle}>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select value={year} onChange={(e) => update("year", e.target.value)} className={controlClass} style={chevronStyle}>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
