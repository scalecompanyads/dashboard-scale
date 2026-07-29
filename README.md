# Dashboard Comercial — Next.js + Supabase

Reconstrução do dashboard comercial/marketing da Scale (antes um `index.html` estático
na pasta `Dash Comercial Scale/`, sujeito a erros de API ao vivo e sem persistência
real de métricas). Esta versão:

- Sincroniza Monday.com (board de leads) e Meta Ads para tabelas no Supabase — o
  dashboard nunca chama essas APIs ao vivo na hora de carregar a página.
- Guarda as Metas do mês numa tabela do Supabase (compartilhada pelo time), em vez
  de `localStorage`.
- Exige login (Supabase Auth) antes de mostrar qualquer dado.
- Redesenho visual: preto profundo + azul vivo, funil redesenhado, gráfico de
  evolução mensal (agora que há histórico persistido).

## 1. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` (já existe um `.env.local` com as
chaves públicas do Supabase preenchidas) e preencha o que falta:

| Variável | Onde conseguir |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` |
| `MONDAY_TOKEN` | O mesmo token já usado na Netlify function do dashboard antigo |
| `META_ADS_TOKEN` / `META_AD_ACCOUNT_ID` | Os mesmos já usados na Netlify function do dashboard antigo |
| `CRON_SECRET` | Gere com `openssl rand -base64 32`. **O nome precisa ser exatamente `CRON_SECRET`** — é assim que a Vercel identifica qual variável anexar automaticamente como `Authorization: Bearer …` nas chamadas do Cron Job. |

## 2. Aplicar o schema no Supabase

Rode o conteúdo de `supabase/migrations/0001_init_schema.sql` e depois
`0002_rls_policies.sql` no SQL Editor do Supabase (Dashboard → SQL Editor → New
query → colar → Run), na ordem. Isso cria as tabelas `leads`,
`meta_ads_account_insights`, `meta_ads_creative_insights`, `monthly_goals`,
`sync_runs`, `sync_state` e as policies de RLS.

## 3. Criar o primeiro usuário

Este dashboard é por convite — não há tela de cadastro. Crie o(s) usuário(s) em
Supabase Dashboard → Authentication → Users → Add user (ou Invite).

## 4. Instalar dependências e rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` — deve redirecionar para `/login`.

## 5. Popular dados

- **Backfill único do Meta Ads** (histórico desde nov/2025, uma vez só):
  ```bash
  npm run backfill:meta-ads
  ```
- **Primeira sincronização do Monday + Meta Ads (trailing 3 meses)**: depois de
  logado, clique em "Atualizar" no topo do dashboard.

## 6. Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Configure todas as env vars da tabela acima (incluindo as `NEXT_PUBLIC_*`) no
   projeto da Vercel.
3. O `vercel.json` já declara o Cron Job diário (`/api/cron/sync`, 06:00 UTC) —
   a Vercel injeta `Authorization: Bearer $CRON_SECRET` automaticamente nessa
   chamada, então nenhuma configuração extra de cron é necessária além da env var.
4. Depois do primeiro deploy, confira a tabela `sync_runs` no Supabase para
   validar que o cron rodou com sucesso.

O site antigo (Netlify, pasta `Dash Comercial Scale/`) continua no ar sem
alterações — só desative quando tiver confiança nos números deste novo dashboard
(compare alguns meses lado a lado antes).

## Arquitetura

- `lib/sync/*` — sincronização (Monday GraphQL + Meta Graph API) → Supabase,
  via service-role key (`lib/supabase/admin.ts`). Roda em `app/api/cron/sync`
  (diário, protegido por `CRON_SECRET`) e `app/api/sync/trigger` (botão
  "Atualizar", protegido por sessão).
- `lib/data/*` — camada de acesso a dados (Supabase → linhas tipadas), usada
  pelas Server Components das páginas.
- `lib/metrics/*` — funções puras portadas do dashboard antigo (KPIs, funil,
  closers, SDRs, marketing por criativo) — mesma lógica de negócio, agora
  operando sobre linhas do Supabase em vez de itens crus da API do Monday.
- `app/(dashboard)/comercial` e `/marketing` — Server Components que leem
  filtros da URL (`searchParams`) e renderizam direto a partir do Supabase.
- `proxy.ts` (raiz) — Next.js 16 renomeou "Middleware" para "Proxy"; aqui só
  faz o refresh de sessão + redireciona não-autenticados para `/login`.
