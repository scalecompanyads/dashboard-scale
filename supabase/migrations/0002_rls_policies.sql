-- RLS: this is an internal tool behind Supabase Auth. Every table is
-- readable by any authenticated user. Only monthly_goals is writable by
-- authenticated users (it's the one thing the UI edits). leads / meta_ads_* /
-- sync_runs / sync_state have no anon/authenticated write policy at all —
-- only the service-role key (used exclusively inside lib/sync/*, bypasses
-- RLS) can write them.

alter table public.leads                      enable row level security;
alter table public.meta_ads_account_insights  enable row level security;
alter table public.meta_ads_creative_insights  enable row level security;
alter table public.monthly_goals               enable row level security;
alter table public.sync_runs                   enable row level security;
alter table public.sync_state                  enable row level security;

create policy "authenticated read leads"         on public.leads                      for select to authenticated using (true);
create policy "authenticated read meta account"  on public.meta_ads_account_insights  for select to authenticated using (true);
create policy "authenticated read meta creative" on public.meta_ads_creative_insights for select to authenticated using (true);
create policy "authenticated read goals"         on public.monthly_goals              for select to authenticated using (true);
create policy "authenticated read sync_runs"     on public.sync_runs                  for select to authenticated using (true);
create policy "authenticated read sync_state"    on public.sync_state                 for select to authenticated using (true);

create policy "authenticated insert goals" on public.monthly_goals for insert to authenticated with check (true);
create policy "authenticated update goals" on public.monthly_goals for update to authenticated using (true) with check (true);
