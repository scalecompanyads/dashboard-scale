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

// Ring/glow is the same vivid blue for every position — gold is reserved
// only for the #1 crown, and the podium block itself (not the avatar) is
// what carries the medal color (blue for 1st, silver for 2nd, near-black
// for 3rd).
const RANK_STYLE = {
  1: {
    order: "order-2",
    avatarSize: "h-24 w-24 text-3xl",
    ring: "border-accent-light shadow-[0_0_26px_var(--accent-primary-glow)]",
    blockHeight: "h-28",
    blockGradient: "linear-gradient(180deg, var(--color-accent-light), var(--color-accent-primary) 75%)",
    blockGlow: "0_0_30px_rgba(47,128,237,0.55)",
    blockText: "text-white",
    crown: true,
  },
  2: {
    order: "order-1",
    avatarSize: "h-18 w-18 text-xl",
    ring: "border-accent-light/80 shadow-[0_0_18px_var(--accent-primary-glow)]",
    blockHeight: "h-16",
    blockGradient: "linear-gradient(180deg, #e4eaf2, var(--color-silver) 80%)",
    blockGlow: "0_0_16px_rgba(184,196,214,0.3)",
    blockText: "text-ink-strong",
    crown: false,
  },
  3: {
    order: "order-3",
    avatarSize: "h-18 w-18 text-xl",
    ring: "border-accent-light/60 shadow-[0_0_14px_var(--accent-primary-glow)]",
    blockHeight: "h-10",
    blockGradient: "linear-gradient(180deg, #1a2436, #0a0f18 85%)",
    blockGlow: "0_0_12px_rgba(0,0,0,0.4)",
    blockText: "text-secondary",
    crown: false,
  },
} as const;

function PodiumSlot({ rank, sdr }: { rank: 1 | 2 | 3; sdr?: SdrStats }) {
  const style = RANK_STYLE[rank];

  if (!sdr) {
    return (
      <div className={`flex flex-col items-center gap-2.5 ${style.order}`}>
        <div
          className={`flex items-center justify-center rounded-full border-[3px] bg-surface-2 text-accent-light ${style.ring} ${style.avatarSize}`}
        >
          <svg viewBox="0 0 24 24" width="42%" height="42%" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          </svg>
        </div>
        <p className="text-[13px] font-bold text-primary">---</p>
        <p className="text-xl font-black text-accent-light">0%</p>
        <p className="text-[11px] font-semibold text-secondary">0 de 0 ag.</p>
        <div
          className={`flex w-[72px] items-start justify-center rounded-t-xl pt-2 text-xl font-black opacity-70 ${style.blockHeight} ${style.blockText}`}
          style={{ background: style.blockGradient, boxShadow: `inset 0 2px 10px rgba(255,255,255,0.15), ${style.blockGlow}` }}
        >
          {rank}º
        </div>
      </div>
    );
  }

  const pct = sdr.agendadas ? (sdr.feitas / sdr.agendadas) * 100 : 0;
  const photo = SDR_PHOTOS[sdr.name.toLowerCase().split(" ")[0]];

  return (
    <div className={`relative flex flex-col items-center gap-2.5 ${style.order}`}>
      {style.crown && (
        <span className="absolute -top-8 text-3xl drop-shadow-[0_2px_10px_rgba(245,179,1,0.65)]" aria-hidden>
          👑
        </span>
      )}
      {photo ? (
        <div className={`overflow-hidden rounded-full border-[3px] bg-canvas ${style.ring} ${style.avatarSize}`}>
          <Image src={photo} alt={sdr.name} width={96} height={96} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center rounded-full border-[3px] bg-gradient-to-br from-accent-primary to-accent-light font-extrabold text-white ${style.ring} ${style.avatarSize}`}
        >
          {initials(sdr.name)}
        </div>
      )}
      <p className="max-w-[110px] truncate text-[13px] font-bold text-primary">{sdr.name.split(" ")[0]}</p>
      <p className="text-xl font-black text-accent-light">{pct.toFixed(1)}%</p>
      <p className="text-[11px] font-semibold text-secondary">
        {sdr.feitas} de {sdr.agendadas} ag.
      </p>
      <div
        className={`flex w-[72px] items-start justify-center rounded-t-xl pt-2 text-xl font-black ${style.blockHeight} ${style.blockText}`}
        style={{ background: style.blockGradient, boxShadow: `inset 0 2px 10px rgba(255,255,255,0.2), ${style.blockGlow}` }}
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
      <h3 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-primary">
        <span className="text-gold" aria-hidden>
          🏆
        </span>
        Pódio SDRs
      </h3>
      <div className="flex flex-1 items-end justify-center gap-9">
        <PodiumSlot rank={2} sdr={s2} />
        <PodiumSlot rank={1} sdr={s1} />
        <PodiumSlot rank={3} sdr={s3} />
      </div>
    </div>
  );
}
