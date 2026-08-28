// Aplica as migrations de supabase/migrations no banco linkado.
//
// Existe porque as migrations vinham sendo coladas à mão no SQL editor do
// Supabase (é o que os arquivos APLICAR-NO-SUPABASE-*.sql na raiz são), e
// isso tem dois custos: alguém precisa lembrar de fazer, e o histórico do
// CLI (`supabase_migrations.schema_migrations`) fica vazio — então `supabase
// db push` acha que NADA foi aplicado e se oferece para rodar tudo de novo,
// o que num banco de produção é exatamente o que ninguém quer.
//
// Vai pela Management API (POST /v1/projects/{ref}/database/query), não pelo
// CLI: é uma chamada HTTP, não precisa de binário instalado nem da senha do
// Postgres, e o token que ela usa dá para revogar sozinho no painel.
//
// PRECISA de SUPABASE_ACCESS_TOKEN no .env.local — um Personal Access Token
// de https://supabase.com/dashboard/account/tokens. A service role key NÃO
// serve: ela só fala com o PostgREST, que não executa DDL.
//
// Uso:
//   npm run db:push                                Plano (dry-run) — o padrão, não escreve nada
//   npm run db:push -- --status                    Só o histórico remoto x os arquivos locais
//   npm run db:push -- --mark-applied-through=VER  Registra como aplicadas, SEM rodar, todas até VER
//   npm run db:push -- --marcar=VER1,VER2          Idem, mas versões avulsas (histórico com buracos)
//   npm run db:push -- --apply                     Roda de verdade as pendentes, em ordem
//   npm run db:push -- --apply --only=20260828200000
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "supabase/migrations";
const API = "https://api.supabase.com";

interface Migracao {
  versao: string;
  nome: string;
  arquivo: string;
}

/** "20260828200000_monday_campos_faltantes.sql" -> versão + nome, no mesmo
 *  formato que o CLI grava em schema_migrations. */
function lerMigrations(): Migracao[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((arquivo) => {
      const match = /^(\d+)_(.+)\.sql$/.exec(arquivo);
      if (!match) throw new Error(`Nome fora do padrão <versão>_<nome>.sql: ${arquivo}`);
      return { versao: match[1], nome: match[2], arquivo };
    });
}

function projectRef(): string {
  // O ref do projeto está no subdomínio da URL pública
  // (https://<ref>.supabase.co) e também em supabase/.temp/project-ref, que o
  // CLI escreve. A URL vem primeiro porque é a que o app inteiro já usa.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const daUrl = url ? /^https:\/\/([a-z0-9]+)\.supabase\./.exec(url)?.[1] : null;
  if (daUrl) return daUrl;
  try {
    return readFileSync("supabase/.temp/project-ref", "utf8").trim();
  } catch {
    throw new Error("Não consegui descobrir o ref do projeto (NEXT_PUBLIC_SUPABASE_URL ou supabase/.temp/project-ref).");
  }
}

function token(): string {
  const t = process.env.SUPABASE_ACCESS_TOKEN;
  if (t && t.trim()) return t.trim();
  throw new Error(
    "SUPABASE_ACCESS_TOKEN não configurado.\n" +
      "  1. Gere um Personal Access Token em https://supabase.com/dashboard/account/tokens\n" +
      "  2. Adicione ao .env.local:  SUPABASE_ACCESS_TOKEN=sbp_...\n" +
      "A service role key não serve aqui — ela só fala com o PostgREST, que não roda DDL."
  );
}

async function sql<T = unknown>(query: string): Promise<T[]> {
  const res = await fetch(`${API}/v1/projects/${projectRef()}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const corpo = await res.text();
  if (!res.ok) throw new Error(`Management API HTTP ${res.status}: ${corpo.slice(0, 800)}`);
  try {
    return JSON.parse(corpo) as T[];
  } catch {
    return [];
  }
}

// A mesma tabela que o CLI usa. Criar aqui é o que permite que, depois desta
// primeira vez, `supabase db push` também funcione: as duas ferramentas
// passam a ler e escrever o mesmo histórico.
async function garantirHistorico() {
  await sql(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      statements text[],
      name text
    );
  `);
}

async function versoesAplicadas(): Promise<Set<string>> {
  const linhas = await sql<{ version: string }>("select version from supabase_migrations.schema_migrations order by version;");
  return new Set(linhas.map((l) => l.version));
}

