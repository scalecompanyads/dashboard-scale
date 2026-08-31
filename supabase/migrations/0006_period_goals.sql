-- Meta manual por período (semana / dia).
--
-- A meta continua nascendo MENSAL, em monthly_goals — é ela que o time
-- negocia e é ela que o card de sempre edita. O dia e a semana são, por
-- padrão, um RATEIO dessa meta por dias úteis (seg–sex):
--
--   meta do dia    = meta do mês / dias úteis do mês
--   meta da semana = meta do dia * dias úteis da semana DENTRO do mês
--
-- Esta tabela guarda só a EXCEÇÃO — a semana do feriado, a semana do evento,
-- o dia de virada de trimestre. Linha ausente = vale o rateio. Ver
-- lib/metrics/goal-pacing.ts (deriveGoal) e o bloco de dias úteis em
-- lib/constants.ts.
--
-- Por que tabela nova em vez de repivotar monthly_goals para
-- (period_type, period_key): monthly_goals é a ÚNICA tabela que usuário
-- autenticado escreve em produção, a PK dela é `month` de coluna única, e é
-- sobre isso que upsertGoal / /api/goals / GoalCard funcionam hoje. Trocar a
-- PK obrigaria a reescrever o caminho mensal junto, sem ganho nenhum: a
-- página lê as duas granularidades no mesmo Promise.all de qualquer jeito.
--
-- O MÊS não entra aqui, de propósito. Uma meta, um lugar — se ela pudesse
-- morar nos dois, a primeira pergunta de todo leitor seria "qual ganha?", e
-- essa ambiguidade uma hora é respondida errado.

create table public.period_goals (
  -- 'week' | 'day'. O mês fica em monthly_goals.
  period_type  text not null check (period_type in ('week', 'day')),

  -- PRIMEIRO dia da janela, 'YYYY-MM-DD':
  --   day  -> o próprio dia
  --   week -> a segunda-feira da semana, OU o dia 1º quando a semana
  --           atravessa a virada do mês e o recorte começa no meio dela.
  --
  -- Data, e não 'YYYY-Www': o número ISO da semana é o MESMO dos dois lados
  -- da virada do mês, então as duas metades recortadas colidiriam na mesma
  -- chave. A data de início do recorte é única por construção.
  period_key   text not null check (period_key ~ '^\d{4}-\d{2}-\d{2}$'),

  -- Mês dono da janela. GERADA, nunca digitada — não tem como divergir da
  -- chave. Existe para buscar todos os overrides de um mês numa consulta só.
  month        text generated always as (left(period_key, 7)) stored,

  goal_value   numeric not null default 0 check (goal_value >= 0),
  updated_by   uuid references auth.users(id),
  updated_at   timestamptz not null default now(),

  primary key (period_type, period_key)
);

create index period_goals_month_idx on public.period_goals (month, period_type);

-- Mesma política de monthly_goals (ver 0002_rls_policies.sql), mais um
-- DELETE. Ele é novo no repositório e existe por um motivo específico: é como
-- se REMOVE um override e se volta ao rateio. Sem ele, "desfazer" só daria
-- gravando 0 — que é um valor legítimo e bem diferente de "sem override".
alter table public.period_goals enable row level security;

create policy "authenticated read period goals"   on public.period_goals for select to authenticated using (true);
create policy "authenticated insert period goals" on public.period_goals for insert to authenticated with check (true);
create policy "authenticated update period goals" on public.period_goals for update to authenticated using (true) with check (true);
create policy "authenticated delete period goals" on public.period_goals for delete to authenticated using (true);
