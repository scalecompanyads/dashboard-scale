-- Metas de atividade: agendamento e comparecimento.
--
-- Até aqui a única meta era o faturamento (monthly_goals.goal_value, em TCV).
-- O time também persegue o meio do funil, e essas duas metas têm naturezas
-- DIFERENTES — é por isso que são duas colunas e não uma tabela genérica:
--
--   * AGENDAMENTO é uma quantidade. "120 reuniões marcadas no mês" se divide
--     por dia útil igual ao faturamento: 120 / 21 ≈ 5,7 por dia. Aceita
--     override por semana/dia, pelo mesmo motivo que o faturamento aceita.
--
--   * COMPARECIMENTO é uma taxa: dos que foram marcados, quantos apareceram.
--     Taxa NÃO se rateia — 70% é 70% num dia, numa semana e no mês. Por isso
--     ela mora só aqui, no mês, e não ganha coluna em period_goals: uma "meta
--     de taxa da semana" seria a mesma taxa escrita de novo.
--
-- Nulo em qualquer das duas = meta não definida, que é diferente de meta zero.
-- Por isso as colunas são anuláveis e sem default.

alter table public.monthly_goals
  add column goal_agendamentos       numeric check (goal_agendamentos >= 0),
  add column goal_comparecimento_pct numeric check (goal_comparecimento_pct >= 0 and goal_comparecimento_pct <= 100);

comment on column public.monthly_goals.goal_agendamentos is
  'Reuniões a marcar no mês. Rateada por dia útil no diário/semanal.';
comment on column public.monthly_goals.goal_comparecimento_pct is
  'Taxa de comparecimento alvo (0–100): dos agendados, quantos aparecem. Não é rateada.';

-- O override de período ganha o par da quantidade.
alter table public.period_goals
  add column goal_agendamentos numeric check (goal_agendamentos >= 0);

-- E `goal_value` deixa de ser NOT NULL DEFAULT 0.
--
-- Agora uma linha de period_goals pode existir por causa de UMA das duas
-- metas. Com o default 0, criar um override só de agendamento gravaria
-- goal_value = 0 junto — e o dashboard leria isso como "meta de faturamento
-- zero definida à mão", não como "sem override". Nulo é a única forma de
-- dizer "esta métrica cai no rateio" sem mentir sobre a outra.
alter table public.period_goals alter column goal_value drop not null;
alter table public.period_goals alter column goal_value drop default;

comment on column public.period_goals.goal_value is
  'Override de faturamento (TCV). NULL = vale o rateio da meta mensal.';
comment on column public.period_goals.goal_agendamentos is
  'Override da quantidade de agendamentos. NULL = vale o rateio da meta mensal.';
