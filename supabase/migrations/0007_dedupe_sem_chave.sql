-- Rede de segurança para o lead que chega nas duas fontes SEM a chave que as
-- une.
--
-- A 0005 resolve o par (lead do board, lead do CRM) pelo id do item do Monday:
-- a linha do CRM some quando existe uma do board com aquele id. Mas ela tem um
-- buraco na primeira condição —
--
--     c.crm_monday_item_id is null  or  not exists (... m.monday_item_id = c.crm_monday_item_id)
--
-- — porque `crm_monday_item_id is null` MANTÉM a linha do CRM sempre. A ideia
-- era "lead que nasceu no CRM e não tem item no board", e por dez meses foi
-- exatamente isso.
--
-- Desde 27/08/2026 deixou de ser. O CRM parou de gravar o `monday_item_id` nos
-- leads novos: eles nascem lá, uma automação também cria o item no board, e o
-- CRM nunca fica sabendo o id. Sem chave, as duas cópias do MESMO lead passam
-- pela view e a pessoa é contada duas vezes.
--
-- O tamanho do estrago, medido na base em 31/08/2026: 75 leads e 1 reunião a
-- mais, todos entre 27 e 31/08. Agosto mostrava 592 leads onde havia 517
-- pessoas — 13% de inflação no topo do funil, e com ele em toda taxa de
-- conversão do mês. Fechamento, TCV e MRR não foram atingidos: nenhum dos
-- pares duplicados tinha etapa 'Fechado'.
--
-- A regra nova, para a linha do CRM sem chave: ela some se o board já tem uma
-- linha com o MESMO nome e a MESMA data de entrada.
--
-- O que esta migration deliberadamente NÃO faz:
--
--   * Não toca na junção por id. Quando `crm_monday_item_id` existe, ela
--     continua sendo a única coisa que decide — o casamento por nome é o plano
--     B, não o plano A. Se o CRM voltar a gravar o campo, esta regra fica
--     inerte sozinha, sem precisar ser removida.
--   * Não casa quando `dt_entrada` é nula dos dois lados. `= ` já é falso com
--     NULL, e é de propósito: sem data, "mesmo nome" sozinho é fraco demais
--     para apagar uma linha. Preferir a duplicata a perder um lead.
--
-- O risco aceito: dois homônimos de verdade entrando no mesmo dia virariam um
-- lead só. Não há nenhum caso assim na base — de novembro/2025 a julho/2026 o
-- casamento por nome + data entre as duas fontes dá zero.

create index if not exists leads_monday_nome_entrada_idx
  on public.leads (lower(btrim(item_name)), dt_entrada)
  where source = 'monday';

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
  and case
        -- Plano A: o id do item. É a chave de verdade.
        when c.crm_monday_item_id is not null then
          not exists (
            select 1
            from public.leads m
            where m.source = 'monday'
              and m.monday_item_id = c.crm_monday_item_id
          )
        -- Plano B: sem id, nome + data de entrada.
        else
          not exists (
            select 1
            from public.leads m
            where m.source = 'monday'
              and lower(btrim(m.item_name)) = lower(btrim(c.item_name))
              and m.dt_entrada = c.dt_entrada
          )
      end;
