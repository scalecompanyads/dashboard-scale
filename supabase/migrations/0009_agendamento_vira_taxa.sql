-- A meta de agendamento vira TAXA.
--
-- A 0008 guardou agendamento como quantidade ("120 reuniões no mês") e rateou
-- por dia útil. Está errado para o que o time persegue: agendamento é
-- relativo ao volume de leads que entrou. Num mês de 600 leads, 120 reuniões
-- é um resultado; num mês de 200, é outro completamente diferente — e a meta
-- em número não distingue os dois.
--
-- Agendamento passa a ser a mesma pergunta que a primeira conversão do funil
-- já faz: dos leads que entraram, quantos viraram reunião marcada.
--
-- Consequência que justifica o resto desta migration: TAXA NÃO SE RATEIA.
-- 25% é 25% num dia, numa semana e no mês. Então:
--
--   * a coluna vira `goal_agendamento_pct`, com o mesmo domínio 0–100 da
--     meta de comparecimento;
--   * `period_goals.goal_agendamentos` some. Override por semana só faz
--     sentido para meta que se divide, e a única que se divide é a de
--     faturamento.
--
-- Nenhum dado se perde de verdade: a coluna de quantidade nasceu na 0008,
-- hoje, e nunca chegou a receber valor em produção.

alter table public.monthly_goals drop column goal_agendamentos;

alter table public.monthly_goals
  add column goal_agendamento_pct numeric check (goal_agendamento_pct >= 0 and goal_agendamento_pct <= 100);

comment on column public.monthly_goals.goal_agendamento_pct is
  'Taxa de agendamento alvo (0–100): dos leads que entraram, quantos viraram reunião. Não é rateada.';

-- Volta a ser só o override de faturamento, como na 0006. `goal_value` fica
-- anulável (a 0008 tirou o NOT NULL): nulo continua sendo "vale o rateio".
alter table public.period_goals drop column goal_agendamentos;
