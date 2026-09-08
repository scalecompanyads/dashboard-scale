# Dashboard Comercial — Next.js + Supabase

Reconstrução do dashboard comercial/marketing da Scale (antes um `index.html` estático
na pasta `Dash Comercial Scale/`, sujeito a erros de API ao vivo e sem persistência
real de métricas). Esta versão:

- Sincroniza **três fontes** para tabelas no Supabase — o board do Monday.com, o
  **CRM interno** e o Meta Ads. O dashboard nunca chama essas APIs ao vivo na hora
  de carregar a página.
- Guarda as Metas do mês numa tabela do Supabase (compartilhada pelo time), em vez
  de `localStorage`.
- Exige login (Supabase Auth) antes de mostrar qualquer dado.
- Redesenho visual: preto profundo + azul vivo, funil redesenhado, gráfico de
  evolução mensal (agora que há histórico persistido).

## As duas fontes de lead

O dashboard nasceu lendo só o board do Monday. O **CRM interno**
(`crm.scalecompany.com.br`, outro projeto Supabase) entrou em produção com os
mesmos leads — foi migrado do mesmo board — e passou a ser onde o time trabalha.
As duas fontes convivem, e essa convivência é a parte que exige cuidado.

**Os ~7.700 leads migrados existem dos dois lados.** Empilhar as duas fontes na
mesma tabela sem uma regra de identidade dobraria todo número da tela. Então:

- Cada fonte grava a **sua própria linha** em `leads`, com a sua chave
  (`monday_item_id` de um lado, `crm_lead_id` do outro).
- O par entre as duas é reconhecido por `crm_monday_item_id` — o id do item do
  board que o CRM guardou quando migrou aquele lead.
- A view **`leads_effective`** devolve **o board inteiro**, mais o que só
  existe no CRM (lead nascido lá, ou cujo item sumiu do board — hoje 43
  linhas). **O Monday é a verdade absoluta**: é ele que está em produção, é
  onde o time opera, e é contra ele que as pessoas conferem o dashboard.

  Isto já foi "ganha quem foi alterado por último", e não funcionou: os dois
  carimbos não são a mesma grandeza. No board, `updated_at` é quando uma
  *pessoa* mexeu no item; no CRM é um trigger que dispara em qualquer update,
  inclusive de script — 5.701 linhas ficaram com a data em que uma migration
  reescreveu a tabela inteira. O CRM ganhava 7.596 dos 7.800 sem ninguém ter
  editado nada, e o que aparecia na tela era a atribuição de SDR e closer
  dele no lugar da do board. Ver `supabase/migrations/0005_board_vence.sql`.
- **Toda leitura do dashboard passa por `leads_effective`.** `lib/data/leads.ts`
  nunca lê a tabela `leads` crua; ler a tabela crua conta cada lead migrado duas
  vezes.

### A fronteira de 01/09/2026: o CRM vira a única fonte

"O Monday é a verdade absoluta" acima descreve **até 31/08/2026**. O time
passou a operar só o CRM a partir de setembro/2026 — ninguém mais edita o
board — e o dashboard passou a refletir isso: sincronizar o Monday
diariamente só reimportaria uma cópia parada, e usá-la para dado novo
mostraria um board sempre desatualizado no lugar do que aconteceu de
verdade no CRM.

- `lib/sync/index.ts` **parou de chamar `syncMondayBoard()`**. As linhas
  `source = 'monday'` já sincronizadas continuam na tabela, congeladas — é
  contra elas que agosto/2026 e meses anteriores foram conferidos, lead a
  lead, antes desse corte.
- `lib/data/leads.ts` decide a fonte **por qual coluna de data cada métrica
  filtra** (`dt_entrada`/`dt_agenda`/`dt_fecha`), não pela data de hoje nem
  por quando o lead nasceu: até `BOARD_ATE` (31/08/2026) lê `leads_effective`
  (board vence, como sempre); de `CRM_SOLO_DESDE` (01/09/2026) em diante lê
  só `leads` com `source = 'crm'`. Um lead que entrou em agosto mas fechou em
  setembro usa o board para "Leads Totais" e o CRM para "Fechados" — ver
  `partesPorFonte` em `lib/data/leads.ts`.
