-- Dash Comercial Scale Next — initial schema
-- One row per Monday.com board item (board 9613941689). "leads", "agendadas"
-- and "fechamentos" in the legacy dashboard are just different date-column
-- filters over this one table.

create extension if not exists pgcrypto;

create table public.leads (
  monday_item_id   bigint primary key,
  item_name        text not null default '',
  etapa            text,                                   -- color_mksyb52r
  modelo           text check (modelo in ('TCV', 'MRR')),   -- color_mm5gmp1
  mrr_value        numeric,                                 -- numeric_mksykxx (deal value, regardless of modelo)
  dt_entrada       date,                                    -- data
  dt_agenda        date,                                    -- date_mkt23t3n
  dt_fecha         date,                                    -- date_mksyxsgr
  closer           text,                                    -- dropdown_mkt2ehgd
  sdr              text,                                    -- dropdown_mkt2jm28
  origem           text,                                    -- color_mksy15sp
  criativo         text,                                    -- text_mkv5psxz
  raw              jsonb,                                   -- full column_values payload, for debugging/future-proofing
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index leads_dt_entrada_idx on public.leads (dt_entrada);
create index leads_dt_agenda_idx  on public.leads (dt_agenda);
create index leads_dt_fecha_idx   on public.leads (dt_fecha);
create index leads_etapa_idx      on public.leads (etapa);
create index leads_origem_idx     on public.leads (origem);
create index leads_closer_idx     on public.leads (closer);
create index leads_sdr_idx        on public.leads (sdr);

-- Meta Ads: account-level, one row per calendar month
create table public.meta_ads_account_insights (
  id            uuid primary key default gen_random_uuid(),
  month         date not null,          -- first-of-month, e.g. 2026-07-01
  spend         numeric not null default 0,
  impressions   bigint  not null default 0,
  clicks        bigint  not null default 0,
  cpc           numeric,
  cpm           numeric,
  ctr           numeric,
  leads_count   integer not null default 0,  -- derived from actions[] 'lead' + 'onsite_conversion.lead_grouped'
  raw           jsonb,
  synced_at     timestamptz not null default now(),
  unique (month)
);

-- Meta Ads: per-creative (ad-level), one row per (month, ad)
create table public.meta_ads_creative_insights (
  id            uuid primary key default gen_random_uuid(),
  month         date not null,
  ad_id         text not null,
  ad_name       text not null,          -- joined against leads.criativo
  spend         numeric not null default 0,
  impressions   bigint  not null default 0,
  clicks        bigint  not null default 0,
  cpc           numeric,
  cpm           numeric,
  ctr           numeric,
  leads_count   integer not null default 0,
  raw           jsonb,
  synced_at     timestamptz not null default now(),
  unique (month, ad_id)
);
create index meta_creative_ad_name_idx on public.meta_ads_creative_insights (ad_name);
create index meta_creative_month_idx   on public.meta_ads_creative_insights (month);

-- Monthly revenue goals ("metas") — replaces localStorage
create table public.monthly_goals (
  month        text primary key,        -- 'YYYY-MM'
  goal_value   numeric not null default 0,
  updated_by   uuid references auth.users(id),
  updated_at   timestamptz not null default now()
);

-- Append-only sync audit log
create table public.sync_runs (
  id                 uuid primary key default gen_random_uuid(),
  source             text not null check (source in ('monday', 'meta_ads_account', 'meta_ads_creative')),
  status             text not null check (status in ('running', 'success', 'error')),
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  rows_upserted      integer,
  error_message      text,
  triggered_by       text not null check (triggered_by in ('manual', 'cron')),
  triggered_by_user  uuid references auth.users(id)
);
create index sync_runs_source_started_idx on public.sync_runs (source, started_at desc);

-- O(1) "last synced" lookup for the UI badge (one row per source, upserted after every run)
create table public.sync_state (
  source              text primary key,
  last_success_at     timestamptz,
  last_error_at       timestamptz,
  last_error_message  text,
  last_status         text check (last_status in ('success', 'error')),
  updated_at          timestamptz not null default now()
);
