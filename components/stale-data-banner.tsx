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
    <div className="flex items-start gap-3 rounded-card border border-status-warning/30 bg-status-warning/[0.1] px-4 py-3 backdrop-blur-xl">
      <span className="text-status-warning" aria-hidden>
        ⚠
      </span>
      <div>
        <p className="text-[13px] font-semibold text-status-warning">
          {hasError ? "Última sincronização falhou — mostrando os dados mais recentes disponíveis." : "Dados desatualizados."}
        </p>
        <p className="mt-0.5 text-[12px] text-status-warning/75">
          Última sincronização bem-sucedida: {timeAgo(lastSuccessAt)}.
          {errorMessage ? ` Erro: ${errorMessage}` : ""}
        </p>
      </div>
    </div>
  );
}
