// Compara, sem gravar nada, o que o CRM diria de um mês com o que o board do
// Monday já diz hoje.
//
// Existe porque a pergunta que decide se esta integração pode subir não é
// "o código roda?", é "os números mudam?". O CRM foi migrado do mesmo board,
// então para um mês em que ninguém editou nada dos dois lados as duas colunas
// abaixo têm que sair iguais. Onde divergirem, a diferença é informação: ou o
// board andou e o CRM não recebeu (`npm run sync:monday`, no repo do CRM), ou
// o time já está trabalhando no CRM e o board é que ficou para trás.
//
// Uso:
//   npm run sync:crm-dry              Mês corrente
//   npm run sync:crm-dry -- 2026-07   Um mês específico
//   npm run sync:crm-dry -- 2026-07 --amostra=10
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { buildCrmLeadRows } from "@/lib/sync/crm";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcKPIs } from "@/lib/metrics/kpis";
import { calcClosers } from "@/lib/metrics/closers";
import { calcSDRs } from "@/lib/metrics/sdrs";
import {
  DIRECAO_FILTER,
  ETAPA_EXCLUIDA_AGENDA,
  fmtBRL,
  isOrigemOrganica,
  monthRange,
  ORIGEM_LIVE,
  pad,
} from "@/lib/constants";
import type { Lead } from "@/lib/types/database.types";

type Row = Pick<Lead, "etapa" | "modelo" | "mrr_value" | "dt_entrada" | "dt_agenda" | "dt_fecha" | "closer" | "sdr" | "origem" | "criativo" | "direcao">;

// Mesmos recortes de lib/data/leads.ts, aplicados em memória: aqui os dois
// lados precisam passar exatamente pelo mesmo filtro para a comparação
// significar alguma coisa.
const dentro = (d: string | null, from: string, to: string) => !!d && d >= from && d <= to;

// As mesmas duas exclusões de lib/data/leads.ts. Sem elas a comparação
// deixaria de descrever a tela — que é a única coisa que ela serve para
// responder.
const comercial = (rows: Row[]) => rows.filter((r) => r.direcao !== DIRECAO_FILTER && r.origem !== ORIGEM_LIVE);

const so = (rows: Row[]) => rows.filter((r) => isOrigemOrganica(r.origem));

function fatiar(rows: Row[], from: string, to: string) {
  const base = comercial(rows);
  const janela = {
    leads: base.filter((r) => dentro(r.dt_entrada, from, to)),
    agenda: base.filter((r) => dentro(r.dt_agenda, from, to) && !ETAPA_EXCLUIDA_AGENDA.has(r.etapa ?? "")),
    fechamentos: base.filter((r) => dentro(r.dt_fecha, from, to) && r.etapa === "Fechado"),
  };
  // Como na página: o orgânico está DENTRO dos três de cima e aparece de
  // novo aqui embaixo só como recorte, nunca subtraído.
  return {
    ...janela,
    organico: {
      leads: so(janela.leads),
      agenda: so(janela.agenda),
      fechamentos: so(janela.fechamentos),
    },
  };
}

function preenchidos(rows: Row[], campo: keyof Row) {
  return rows.filter((r) => r[campo] !== null && r[campo] !== "").length;
}

// Roda antes E depois da migration 0004: enquanto a coluna `source` não
// existe, a tabela só tem linha do Monday mesmo, então o filtro é dispensável
// — e insistir nele daria 400 justamente na execução que interessa, a de
// antes de subir.
async function lerLinhasDoMonday(): Promise<Row[]> {
  const supabase = createAdminClient();
  const colunas = "etapa, modelo, mrr_value, dt_entrada, dt_agenda, dt_fecha, closer, sdr, origem, criativo, direcao";

  const { error: sonda } = await supabase.from("leads").select("source").limit(1);
  const temSource = !sonda;

  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase.from("leads").select(colunas).order("monday_item_id", { ascending: true }).range(from, from + 999);
    if (temSource) query = query.eq("source", "monday");
    const { data, error } = await query;
    if (error) throw new Error(JSON.stringify(error));
    const batch = (data ?? []) as unknown as Row[];
    rows.push(...batch);
    if (batch.length < 1000) return rows;
  }
}

