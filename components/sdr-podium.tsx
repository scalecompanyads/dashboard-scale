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
    ring: "border-status-warning shadow-[0_0_30px_rgba(250,178,25,0.4)]",
    blockHeight: "h-24",
    blockColor: "bg-gradient-to-b from-status-warning/40 to-status-warning/5 border-status-warning/50 text-status-warning",
    crown: true,
  },
  2: {
    order: "order-1",
    avatarSize: "h-16 w-16 text-lg",
    ring: "border-accent-primary shadow-[0_0_20px_var(--accent-primary-glow)]",
    blockHeight: "h-16",
    blockColor: "bg-gradient-to-b from-white/25 to-white/5 border-white/40 text-white",
    crown: false,
  },
  3: {
    order: "order-3",
    avatarSize: "h-16 w-16 text-lg",
    ring: "border-[#b45309] shadow-[0_0_20px_rgba(180,83,9,0.4)]",
    blockHeight: "h-10",
    blockColor: "bg-gradient-to-b from-[#b45309]/30 to-[#b45309]/5 border-[#b45309]/40 text-[#fdba74]",
    crown: false,
  },
} as const;

function PodiumSlot({ rank, sdr }: { rank: 1 | 2 | 3; sdr?: SdrStats }) {
  const style = RANK_STYLE[rank];

  if (!sdr) {
    return (
      <div className={`flex flex-col items-center gap-2 ${style.order}`}>
        <div className={`flex items-center justify-center rounded-full border-4 border-[#a855f7] text-[#a855f7] ${style.avatarSize}`}>
          👤
        </div>
        <p className="text-xs font-extrabold text-primary">---</p>
        <p className="text-sm font-black text-[#a855f7]">0%</p>
        <p className="text-[10px] font-semibold text-secondary">0 de 0 ag.</p>
        <div className={`flex w-16 items-start justify-center rounded-t-2xl border border-white/10 pt-1.5 text-lg font-black text-secondary ${style.blockHeight}`}>
          {rank}º
        </div>
      </div>
    );
  }

  const pct = sdr.agendadas ? (sdr.feitas / sdr.agendadas) * 100 : 0;
  const pctColor = pct >= 60 ? "text-status-good" : pct >= 40 ? "text-status-warning" : "text-status-critical";
  const photo = SDR_PHOTOS[sdr.name.toLowerCase().split(" ")[0]];

  return (
    <div className={`relative flex flex-col items-center gap-2 ${style.order}`}>
      {style.crown && (
        <span className="absolute -top-9 animate-[float_3s_ease-in-out_infinite] text-3xl drop-shadow-[0_4px_15px_rgba(250,178,25,0.6)]">
          👑
        </span>
      )}
      {photo ? (
        <div className={`overflow-hidden rounded-full border-4 bg-canvas ${style.ring} ${style.avatarSize}`}>
          <Image src={photo} alt={sdr.name} width={80} height={80} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center rounded-full border-4 bg-accent-primary font-extrabold text-white ${style.ring} ${style.avatarSize}`}
        >
          {initials(sdr.name)}
        </div>
      )}
      <p className="max-w-[100px] truncate text-xs font-extrabold text-primary">{sdr.name.split(" ")[0]}</p>
      <p className={`text-lg font-black ${pctColor}`}>{pct.toFixed(1)}%</p>
      <p className="text-[10px] font-semibold text-secondary">
        {sdr.feitas} de {sdr.agendadas} ag.
      </p>
      <div
        className={`flex w-16 items-start justify-center rounded-t-2xl border pt-1.5 text-lg font-black shadow-[inset_0_2px_10px_rgba(255,255,255,0.15)] ${style.blockHeight} ${style.blockColor}`}
      >
        {rank}º
      </div>
    </div>
  );
}

export function SdrPodium({ sdrs }: { sdrs: SdrStats[] }) {
  const [s1, s2, s3] = podiumTop3(sdrs);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-surface-1 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-secondary">🏆 Pódio SDRs</h3>
      <div className="flex flex-1 items-end justify-center gap-8">
        <PodiumSlot rank={2} sdr={s2} />
        <PodiumSlot rank={1} sdr={s1} />
        <PodiumSlot rank={3} sdr={s3} />
      </div>
    </div>
  );
}
