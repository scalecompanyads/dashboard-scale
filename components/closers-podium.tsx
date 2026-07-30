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
      {/* hierarchy: valor fechado is what this podium is ranked by, so it's
          the loudest number here — conversão is a secondary badge, reuniões
          is auxiliary supporting text, not competing for attention */}
      <p className={rank === 1 ? "text-2xl font-black text-accent-light" : "text-lg font-black text-accent-light"}>
        {fmtBRLCompact(closer.mrr)}
      </p>
      <PctBadge num={closer.fechados} den={closer.reunioes} />
      <p className="text-[10px] font-medium text-muted">
        {closer.fechados} de {closer.reunioes} reuniões
      </p>
      <div className="mt-1">
        <Pedestal rank={rank} />
      </div>
    </div>
  );
}

function FourthPlaceRow({ closer }: { closer: CloserStats }) {
  const photo = CLOSER_PHOTOS[closer.name.toLowerCase().split(" ")[0]];
  const pct = closer.reunioes ? (closer.fechados / closer.reunioes) * 100 : 0;

  return (
    <div className="relative mt-3 flex items-center gap-2.5 rounded-xl border border-hairline bg-white/[0.02] px-3 py-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[11px] font-bold text-secondary">4º</span>
      {photo ? (
        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-canvas">
          <Image
            src={photo.src}
            alt={closer.name}
            width={28}
            height={28}
            className="h-full w-full object-cover"
            style={{ objectPosition: photo.position }}
          />
        </div>
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-light text-[10px] font-extrabold text-white">
          {initials(closer.name)}
        </div>
      )}
      <p className="truncate text-[12.5px] font-bold text-primary">{closer.name.split(" ")[0]}</p>
      <span className="ml-auto shrink-0 text-[13px] font-black text-accent-light">{fmtBRLCompact(closer.mrr)}</span>
      <span className="shrink-0 text-[11px] font-semibold text-secondary">{pct.toFixed(0)}% conversão</span>
    </div>
  );
}

export function ClosersPodium({ closers }: { closers: CloserStats[] }) {
  // calcClosers() already returns the array sorted by mrr desc.
  const [c1, c2, c3, c4] = closers;

  return (
    <div className="h-full">
      {/* narrower layouts: top 3 get a pedestal, 4th is a compact row */}
      <div className="h-full 2xl:hidden">
        <PodiumShell title="Pódio Closers" gap="gap-4" footer={c4 && <FourthPlaceRow closer={c4} />}>
          <CloserSlot rank={2} closer={c2} />
          <CloserSlot rank={1} closer={c1} />
          <CloserSlot rank={3} closer={c3} />
        </PodiumShell>
      </div>
      {/* 2xl and up: enough width for a real 4th pedestal instead */}
      <div className="hidden h-full 2xl:block">
        <PodiumShell title="Pódio Closers" gap="gap-3">
          <CloserSlot rank={2} closer={c2} />
          <CloserSlot rank={1} closer={c1} />
          <CloserSlot rank={3} closer={c3} />
          <CloserSlot rank={4} closer={c4} />
        </PodiumShell>
      </div>
    </div>
  );
}