function linha(rotulo: string, monday: string | number, crm: string | number) {
  const igual = String(monday) === String(crm);
  console.log(
    `  ${rotulo.padEnd(22)} ${String(monday).padStart(14)} ${String(crm).padStart(14)}   ${igual ? "" : "<- diferente"}`
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const mesArg = argv.find((a) => /^\d{4}-\d{2}$/.test(a));
  const amostra = Number(argv.find((a) => a.startsWith("--amostra="))?.split("=")[1] ?? 5);

  const agora = new Date();
  const mes = mesArg ?? `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}`;
  const [ano, m] = mes.split("-").map(Number);
  const [from, to] = monthRange(ano, m);

  console.log(`Lendo o CRM (nada é gravado)...`);
  const crmRows = (await buildCrmLeadRows(new Date().toISOString())) as unknown as Row[];
  console.log(`  ${crmRows.length} leads traduzidos.\n`);

  console.log("Preenchimento dos campos que o dashboard usa (base inteira do CRM):");
  for (const campo of ["etapa", "dt_entrada", "dt_agenda", "dt_fecha", "closer", "sdr", "origem", "criativo", "modelo", "mrr_value"] as const) {
    const n = preenchidos(crmRows, campo);
    console.log(`  ${campo.padEnd(12)} ${String(n).padStart(6)} / ${crmRows.length}  (${((n / crmRows.length) * 100).toFixed(1)}%)`);
  }

  const etapas = new Map<string, number>();
  for (const r of crmRows) etapas.set(r.etapa ?? "(sem etapa)", (etapas.get(r.etapa ?? "(sem etapa)") ?? 0) + 1);
  console.log("\nEtapas traduzidas:");
  for (const [nome, n] of [...etapas].sort((a, b) => b[1] - a[1])) console.log(`  ${nome.padEnd(22)} ${String(n).padStart(6)}`);

  let mondayRows: Row[] = [];
  try {
    mondayRows = await lerLinhasDoMonday();
  } catch (err) {
    console.log(`\n(não deu para ler as linhas do Monday deste banco: ${err instanceof Error ? err.message : err})`);
    return;
  }

  const mondayMes = fatiar(mondayRows, from, to);
  const crmMes = fatiar(crmRows, from, to);
  const kMonday = calcKPIs(mondayMes.leads as Lead[], mondayMes.agenda as Lead[], mondayMes.fechamentos as Lead[]);
  const kCrm = calcKPIs(crmMes.leads as Lead[], crmMes.agenda as Lead[], crmMes.fechamentos as Lead[]);

  console.log(`\n${mes} — o que cada fonte diz, isolada:\n`);
  console.log(`  ${"".padEnd(22)} ${"MONDAY".padStart(14)} ${"CRM".padStart(14)}`);
  linha("Leads totais", kMonday.total, kCrm.total);
  linha("Agendadas", kMonday.agendadas, kCrm.agendadas);
  linha("Realizadas", kMonday.realizadas, kCrm.realizadas);
  linha("Fechados", kMonday.fechados, kCrm.fechados);
  linha("Faturamento", fmtBRL(kMonday.mrr), fmtBRL(kCrm.mrr));
  linha("Ticket médio", fmtBRL(kMonday.ticketMedio), fmtBRL(kCrm.ticketMedio));

  // A faixa de baixo da página, e o que ficou de fora dela.
  const oMonday = calcKPIs(mondayMes.organico.leads as Lead[], mondayMes.organico.agenda as Lead[], mondayMes.organico.fechamentos as Lead[]);
  const oCrm = calcKPIs(crmMes.organico.leads as Lead[], crmMes.organico.agenda as Lead[], crmMes.organico.fechamentos as Lead[]);
  console.log("\n  Orgânico (recorte — já contado acima):");
  linha("  Leads", oMonday.total, oCrm.total);
  linha("  Agendadas", oMonday.agendadas, oCrm.agendadas);
  linha("  Fechados", oMonday.fechados, oCrm.fechados);
  linha("  Faturamento", fmtBRL(oMonday.mrr), fmtBRL(oCrm.mrr));

  const liveNoMes = (rows: Row[]) => rows.filter((r) => r.origem === ORIGEM_LIVE && dentro(r.dt_entrada, from, to)).length;
  console.log(`\n  Descartados como live (${ORIGEM_LIVE}): ${liveNoMes(mondayRows)} no Monday, ${liveNoMes(crmRows)} no CRM`);

  const closersMonday = calcClosers(mondayMes.agenda as Lead[], mondayMes.fechamentos as Lead[]);
  const closersCrm = calcClosers(crmMes.agenda as Lead[], crmMes.fechamentos as Lead[]);
  console.log("\n  Closers (reuniões / fechados / MRR):");
  for (const nome of new Set([...closersMonday, ...closersCrm].map((c) => c.name))) {
    const a = closersMonday.find((c) => c.name === nome);
    const b = closersCrm.find((c) => c.name === nome);
    const fmt = (c?: { reunioes: number; fechados: number; mrr: number }) =>
      c ? `${c.reunioes}/${c.fechados}/${fmtBRL(c.mrr)}` : "—";
    linha(`  ${nome}`, fmt(a), fmt(b));
  }

  const sdrsMonday = calcSDRs(mondayMes.agenda as Lead[], mondayMes.fechamentos as Lead[]);
  const sdrsCrm = calcSDRs(crmMes.agenda as Lead[], crmMes.fechamentos as Lead[]);
  console.log("\n  SDRs (agendadas / feitas / contratos):");
  for (const nome of new Set([...sdrsMonday, ...sdrsCrm].map((s) => s.name))) {
    const a = sdrsMonday.find((s) => s.name === nome);
    const b = sdrsCrm.find((s) => s.name === nome);
    const fmt = (s?: { agendadas: number; feitas: number; contratos: number }) =>
      s ? `${s.agendadas}/${s.feitas}/${s.contratos}` : "—";
    linha(`  ${nome}`, fmt(a), fmt(b));
  }

  if (amostra > 0) {
    console.log(`\nAmostra de ${amostra} fechamentos do CRM em ${mes}:`);
    for (const r of crmMes.fechamentos.slice(0, amostra)) {
      console.log(
        `  ${(r.dt_fecha ?? "").padEnd(11)} ${fmtBRL(r.mrr_value).padStart(12)} ${(r.modelo ?? "—").padEnd(4)} closer=${r.closer ?? "—"} sdr=${r.sdr ?? "—"} origem=${r.origem ?? "—"}`
      );
    }
  }

  console.log(
    "\nAs duas colunas são cada fonte ISOLADA — não é isso que o dashboard vai mostrar.\n" +
      "Lead que existe de um lado só é mantido pela view leads_effective, então o total\n" +
      "exibido é a UNIÃO das duas (nunca menor que a maior coluna); onde o lead existe nos\n" +
      "dois, vale o que foi alterado por último. Diferença pequena aqui é a distância normal\n" +
      "entre board e CRM (npm run diff:monday, no repo do CRM). Diferença GRANDE em Leads\n" +
      "totais ou Fechados é sinal de mapeamento errado, não de edição — investigue antes."
  );
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : JSON.stringify(err)}`);
  process.exit(1);
});
