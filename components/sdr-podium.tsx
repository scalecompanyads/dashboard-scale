import Image from "next/image";
import { PERSON_PHOTOS } from "@/lib/constants";
import { EmptyPodiumSlot, Pedestal, PodiumShell, initials, PODIUM_MATERIAL, type PodiumRank } from "@/components/podium-shell";
import { podiumTop3, type SdrStats } from "@/lib/metrics/sdrs";

function SdrSlot({ rank, sdr, meta }: { rank: PodiumRank; sdr?: SdrStats; meta?: number }) {
  if (!sdr) return <EmptyPodiumSlot rank={rank} />;

  const m = PODIUM_MATERIAL[rank];
  const pct = sdr.agendadas ? (sdr.feitas / sdr.agendadas) * 100 : 0;
  const photo = PERSON_PHOTOS[sdr.name.toLowerCase().split(" ")[0]];
  const bateu = meta !== undefined && sdr.agendadas > 0 && pct >= meta;
  // Verde bateu, azul quase la, vermelho bem atras — mesmos cortes dos
  // cards de taxa la em cima, para o podio nao inventar uma escala propria.
  const cor =
    meta === undefined || sdr.agendadas === 0
      ? "text-accent-light"
      : bateu
        ? "text-status-good"
        : pct >= meta * 0.7
          ? "text-accent-light"
          : "text-status-critical";

  return (
    <div className={`relative flex flex-col items-center gap-2.5 ${m.order}`}>
      {rank === 1 && (
        <span className="absolute -top-8 text-3xl drop-shadow-[0_2px_10px_rgba(245,179,1,0.65)]" aria-hidden>
          👑
        </span>
      )}
      {photo ? (
        <div className={`overflow-hidden rounded-full border-[3px] bg-canvas ${m.ring} ${m.avatarSize}`}>
          <Image
            src={photo.src}
            alt={sdr.name}
            width={96}
            height={96}
            className="h-full w-full object-cover"
            style={{ objectPosition: photo.position }}
          />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center rounded-full border-[3px] bg-gradient-to-br from-accent-primary to-accent-light font-extrabold text-white ${m.ring} ${m.avatarSize}`}
        >
          {initials(sdr.name)}
        </div>
      )}
      <p className="max-w-[75cqw] truncate text-[clamp(13px,2.6cqw,17px)] font-bold text-primary">{sdr.name.split(" ")[0]}</p>
      {/* O numero grande do podio e o que ordena o podio — agora sao os
          PONTOS (contrato 3, comparecimento 2, agendamento 1), e nao mais a
          taxa de comparecimento. A taxa desce uma linha e continua carregando
          a cor do status e o ✓ da meta.

          O orcamento de LINHAS continua o mesmo de antes: o PodiumShell tem
          altura fixa, alinha os slots por baixo (items-end + overflow-hidden)
          e cada linha a mais empurra o conteudo para fora pelo topo, cortando
          justamente o 1o e o 2o lugar. Por isso a conta dos pontos entra como
          linha unica no lugar do "3 contratos", e nao como linha nova. */}
      <p className="text-[clamp(18px,5.5cqw,28px)] font-black leading-none tabular-nums text-accent-light">
        {sdr.pontos}
        <span className="ml-1 text-[clamp(11px,2.2cqw,14px)] font-bold">pts</span>
      </p>
      <p className="text-[clamp(11px,2.3cqw,15px)] font-semibold tabular-nums text-primary">
        {sdr.contratos}×3 · {sdr.feitas}×2 · {sdr.agendadas}×1
      </p>
      <p className={"mb-1 text-[clamp(11px,2.3cqw,15px)] font-medium tabular-nums " + cor}>
        {pct.toFixed(1)}% comp.
        {meta !== undefined && sdr.agendadas > 0 && (
          <span className="font-bold"> · {bateu ? "✓ " : ""}meta {Math.round(meta)}%</span>
        )}
      </p>
      <Pedestal rank={rank} />
    </div>
  );
}

/**
 * O pódio ordena por PONTOS: contrato vale 3, comparecimento vale 2 e
 * agendamento vale 1, somando — a mesma reunião pode pagar os três se ela
 * for marcada, acontecer e fechar. Ver PONTOS_SDR em lib/metrics/sdrs.ts.
 *
 * `meta` é a meta de COMPARECIMENTO do mês (0–100) — a mesma para todo mundo.
 * Ela não entra na pontuação: é o status da taxa que aparece embaixo do
 * total de pontos. Não há meta individual cadastrada, e não faria sentido
 * dividir a do time por pessoa, porque taxa não se reparte entre gente.
 */
export function SdrPodium({ sdrs, meta }: { sdrs: SdrStats[]; meta?: number }) {
  const [s1, s2, s3] = podiumTop3(sdrs);

  return (
    <PodiumShell title="Pódio SDRs">
      <SdrSlot rank={2} sdr={s2} meta={meta} />
      <SdrSlot rank={1} sdr={s1} meta={meta} />
      <SdrSlot rank={3} sdr={s3} meta={meta} />
    </PodiumShell>
  );
}
