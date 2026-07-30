import { timeAgo } from "@/lib/format";

export function LastSyncedBadge({ lastSuccessAt, hasError }: { lastSuccessAt: string | null; hasError: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-hairline bg-black/20 px-2.5 py-1 text-[11.5px] font-medium text-muted">
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (hasError ? "bg-status-critical shadow-[0_0_6px_rgba(208,59,59,0.6)]" : "bg-status-good shadow-[0_0_6px_rgba(12,163,12,0.6)]")
        }
        aria-hidden
      />
      <span className="hidden sm:inline">Sincronizado</span> {timeAgo(lastSuccessAt)}
    </div>
  );
}
