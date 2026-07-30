import Image from "next/image";
import { SDR_PHOTOS } from "@/lib/constants";
import { glassPanelClass, glassPanelStyle } from "@/lib/glass-panel";
import { podiumTop3, type SdrStats } from "@/lib/metrics/sdrs";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H4.5a1 1 0 0 0-1 1.2c.4 1.9 1.6 3.5 3.5 4" />
      <path d="M16 5h3.5a1 1 0 0 1 1 1.2c-.4 1.9-1.6 3.5-3.5 4" />
      <path d="M10 13.5v2.5M14 13.5v2.5" />
      <path d="M8.5 20.5h7" />
      <path d="M9.5 16h5l.7 4.5h-6.4L9.5 16Z" />
    </svg>
  );
}

// Material per position — cylindrical "cap + front face" construction gives
// the domed-top / straight-front / volumetric look. 1st = illuminated blue
// acrylic, 2nd = brushed silver metal, 3rd = matte graphite.
const MATERIAL = {
  1: {
    order: "order-2",
    avatarSize: "h-24 w-24 text-3xl",
    ring: "border-accent-light shadow-[0_0_26px_var(--accent-primary-glow)]",
    width: 116,
    height: 132,
    capHeight: 28,
    topGradient: "linear-gradient(135deg, #dcefff 0%, #8fc4fb 48%, #4a90e8 100%)",
    frontGradient: "linear-gradient(180deg, #4c94ea 0%, #2568c4 52%, #103a73 100%)",
    frontHighlight: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent 45%)",
    edgeGlow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 0 30px rgba(96,165,250,0.25)",
    dropShadow: "drop-shadow(0 8px 20px rgba(47,128,237,0.55)) drop-shadow(0 22px 26px rgba(0,0,0,0.55))",
    numberColor: "#ffffff",
  },
  2: {
    order: "order-1",
    avatarSize: "h-[72px] w-[72px] text-xl",
    ring: "border-accent-light/80 shadow-[0_0_18px_var(--accent-primary-glow)]",
    width: 92,
    height: 90,
    capHeight: 22,
    topGradient: "linear-gradient(135deg, #f6f9fc 0%, #d7dfe8 50%, #aab4c2 100%)",
    frontGradient: "linear-gradient(180deg, #c7d0dc 0%, #8d97a6 55%, #545e6c 100%)",
    frontHighlight: "linear-gradient(180deg, rgba(255,255,255,0.35), transparent 45%)",
    edgeGlow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 22px rgba(184,196,214,0.2)",
    dropShadow: "drop-shadow(0 16px 20px rgba(0,0,0,0.5))",
    numberColor: "#1a2030",
  },
  3: {
    order: "order-3",
    avatarSize: "h-[72px] w-[72px] text-xl",
    ring: "border-accent-light/60 shadow-[0_0_14px_var(--accent-primary-glow)]",
    width: 92,
    height: 62,
    capHeight: 18,
    topGradient: "linear-gradient(135deg, #4a5058 0%, #33383f 55%, #1c2026 100%)",
    frontGradient: "linear-gradient(180deg, #292d33 0%, #1a1d21 55%, #0a0b0d 100%)",
    frontHighlight: "linear-gradient(180deg, rgba(255,255,255,0.14), transparent 45%)",
    edgeGlow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 16px rgba(0,0,0,0.3)",
    dropShadow: "drop-shadow(0 12px 16px rgba(0,0,0,0.5))",
    numberColor: "#c7cdd6",
  },
} as const;

function Pedestal({ rank }: { rank: 1 | 2 | 3 }) {
  const m = MATERIAL[rank];
  const frontTop = m.capHeight / 2;

  return (
    <div className="relative shrink-0" style={{ width: m.width, height: m.height }}>
      <div className="absolute left-0 top-0" style={{ width: m.width, height: m.height, filter: m.dropShadow }}>
        {/* domed top */}
        <div className="absolute left-0 top-0 w-full rounded-[50%]" style={{ height: m.capHeight, background: m.topGradient }} aria-hidden />
        {/* straight front face — square bottom corners, since the pedestal
            is meant to look like it continues down into the card's floor */}
        <div
          className="absolute left-0 w-full overflow-hidden"
          style={{
            top: frontTop,
            height: m.height - frontTop,
            background: m.frontGradient,
            boxShadow: m.edgeGlow,
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: m.frontHighlight }} aria-hidden />
          <div className="relative flex h-full items-center justify-center">
            <span className="text-[26px] font-black leading-none" style={{ color: m.numberColor, textShadow: "0 2px 6px rgba(0,0,0,0.45)" }}>
              {rank}º
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumSlot({ rank, sdr }: { rank: 1 | 2 | 3; sdr?: SdrStats }) {
  const m = MATERIAL[rank];

  if (!sdr) {
    return (
      <div className={`flex flex-col items-center gap-2.5 ${m.order}`}>
        <div className={`flex items-center justify-center rounded-full border-[3px] bg-surface-2 text-accent-light ${m.ring} ${m.avatarSize}`}>
          <svg viewBox="0 0 24 24" width="42%" height="42%" fill="currentColor">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          </svg>
        </div>
        <p className="text-[13px] font-bold text-primary">---</p>
        <p className="text-xl font-black text-accent-light">0%</p>
        <p className="mb-1 text-[11px] font-semibold text-secondary">0 de 0 ag.</p>
        <div className="opacity-50">
          <Pedestal rank={rank} />
        </div>
      </div>
    );
  }

  const pct = sdr.agendadas ? (sdr.feitas / sdr.agendadas) * 100 : 0;
  const photo = SDR_PHOTOS[sdr.name.toLowerCase().split(" ")[0]];

  return (
    <div className={`relative flex flex-col items-center gap-2.5 ${m.order}`}>
      {rank === 1 && (
        <span className="absolute -top-8 text-3xl drop-shadow-[0_2px_10px_rgba(245,179,1,0.65)]" aria-hidden>
          👑
        </span>
      )}
      {photo ? (
        <div className={`overflow-hidden rounded-full border-[3px] bg-canvas ${m.ring} ${m.avatarSize}`}>
          <Image src={photo} alt={sdr.name} width={96} height={96} className="h-full w-full object-cover" />
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
    <div className={`relative flex h-full flex-col overflow-hidden ${glassPanelClass} pb-0`} style={glassPanelStyle}>
      {/* 1st place casts light straight up through the card, like the block is the light source */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[85%] w-36 -translate-x-1/2 bg-gradient-to-t from-accent-primary/45 via-accent-light/15 to-transparent blur-2xl" aria-hidden />

      <h3 className="relative mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-primary">
        <TrophyIcon className="text-gold" />
        Pódio SDRs
      </h3>

      {/* pedestals sit flush with the card's own bottom edge, as if rising from inside it */}
      <div className="relative flex flex-1 items-end justify-center gap-7">
        <PodiumSlot rank={2} sdr={s2} />
        <PodiumSlot rank={1} sdr={s1} />
        <PodiumSlot rank={3} sdr={s3} />
      </div>
    </div>
  );
}