async function main() {
  const argv = process.argv.slice(2);
  const flag = (nome: string) => argv.find((a) => a.startsWith(`--${nome}=`))?.slice(nome.length + 3);
  const apply = argv.includes("--apply");
  const status = argv.includes("--status");
  const only = flag("only");
  const marcarAte = flag("mark-applied-through");
  // Versões avulsas, separadas por vírgula. `--mark-applied-through` supõe
  // que o histórico é um prefixo contínuo, e aqui não era: as migrations
  // coladas à mão no painel deixaram buracos (a de 28/08 190000 nunca rodou,
  // mas a 200000 sim), então marcar "até X" registraria como feita uma que
  // não foi.
  const marcarLista = flag("marcar")?.split(",").map((v) => v.trim()).filter(Boolean) ?? [];

  const migrations = lerMigrations();
  await garantirHistorico();
  const aplicadas = await versoesAplicadas();

  const pendentes = migrations.filter((m) => !aplicadas.has(m.versao) && (!only || m.versao === only));

  console.log(`Projeto ${projectRef()} · ${migrations.length} migrations locais · ${aplicadas.size} no histórico remoto\n`);

  if (status) {
    for (const m of migrations) console.log(`${aplicadas.has(m.versao) ? "aplicada" : "PENDENTE"}\t${m.arquivo}`);
    return;
  }

  // Registrar sem rodar. É o passo que reconcilia um banco cujas migrations
  // foram aplicadas à mão: o objeto já existe lá, rodar de novo daria erro
  // (ou pior, um "drop function" seguido de recreate em cima de dado vivo).
  // Por isso este caminho NUNCA executa o SQL do arquivo — ele só escreve a
  // linha no histórico.
  if (marcarAte || marcarLista.length > 0) {
    const alvo = migrations.filter(
      (m) => !aplicadas.has(m.versao) && ((marcarAte != null && m.versao <= marcarAte) || marcarLista.includes(m.versao))
    );
    if (alvo.length === 0) {
      console.log("Nada a marcar — o histórico já cobre todas as versões pedidas.");
      return;
    }
    console.log("Marcar como aplicadas (SEM rodar):");
    for (const m of alvo) console.log(`  ${m.arquivo}`);
    if (!apply) {
      console.log(`\n(dry-run — nada foi escrito. Repita com --apply para gravar o histórico.)`);
      return;
    }
    const valores = alvo.map((m) => `(${literal(m.versao)}, ${literal(m.nome)})`).join(",\n    ");
    await sql(`insert into supabase_migrations.schema_migrations (version, name) values\n    ${valores}\n  on conflict (version) do nothing;`);
    console.log(`\n${alvo.length} versões registradas. Elas não serão mais re-executadas por este script nem por 'supabase db push'.`);
    return;
  }

  if (pendentes.length === 0) {
    console.log("Nenhuma migration pendente.");
    return;
  }

  console.log(`Pendentes (${pendentes.length}):`);
  for (const m of pendentes) console.log(`  ${m.arquivo}`);

  if (!apply) {
    console.log(`\n(dry-run — nada foi escrito. Repita com --apply para rodar de verdade.)`);
    return;
  }

  for (const m of pendentes) {
    const conteudo = readFileSync(join(MIGRATIONS_DIR, m.arquivo), "utf8");
    process.stdout.write(`  aplicando ${m.arquivo} ... `);
    // Transação por arquivo: uma migration que falha no meio não deixa metade
    // do schema de pé. Nenhuma migration deste repo usa comando que recuse
    // transação (create index concurrently, alter type ... add value antigo);
    // se um dia usar, este begin/commit é o lugar de abrir exceção.
    await sql(`begin;\n${conteudo}\ncommit;`);
    // Só depois de o arquivo passar. Registrar antes deixaria uma migration
    // que falhou marcada como feita — o pior estado possível.
    await sql(
      `insert into supabase_migrations.schema_migrations (version, name) values (${literal(m.versao)}, ${literal(m.nome)}) on conflict (version) do nothing;`
    );
    console.log("ok");
  }

  console.log(`\n${pendentes.length} migration(s) aplicada(s) e registrada(s).`);
}

/** Literal SQL com aspas escapadas — os valores aqui são nome de arquivo,
 *  não entrada de usuário, mas a query vai montada como texto. */
function literal(valor: string): string {
  return `'${valor.replaceAll("'", "''")}'`;
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
