import { isStale, timeAgo } from "@/lib/format";

const STALE_THRESHOLD_HOURS = 26; // daily cron (24h) + margin

export function StaleDataBanner({
  lastSuccessAt,
  hasError,
  errorMessage,
}: {
  lastSuccessAt: string | null;
  hasError: boolean;
  errorMessage: string | null;
}) {
  const staleByAge = isStale(lastSuccessAt, STALE_THRESHOLD_HOURS);

  if (!hasError && !staleByAge) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-status-warning/30 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
      <span aria-hidden>⚠</span>
      <div>
        <p className="font-semibold">
          {hasError ? "Última sincronização falhou — mostrando os dados mais recentes disponíveis." : "Dados desatualizados."}
        </p>
        <p className="mt-0.5 text-xs text-status-warning/80">
          Última sincronização bem-sucedida: {timeAgo(lastSuccessAt)}.
          {errorMessage ? ` Erro: ${errorMessage}` : ""}
        </p>
      </div>
    </div>
  );
}
