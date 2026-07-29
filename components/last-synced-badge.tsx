import { timeAgo } from "@/lib/format";

export function LastSyncedBadge({ lastSuccessAt, hasError }: { lastSuccessAt: string | null; hasError: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-hairline bg-black/30 px-3 py-1.5 text-xs font-medium text-muted">
      <span
        className={"h-1.5 w-1.5 rounded-full " + (hasError ? "bg-status-critical" : "bg-status-good")}
        aria-hidden
      />
      Sincronizado {timeAgo(lastSuccessAt)}
    </div>
  );
}
