-- A terceira taxa do funil: conversão.
--
-- Com a 0009 o agendamento virou taxa. Fechando o conjunto, o funil comercial
-- passa a ter as três conversões com meta, cada uma medindo a passagem de uma
-- etapa para a seguinte:
--
--   agendamento     leads      -> agendadas    padrão 40%
--   comparecimento  agendadas  -> realizadas   padrão 75%
--   conversão       realizadas -> fechados     padrão 25%
--
-- Nenhuma se rateia: taxa é taxa em qualquer recorte. Todas moram no mês.
--
-- Os padrões NÃO ficam no banco, de propósito — moram em META_PADRAO
-- (lib/constants.ts). Coluna nula quer dizer "vale o padrão", e é isso que
-- permite mudar o padrão do time num lugar só e ver todos os meses que nunca
-- foram editados acompanharem. Gravar 40 em cada linha congelaria o valor
-- antigo em todo mês já visitado.

alter table public.monthly_goals
  add column goal_conversao_pct numeric check (goal_conversao_pct >= 0 and goal_conversao_pct <= 100);

comment on column public.monthly_goals.goal_conversao_pct is
  'Taxa de conversão alvo (0–100): das reuniões realizadas, quantas fecharam. NULL = vale o padrão de META_PADRAO.';
