import Image from "next/image";
import { PERSON_PHOTOS } from "@/lib/constants";
import { EmptyPodiumSlot, Pedestal, PodiumShell, initials, PODIUM_MATERIAL, type PodiumRank } from "@/components/podium-shell";
import { podiumTop3, type SdrStats } from "@/lib/metrics/sdrs";

function SdrSlot({ rank, sdr, meta }: { rank: PodiumRank; sdr?: SdrStats; meta?: number }) {
  if (!sdr) return <EmptyPodiumSlot rank={rank} />;

  const m = PODIUM_MATERIAL[rank];
  // O número grande do pódio JÁ É a taxa de comparecimento desta pessoa —
  // das reuniões que ela marcou, quantas aconteceram. Então a meta do time
  // vale aqui direto, sem dividir por ninguém: taxa não se reparte.
  const pct = sdr.agendadas ? (sdr.feitas / sdr.agendadas) * 100 : 0;
  const photo = PERSON_PHOTOS[sdr.name.toLowerCase().split(" ")[0]];
  const bateu = meta !== undefined && sdr.agendadas > 0 && pct >= meta;

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
      <p className="text-[clamp(18px,5.5cqw,28px)] font-black text-accent-light">{pct.toFixed(1)}%</p>
      <p className="text-[clamp(13px,2.6cqw,17px)] font-semibold text-primary">
        {sdr.feitas} de {sdr.agendadas} ag.
      </p>
      {meta !== undefined && sdr.agendadas > 0 && (
        <p
          className={
            "text-[clamp(11px,2.2cqw,14px)] font-bold tabular-nums " +
            (bateu ? "text-status-good" : pct >= meta * 0.7 ? "text-accent-light" : "text-status-critical")
          }
        >
          {bateu ? "✓ " : ""}meta {Math.round(meta)}%
        </p>
      )}
      <p className="mb-1 text-[clamp(12px,2.4cqw,15px)] font-medium text-primary">
        {sdr.contratos} contrato{sdr.contratos === 1 ? "" : "s"}
      </p>
      <Pedestal rank={rank} />
    </div>
  );
}

/**
 * `meta` é a meta de COMPARECIMENTO do mês (0–100) — a mesma para todo mundo.
 *
 * Não há meta individual cadastrada, e não faria sentido dividir a do time
 * por pessoa: o número que o pódio mostra é uma taxa (das reuniões que a
 * pessoa marcou, quantas aconteceram), e taxa não se reparte entre gente.
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
