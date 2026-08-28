import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de LEITURA do banco do CRM interno (outro projeto Supabase, não
// este). Mesmo papel do createAdminClient(): service-role, usado só dentro de
// lib/sync/*, nunca importado de componente ou página.
//
// Por que ler o Postgres direto em vez da API v1 do CRM (docs/api.md de lá):
// a API existe e é boa, mas hoje não entrega o suficiente para este
// dashboard. `/leads` devolve `funnel_stage_id` e `owner_sdr_id` crus, não há
// rota de etapas nem de usuários para traduzir esses uuids em nome, e
// `/deals` — de onde saem valor, modelo, closer e as datas de agendamento e
// fechamento — não aceita filtro por lead nem paginação por cursor. Fechar
// essa lacuna significaria construir três endpoints no CRM antes de o
// dashboard ver um número novo. Decisão do usuário: ler o banco.
//
// A chave é de SERVICE ROLE do projeto do CRM e ignora RLS — este módulo só
// faz SELECT, e é assim que deve continuar. O CRM é a produção do time
// comercial; o dashboard não escreve lá.
let cached: SupabaseClient | null = null;

export function createCrmClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.CRM_SUPABASE_URL;
  const serviceRoleKey = process.env.CRM_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "CRM_SUPABASE_URL e CRM_SUPABASE_SERVICE_ROLE_KEY precisam estar configurados para sincronizar os leads do CRM."
    );
  }

  cached = createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
