import Image from "next/image";
import { SDR_PHOTOS } from "@/lib/constants";
import { EmptyPodiumSlot, Pedestal, PodiumShell, CrownIcon, initials, PODIUM_MATERIAL, type PodiumRank } from "@/components/podium-shell";
import { podiumTop3, type SdrStats } from "@/lib/metrics/sdrs";

function SdrSlot({ rank, sdr }: { rank: PodiumRank; sdr?: SdrStats }) {
  if (!sdr) return <EmptyPodiumSlot rank={rank} />;

  const m = PODIUM_MATERIAL[rank];
  const pct = sdr.agendadas ? (sdr.feitas / sdr.agendadas) * 100 : 0;
  const photo = SDR_PHOTOS[sdr.name.toLowerCase().split(" ")[0]];

  return (
    <div className={`relative flex flex-col items-center gap-2.5 ${m.order}`}>
      {rank === 1 && (
        <span className="absolute -top-7 text-gold drop-shadow-[0_2px_10px_rgba(245,179,1,0.65)]" aria-hidden>
          <CrownIcon />
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
      <p className="max-w-[110px] truncate text-[13px] font-bold text-primary">{sdr.name.split(" ")[0]}</p>
      <p className="text-xl font-black text-accent-light">{pct.toFixed(1)}%</p>
      <p className="mb-1 text-[11px] font-semibold text-secondary">
        {sdr.feitas} de {sdr.agendadas} ag.
      </p>
      <Pedestal rank={rank} />
    </div>
  );
}

export function SdrPodium({ sdrs }: { sdrs: SdrStats[] }) {
  const [s1, s2, s3] = podiumTop3(sdrs);

  return (
    <PodiumShell title="Pódio SDRs" subtitle="Ordenado por volume de reuniões (agendadas + realizadas)">
      <SdrSlot rank={2} sdr={s2} />
      <SdrSlot rank={1} sdr={s1} />
      <SdrSlot rank={3} sdr={s3} />
    </PodiumShell>
  );
}
