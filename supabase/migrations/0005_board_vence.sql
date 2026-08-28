-- O board do Monday passa a ser a verdade absoluta.
--
-- A 0004 resolvia o par (lead do Monday, lead do CRM) por "ganha quem foi
-- alterado por último", comparando `source_updated_at` dos dois lados. Na
-- prática isso não mede o que o nome promete, e os números provaram: das
-- 7.800 linhas que a view devolvia, **7.596 vinham do CRM e 204 do board**.
--
-- O motivo é que os dois carimbos não são a mesma grandeza:
--
--   * No Monday, `item.updated_at` é quando uma PESSOA mexeu no item. A
--     maioria do board não é tocada há meses — os dias mais frequentes são
--     2025-10-06, 2025-08-12, 2026-01-28.
--   * No CRM, `leads.updated_at` é o carimbo de um trigger que dispara em
--     QUALQUER update, inclusive de script. 5.701 linhas estão em
--     2026-08-07 (a data em que a migration do `criado_em` reescreveu a
--     tabela inteira) e outras 1.292 em 2026-08-28 (os backfills de hoje).
--
-- Comparar "quando alguém editou" com "quando um script passou por aqui"
-- faz o CRM ganhar quase sempre, sem que ninguém tenha editado nada. O que
-- aparecia na tela era a atribuição de SDR e closer do CRM no lugar da do
-- board, nas ~311 linhas em que os dois divergem — a divergência que o
-- usuário viu.
--
-- A regra nova é a mesma que o AGENTS.md do CRM já aplica no `sync:monday`:
-- em conflito, o board vence. Ele é quem está em produção, é onde o time
-- opera, e é contra ele que as pessoas conferem o dashboard.
--
-- O CRM continua entrando com o que o board não tem: lead nascido lá (sem
-- item no board) e lead cujo item sumiu de lá. Hoje são 43 linhas. O total
-- da view não muda — 7.800 antes e depois; o que muda é de qual cópia sai o
-- valor de cada campo.
--
-- `source_updated_at` continua sendo gravado pelas duas syncs. Ele deixa de
-- ser critério de desempate e passa a ser só diagnóstico ("de quando é esta
-- cópia?") — útil justamente para revisar decisões como esta.

create or replace view public.leads_effective
with (security_invoker = true)
as
-- O board, inteiro e sem ressalva.
select m.*
from public.leads m
where m.source = 'monday'
union all
-- Do CRM, só o que não tem par no board.
select c.*
from public.leads c
where c.source = 'crm'
  and (
    c.crm_monday_item_id is null
    or not exists (
      select 1
      from public.leads m
      where m.source = 'monday'
        and m.monday_item_id = c.crm_monday_item_id
    )
  );
