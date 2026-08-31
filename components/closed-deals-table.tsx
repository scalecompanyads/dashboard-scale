"use client";

import { useEffect, useState } from "react";
import { fmtBRL } from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";
import {
  emptyStateClass,
  tableHeaderTitleClass,
  tableHeaderWrapClass,
  tableScrollClass,
  tableShellClass,
  tdMutedClass,
  tdNameClass,
  tdNumClass,
  tdNumMutedClass,
  thBaseClass,
  thRightClass,
  trBaseClass,
} from "@/lib/table-styles";

const SEEN_KEY = "dash_seen_closings_v1";
const NEW_GLOW_MS = 6000;

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className={className}>
      <path d="M11 2l1.8 5.7L18.5 9.5l-5.7 1.8L11 17l-1.8-5.7L3.5 9.5l5.7-1.8L11 2Z" />
      <path d="M19 14l.9 2.6L22.5 17.5l-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" />
    </svg>
  );
}

export function ClosedDealsTable({ closings }: { closings: Lead[] }) {
  const sorted = [...closings].sort((a, b) => (b.dt_fecha ?? "").localeCompare(a.dt_fecha ?? ""));

  const [newIds, setNewIds] = useState<Set<number>>(new Set());

  // Diffs the current list against what this browser has already seen
  // (localStorage) and lights up anything that wasn't there before — a new
  // closing landing is the whole point of this table, worth celebrating.
  // A brand-new browser/device has nothing stored yet, so that first load
  // just seeds the list quietly instead of igniting the entire table.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(SEEN_KEY);
    const isFirstEverLoad = raw === null;
    const seen = new Set<number>(raw ? (JSON.parse(raw) as number[]) : []);

    const currentIds = sorted.map((c) => c.monday_item_id).filter((id): id is number => id != null);
    const fresh = currentIds.filter((id) => !seen.has(id));

    currentIds.forEach((id) => seen.add(id));
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
    } catch {
      // storage full/blocked — losing the "seen" memory just means the next
      // sync's new deals won't glow, not worth failing over
    }

    if (isFirstEverLoad || fresh.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing React state with localStorage's diff is exactly this effect's job, not a render-time computation
    setNewIds(new Set(fresh));
    const t = setTimeout(() => setNewIds(new Set()), NEW_GLOW_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- diff runs off `closings` identity, not `sorted` (a fresh array every render)
  }, [closings]);

  return (
    <div className={tableShellClass}>
      <div className={tableHeaderWrapClass}>
        <span className={tableHeaderTitleClass}>Clientes Fechados</span>
        <span className="text-[11px] font-medium text-muted">{sorted.length} no período</span>
      </div>
      <div className={tableScrollClass}>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {["Cliente", "Closer", "Data", "Valor"].map((h, i) => (
                <th key={h} className={i >= 2 ? thRightClass : thBaseClass}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className={emptyStateClass}>
                  Sem fechamentos no período
                </td>
              </tr>
            ) : (
              sorted.map((item) => {
                const isNew = item.monday_item_id != null && newIds.has(item.monday_item_id);
                return (
                  <tr key={item.monday_item_id} className={`${trBaseClass} ${isNew ? "row-new-deal" : ""}`}>
                    <td className={tdNameClass}>
                      {item.item_name || "—"}
                      {isNew && (
                        <span className="badge-new-deal ml-2 inline-flex items-center gap-1 rounded-none bg-status-good/15 px-2 py-0.5 align-middle text-[10px] font-extrabold uppercase tracking-wide text-status-good shadow-[0_0_10px_rgba(12,163,12,0.5)]">
                          <SparkleIcon />
                          Novo
                        </span>
                      )}
                    </td>
                    <td className={tdMutedClass}>{item.closer || "—"}</td>
                    <td className={tdNumMutedClass}>
                      {item.dt_fecha ? item.dt_fecha.split("-").reverse().join("/").slice(0, 5) : "—"}
                    </td>
                    <td className={tdNumClass}>{fmtBRL(item.mrr_value)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
