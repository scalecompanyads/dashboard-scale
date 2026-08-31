-- Limpa override sem override.
--
-- Entre a 0008 e a 0009, period_goals teve DUAS colunas de meta (faturamento
-- e quantidade de agendamentos). Naquele desenho, "limpar" uma delas anulava
-- a coluna e só apagava a linha se as duas ficassem nulas — para não levar
-- junto o override da outra métrica.
--
-- A 0009 tirou a coluna de agendamentos (agendamento virou taxa, e taxa não
-- se rateia). Quem tinha sido limpo naquele intervalo ficou como linha de
-- goal_value nulo: um override que não sobrescreve nada.
--
-- Não muda número nenhum na tela — getPeriodGoals já lê goal_value nulo como
-- "vale o rateio". É higiene: linha que não significa nada vira dúvida na
-- próxima vez que alguém abrir a tabela.
--
-- Com uma coluna só, clearPeriodGoal voltou a apagar a linha direto, então
-- isto não se repete.

delete from public.period_goals where goal_value is null;