- As duas constantes vivem em `lib/constants.ts`. Mover a fronteira (se um
  dia fizer sentido reabrir o Monday, ou se a data mudar) é editar as duas
  ali, não reescrever a lógica de leitura.

Por que ler o Postgres do CRM direto, e não a API v1 dele: a API existe e é boa,
mas hoje `/leads` devolve `funnel_stage_id` e `owner_sdr_id` crus, não há rota de
etapas nem de usuários para traduzir esses uuids em nome, e `/deals` — de onde
saem valor, modelo, closer e as datas de agendamento e fechamento — não aceita
filtro por lead nem paginação por cursor. Ver o cabeçalho de
`lib/supabase/crm.ts`.

O CRM agora é multi-tenant. Como a service role ignora RLS, **toda tabela que
possui `org_id` é filtrada pela organização da Scale**; a tabela global de
usuários é consultada somente pelos UUIDs já referenciados nessas linhas. O id
padrão está em `lib/supabase/crm.ts` e pode ser sobrescrito por `CRM_ORG_ID`.

O contrato novo também consolida reentradas da mesma pessoa. Para setembro em
diante, `dt_entrada` vem de `ultima_entrada_em` (a entrada representada hoje no
quadro), a atribuição vem do registro mais recente de `lead_attribution`, e a
agenda considera reuniões de venda ligadas diretamente ao lead ou ao negócio,
sempre ignorando a lixeira (`cancelada_em`).

### O que o dash conta, e o que fica de fora

Nem todo lead do CRM é uma linha do funil comercial. Duas regras, as duas em
`lib/constants.ts` e aplicadas em `lib/data/leads.ts`:

- **Live (`Site — Live`) fica de fora, em todo lugar.** Inscrito na
  `/scale-class` é volume de campanha paga, não alguém que pediu contato:
  contá-lo junto inflaria "Leads Totais" e afundaria toda taxa de conversão da
  página. São ~10 leads hoje, e eles só existem no CRM — a LP da live não
  passa pelo Make, então nunca chegaram ao board.
- **Orgânico (`Site — Blog`, `Site — Cases`, `Site — Contato`) conta como
  qualquer outro lead** — no total, no agendamento, na reunião realizada, no
  fechamento e nos dois pódios. A faixa de `components/organic-summary.tsx`
  mostra quanto do mês veio do site, mas é um **recorte** dos mesmos números
  de cima, nunca uma parcela subtraída deles: o lead chegou pelo site em vez
  de por anúncio, e o SDR marcou a reunião igual.
- **Etapa `DADOS INVALIDOS` fica fora de todo o dashboard.** A linha permanece
  no CRM para auditoria, mas não entra em leads, agenda, reuniões, fechamentos,
  pódios ou métricas de marketing.

A lista de origens é **exata**, não um prefixo `Site — `: "Site — Live" também
começa assim e está do outro lado da regra. É a mesma lista do Quadro Orgânico
do CRM, então origem nova no site precisa entrar nos dois lugares.

### Antes de subir uma mudança nessa tradução

```bash
npm run sync:crm-dry            # mês corrente
npm run sync:crm-dry -- 2026-07 # um mês específico
```

Lê o CRM **sem gravar nada** e mostra leads, agendadas, realizadas, fechados,
faturamento e os pódios. Até agosto/2026 ele também põe Monday e CRM lado a lado;
de setembro em diante mostra só o CRM, que é a fonte única desse período.

## 1. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` (já existe um `.env.local` com as
chaves públicas do Supabase preenchidas) e preencha o que falta:

