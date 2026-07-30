import Image from "next/image";
import { CLOSER_PHOTOS, fmtBRLCompact } from "@/lib/constants";
import { EmptyPodiumSlot, Pedestal, PodiumShell, initials, PODIUM_MATERIAL, type PodiumRank } from "@/components/podium-shell";
import { PctBadge } from "@/components/status-badge";
import type { CloserStats } from "@/lib/metrics/closers";

function CloserSlot({ rank, closer }: { rank: PodiumRank; closer?: CloserStats }) {
  if (!closer) return <EmptyPodiumSlot rank={rank} />;

  const m = PODIUM_MATERIAL[rank];
  const photo = CLOSER_PHOTOS[closer.name.toLowerCase().split(" ")[0]];

  return (
    <div className={`relative flex flex-col items-center gap-1.5 ${m.order}`}>
      {rank === 1 && (
        <span className="absolute -top-8 text-3xl drop-shadow-[0_2px_10px_rgba(245,179,1,0.65)]" aria-hidden>
          👑
        </span>
      )}
      {photo ? (
        <div className={`overflow-hidden rounded-full border-[3px] bg-canvas ${m.ring} ${m.avatarSize}`}>
          <Image
            src={photo.src}
            alt={closer.name}
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
          {initials(closer.name)}
        </div>
      )}
      <p className="max-w-[100px] truncate text-[13px] font-bold text-primary">{closer.name.split(" ")[0]}</p>
      <p className="text-lg font-black text-accent-light">{fmtBRLCompact(closer.mrr)}</p>
      <p className="text-[10.5px] font-semibold text-secondary">
        {closer.fechados} de {closer.reunioes} reuniões
      </p>
      <PctBadge num={closer.fechados} den={closer.reunioes} />
      <div className="mt-1">
        <Pedestal rank={rank} />
      </div>
    </div>
  );
}

export function ClosersPodium({ closers }: { closers: CloserStats[] }) {
  // calcClosers() already returns the array sorted by mrr desc.
  const [c1, c2, c3, c4] = closers;

  return (
    <PodiumShell title="Pódio Closers" gap="gap-4">
      <CloserSlot rank={2} closer={c2} />
      <CloserSlot rank={1} closer={c1} />
      <CloserSlot rank={3} closer={c3} />
      <CloserSlot rank={4} closer={c4} />
    </PodiumShell>
  );
}
