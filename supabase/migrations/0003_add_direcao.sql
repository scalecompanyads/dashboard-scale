-- "Direção" (color_mkta1n92) classifies which business line/purpose a lead
-- belongs to (Scale, Scale Landing Page, Estruturação, Playbook, GMN) or
-- flags it as junk/test/duplicate data via the "Filter" label — those rows
-- were never excluded from the dashboard because this column wasn't synced
-- at all, so a lead tagged "Filter" could still land in Leads Totais,
-- Reuniões, funil, pódios and fechamentos.

alter table public.leads add column direcao text; -- color_mkta1n92

create index leads_direcao_idx on public.leads (direcao);
