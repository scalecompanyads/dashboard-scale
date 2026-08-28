-- O CRM interno entra como SEGUNDA fonte de leads, ao lado do Monday.
--
-- Até aqui `leads` era "uma linha por item do board 9613941689" e a chave
-- primária era o próprio `monday_item_id`. O CRM (projeto Supabase
-- ovpsvndkugcqzunlndja) está entrando em produção com ~7.770 leads, dos quais
-- ~7.690 vieram da migração do próprio board — ou seja, as duas fontes
-- descrevem MAJORITARIAMENTE OS MESMOS leads. Empilhar as duas na mesma
-- tabela sem uma regra de identidade dobraria todo número do dashboard.
--
-- A regra combinada com o usuário é "ganha quem foi alterado por último":
-- cada fonte grava a SUA linha, com o carimbo de alteração do sistema de
-- origem (`source_updated_at`), e a view `leads_effective` escolhe uma das
-- duas por lead. Isso é determinístico e independente da ordem em que as
-- syncs terminam — as duas rodam em paralelo (lib/sync/index.ts), então uma
-- estratégia de "a última sync a escrever vence" daria número diferente a
-- cada execução.
--
-- O par (lead do Monday, lead do CRM) é reconhecido por
-- `crm_monday_item_id`: o CRM guarda o id do item de origem em
-- `leads.monday_item_id`, e é ele que a sync do CRM copia para cá. Lead
-- nascido no CRM (sem item no board) tem esse campo nulo e nunca sombreia
-- linha nenhuma.

-- 1. Identidade da linha -----------------------------------------------------
-- `monday_item_id` deixa de ser a chave primária porque lead nascido no CRM
-- não tem um. Continua ÚNICO, então o upsert da sync do Monday
-- (onConflict: "monday_item_id") segue funcionando sem mudança.
alter table public.leads add column row_id uuid not null default gen_random_uuid();
alter table public.leads drop constraint leads_pkey;
alter table public.leads add constraint leads_pkey primary key (row_id);
alter table public.leads alter column monday_item_id drop not null;
alter table public.leads add constraint leads_monday_item_id_key unique (monday_item_id);

alter table public.leads add column source text not null default 'monday'
  check (source in ('monday', 'crm'));

-- Chave da linha do lado do CRM (leads.id, uuid). Único: é o onConflict da
-- sync do CRM.
alter table public.leads add column crm_lead_id uuid;
alter table public.leads add constraint leads_crm_lead_id_key unique (crm_lead_id);

-- De qual item do board este lead do CRM veio. NÃO é `monday_item_id`: se
-- fosse, a linha do CRM colidiria com a linha do Monday no índice único
-- acima. Deliberadamente sem unique — é uma chave de JUNÇÃO entre as duas
-- fontes, não de identidade.
alter table public.leads add column crm_monday_item_id bigint;

-- Quando esta linha mudou NO SISTEMA DE ORIGEM (item.updated_at no Monday;
-- max(leads.updated_at, deals.updated_at) no CRM) — não quando esta tabela
-- foi escrita. É o critério de desempate da view abaixo.
alter table public.leads add column source_updated_at timestamptz;

update public.leads set source = 'monday', source_updated_at = updated_at;

create index leads_source_monday_idx on public.leads (monday_item_id) where source = 'monday';
create index leads_source_crm_idx    on public.leads (crm_monday_item_id) where source = 'crm';

-- Uma linha do Monday não tem lead do CRM, e vice-versa.
alter table public.leads add constraint leads_source_key_ck check (
  (source = 'monday' and monday_item_id is not null and crm_lead_id is null)
  or
  (source = 'crm' and crm_lead_id is not null and monday_item_id is null)
);

-- 2. A view que o dashboard lê ----------------------------------------------
-- Empate vai para o CRM (`>=` no ramo do Monday, `>` no ramo do CRM): é onde
-- as pessoas trabalham a partir de agora, e um lead sem edição de nenhum dos
-- dois lados tem o mesmo dado nas duas linhas de qualquer forma.
--
-- coalesce(..., 'epoch') porque `source_updated_at` é anulável: fonte que
-- ainda não carimbou não pode ganhar de uma que carimbou, e comparação com
-- NULL não é falsa, é desconhecida — sem o coalesce o NOT EXISTS não
-- filtraria e o lead sairia duplicado.
create view public.leads_effective
with (security_invoker = true)
as
select c.*
from public.leads c
where c.source = 'crm'
  and not exists (
    select 1
    from public.leads m
    where m.source = 'monday'
      and m.monday_item_id = c.crm_monday_item_id
      and coalesce(m.source_updated_at, 'epoch'::timestamptz) > coalesce(c.source_updated_at, 'epoch'::timestamptz)
  )
union all
select m.*
from public.leads m
where m.source = 'monday'
  and not exists (
    select 1
    from public.leads c
    where c.source = 'crm'
      and c.crm_monday_item_id = m.monday_item_id
      and coalesce(c.source_updated_at, 'epoch'::timestamptz) >= coalesce(m.source_updated_at, 'epoch'::timestamptz)
  );

grant select on public.leads_effective to anon, authenticated, service_role;

-- 3. 'crm' passa a ser uma fonte válida no log de sincronização --------------
alter table public.sync_runs drop constraint sync_runs_source_check;
alter table public.sync_runs add constraint sync_runs_source_check
  check (source in ('monday', 'crm', 'meta_ads_account', 'meta_ads_creative'));