| Variável | Onde conseguir |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` |
| `MONDAY_TOKEN` | O mesmo token já usado na Netlify function do dashboard antigo |
| `META_ADS_TOKEN` / `META_AD_ACCOUNT_ID` | Os mesmos já usados na Netlify function do dashboard antigo |
| `CRM_SUPABASE_URL` / `CRM_SUPABASE_SERVICE_ROLE_KEY` | Do projeto Supabase **do CRM**, não deste. Só leitura — o dashboard nunca escreve lá. |
| `CRM_ORG_ID` | Organização do CRM que alimenta este dashboard. Opcional: o projeto usa a organização original da Scale por padrão. |
| `SUPABASE_ACCESS_TOKEN` | Personal Access Token da conta Supabase (https://supabase.com/dashboard/account/tokens). Usado só por `npm run db:push`. |
| `CRON_SECRET` | Gere com `openssl rand -base64 32`. **O nome precisa ser exatamente `CRON_SECRET`** — é assim que a Vercel identifica qual variável anexar automaticamente como `Authorization: Bearer …` nas chamadas do Cron Job. |

## 2. Aplicar o schema no Supabase

```bash
npm run db:push -- --status     # o que já está aplicado x o que falta
npm run db:push                 # plano (dry-run), não escreve nada
npm run db:push -- --apply      # aplica as pendentes, em ordem
```

O script vai pela Management API e registra cada migration em
`supabase_migrations.schema_migrations`, o mesmo histórico que o CLI usa.

As migrations `0001`–`0003` foram coladas à mão no SQL Editor antes de este
script existir, então o histórico remoto não as conhece. **Na primeira vez**,
registre-as como aplicadas sem rodá-las de novo:

```bash
npm run db:push -- --marcar=0001,0002,0003 --apply
npm run db:push -- --apply       # agora sim, roda só a 0004
```

`0004_crm_as_second_source.sql` transforma `leads` em tabela de duas fontes e
cria a view `leads_effective`; `0005_board_vence.sql` troca a regra da view
para "o board vence sempre". **O código deste repositório não roda sem a
0004** — `lib/data/leads.ts` lê a view, e as duas syncs gravam a coluna
`source`.

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
- **Primeira sincronização (Monday + CRM + Meta Ads)**: depois de logado, clique
  em "Atualizar" no topo do dashboard.

## 6. Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Configure todas as env vars da tabela acima (incluindo as `NEXT_PUBLIC_*` e as
   duas `CRM_SUPABASE_*`) no projeto da Vercel.
3. O `vercel.json` já declara o Cron Job diário (`/api/cron/sync`, 06:00 UTC) —
   a Vercel injeta `Authorization: Bearer $CRON_SECRET` automaticamente nessa
   chamada, então nenhuma configuração extra de cron é necessária além da env var.
4. Depois do primeiro deploy, confira a tabela `sync_runs` no Supabase para
   validar que o cron rodou com sucesso nas três fontes (o Monday parou de
   rodar em 04/09/2026 — ver "A fronteira de 01/09/2026" acima).

O site antigo (Netlify, pasta `Dash Comercial Scale/`) continua no ar sem
alterações — só desative quando tiver confiança nos números deste novo dashboard
(compare alguns meses lado a lado antes).

## Arquitetura

- `lib/sync/*` — sincronização → Supabase, via service-role key
  (`lib/supabase/admin.ts`). Três fontes independentes rodando hoje: `crm.ts`
  (Postgres do CRM, via `lib/supabase/crm.ts`) e `meta-ads.ts` (conta +
  criativo, Graph API) — `monday.ts` (GraphQL do board) ainda existe, mas
  `lib/sync/index.ts` parou de chamá-lo em 04/09/2026 (ver "A fronteira de
  01/09/2026" acima). Rodam **em paralelo** e o resultado não depende de qual
  termina primeiro: cada uma tem a sua chave de conflito. Uma falha em
  qualquer uma é registrada em `sync_state` sem derrubar as outras.
  Disparadas por `app/api/cron/sync` (diário, protegido por `CRON_SECRET`) e
  `app/api/sync/trigger` (botão "Atualizar", protegido por sessão).
- `lib/data/*` — camada de acesso a dados (Supabase → linhas tipadas), usada
  pelas Server Components das páginas. Leads vêm de `leads_effective`.
- `lib/metrics/*` — funções puras portadas do dashboard antigo (KPIs, funil,
  closers, SDRs, marketing por criativo) — mesma lógica de negócio, agora
  operando sobre linhas do Supabase em vez de itens crus da API do Monday.
- `app/(dashboard)/comercial` e `/marketing` — Server Components que leem
  filtros da URL (`searchParams`) e renderizam direto a partir do Supabase.
- `proxy.ts` (raiz) — Next.js 16 renomeou "Middleware" para "Proxy"; aqui só
  faz o refresh de sessão + redireciona não-autenticados para `/login`.
