"use client";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-lg rounded-card border border-status-critical/30 bg-status-critical/10 p-6 text-sm text-status-critical">
        <p className="text-base font-bold">Não foi possível carregar os dados do dashboard.</p>
        <p className="mt-2 text-status-critical/90">
          A causa mais comum é o schema do Supabase ainda não ter sido aplicado, ou faltar alguma variável de
          ambiente. Confira, nessa ordem:
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-status-critical/90">
          <li>
            Rode <code className="rounded bg-black/30 px-1 py-0.5">supabase/migrations/0001_init_schema.sql</code> e{" "}
            <code className="rounded bg-black/30 px-1 py-0.5">0002_rls_policies.sql</code> no SQL Editor do Supabase.
          </li>
          <li>
            Confirme que <code className="rounded bg-black/30 px-1 py-0.5">.env.local</code> tem{" "}
            <code className="rounded bg-black/30 px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> preenchido e reinicie o
            servidor.
          </li>
          <li>Clique em &quot;Atualizar&quot; no topo para rodar a primeira sincronização.</li>
        </ol>
        {error.digest && <p className="mt-3 text-xs text-status-critical/60">ID do erro: {error.digest}</p>}
        <button
          onClick={() => unstable_retry()}
          className="mt-4 rounded-lg border border-status-critical/40 bg-status-critical/15 px-4 py-2 text-xs font-bold text-status-critical transition hover:bg-status-critical/25"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
