import Image from "next/image";
import { SDR_PHOTOS } from "@/lib/constants";
import { podiumTop3, type SdrStats } from "@/lib/metrics/sdrs";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const RANK_STYLE = {
  1: {
    order: "order-2",
    avatarSize: "h-20 w-20 text-2xl",
    ring: "border-gold shadow-[0_0_28px_rgba(245,179,1,0.55)]",
    blockHeight: "h-24",
    blockGradient: "linear-gradient(180deg, var(--color-gold-light), var(--color-gold) 70%)",
    blockText: "text-ink-strong",
    pctColor: "text-gold-light",
    crown: true,
  },
  2: {
    order: "order-1",
    avatarSize: "h-16 w-16 text-lg",
    ring: "border-accent-light shadow-[0_0_20px_var(--accent-primary-glow)]",
    blockHeight: "h-16",
    blockGradient: "linear-gradient(180deg, var(--color-accent-light), var(--color-accent-primary) 70%)",
    blockText: "text-ink-strong",
    pctColor: "text-accent-light",
    crown: false,
  },
  3: {
    order: "order-3",
    avatarSize: "h-16 w-16 text-lg",
    ring: "border-silver shadow-[0_0_16px_rgba(184,196,214,0.4)]",
    blockHeight: "h-10",
    blockGradient: "linear-gradient(180deg, #d8e1ee, var(--color-silver) 70%)",
    blockText: "text-ink-strong",
    pctColor: "text-silver",
    crown: false,
  },
} as const;

function PodiumSlot({ rank, sdr }: { rank: 1 | 2 | 3; sdr?: SdrStats }) {
  const style = RANK_STYLE[rank];

  if (!sdr) {
    return (
      <div className={`flex flex-col items-center gap-2 ${style.order}`}>
        <div className={`flex items-center justify-center rounded-full border-4 border-hairline-strong text-muted ${style.avatarSize}`}>
          👤
        </div>
        <p className="text-xs font-bold text-primary">---</p>
        <p className="text-sm font-black text-muted">0%</p>
        <p className="text-[10px] font-semibold text-secondary">0 de 0 ag.</p>
        <div
          className={`flex w-16 items-start justify-center rounded-t-xl pt-1.5 text-lg font-black text-secondary opacity-40 ${style.blockHeight}`}
          style={{ background: "var(--color-hairline)" }}
        >
          {rank}º
        </div>
      </div>
    );
  }

  const pct = sdr.agendadas ? (sdr.feitas / sdr.agendadas) * 100 : 0;
  const photo = SDR_PHOTOS[sdr.name.toLowerCase().split(" ")[0]];

  return (
    <div className={`relative flex flex-col items-center gap-2 ${style.order}`}>
      {style.crown && <span className="text-xl drop-shadow-[0_2px_8px_rgba(245,179,1,0.6)]">👑</span>}
      {photo ? (
        <div className={`overflow-hidden rounded-full border-[3px] bg-canvas ${style.ring} ${style.avatarSize}`}>
          <Image src={photo} alt={sdr.name} width={80} height={80} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center rounded-full border-[3px] bg-gradient-to-br from-accent-primary to-accent-light font-extrabold text-ink-strong ${style.ring} ${style.avatarSize}`}
        >
          {initials(sdr.name)}
        </div>
      )}
      <p className="max-w-[100px] truncate text-xs font-bold text-primary">{sdr.name.split(" ")[0]}</p>
      <p className={`text-lg font-black ${style.pctColor}`}>{pct.toFixed(1)}%</p>
      <p className="text-[10px] font-semibold text-secondary">
        {sdr.feitas} de {sdr.agendadas} ag.
      </p>
      <div
        className={`flex w-16 items-start justify-center rounded-t-xl pt-1.5 text-lg font-black shadow-[inset_0_2px_10px_rgba(255,255,255,0.25),0_-4px_20px_rgba(0,0,0,0.25)] ${style.blockHeight} ${style.blockText}`}
        style={{ background: style.blockGradient }}
      >
        {rank}º
      </div>
    </div>
  );
}

export function SdrPodium({ sdrs }: { sdrs: SdrStats[] }) {
  const [s1, s2, s3] = podiumTop3(sdrs);

  return (
    <div className="flex h-full flex-col rounded-card border border-hairline bg-surface-1 p-5 shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h3 className="mb-2 text-center text-[14px] font-bold text-primary">Ranking de SDRs</h3>
      <div className="flex flex-1 items-end justify-center gap-8">
        <PodiumSlot rank={2} sdr={s2} />
        <PodiumSlot rank={1} sdr={s1} />
        <PodiumSlot rank={3} sdr={s3} />
      </div>
    </div>
  );
}
