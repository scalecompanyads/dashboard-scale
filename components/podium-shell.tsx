import { glassPanelClass, glassPanelStyle } from "@/lib/glass-panel";

export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TrophyIcon({ className }: { className?: string }) {
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

// SVG crown (replaces the 👑 emoji) — a sharper, brand-consistent mark for
// 1st place that takes a drop-shadow glow the way an emoji glyph can't.
export function CrownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" className={className}>
      <path d="M3.5 8.5 7 11l3.2-5.2a2 2 0 0 1 3.6 0L17 11l3.5-2.5-1.4 9.3a1.5 1.5 0 0 1-1.5 1.3H6.4a1.5 1.5 0 0 1-1.5-1.3L3.5 8.5Z" />
      <rect x="5.5" y="19.3" width="13" height="1.8" rx="0.9" />
    </svg>
  );
}

// Material per position — cylindrical "cap + front face" construction gives
// the domed-top / straight-front / volumetric look. 1st = illuminated blue
// acrylic, 2nd = brushed silver metal, 3rd = matte graphite. Shared by every
// podium (SDRs, closers, ...) so they read as the same visual system.
export const PODIUM_MATERIAL = {
  1: {
    order: "order-2",
    avatarSize: "h-28 w-28 text-3xl",
    ring: "border-accent-light shadow-[0_0_26px_var(--accent-primary-glow)]",
    width: 128,
    height: 148,
    capHeight: 30,
    // Same vivid brand blue as the funnel — mixed with white/black rather
    // than reaching for a separate pale sky-blue.
    topGradient:
      "linear-gradient(135deg, color-mix(in srgb, var(--color-accent-light) 55%, white) 0%, var(--color-accent-light) 48%, var(--color-accent-primary) 100%)",
    frontGradient:
      "linear-gradient(180deg, var(--color-accent-light) 0%, var(--color-accent-primary) 52%, color-mix(in srgb, var(--color-accent-primary) 55%, black) 100%)",
    frontHighlight: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent 45%)",
    // extra bright line right along the dome's top edge — the "raised
    // luminous line" only 1st place gets, on top of the shared edgeGlow
    edgeGlow:
      "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 0 30px var(--accent-primary-soft), 0 -1px 0 rgba(255,255,255,0.9), 0 -6px 16px rgba(150,200,255,0.7)",
    dropShadow: "drop-shadow(0 8px 20px rgba(47,128,237,0.55)) drop-shadow(0 22px 26px rgba(0,0,0,0.55))",
    numberColor: "#ffffff",
    metallicTexture: undefined as string | undefined,
  },
  2: {
    order: "order-1",
    avatarSize: "h-20 w-20 text-xl",
    ring: "border-accent-light/80 shadow-[0_0_18px_var(--accent-primary-glow)]",
    width: 96,
    height: 100,
    capHeight: 22,
    topGradient: "linear-gradient(135deg, #f6f9fc 0%, #d7dfe8 50%, #aab4c2 100%)",
    frontGradient: "linear-gradient(180deg, #c7d0dc 0%, #8d97a6 55%, #545e6c 100%)",
    frontHighlight: "linear-gradient(180deg, rgba(255,255,255,0.35), transparent 45%)",
    edgeGlow: "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 22px rgba(184,196,214,0.2)",
    dropShadow: "drop-shadow(0 16px 20px rgba(0,0,0,0.5))",
    numberColor: "#1a2030",
    // brushed-aluminum stripes — makes the "metal" read as metal instead
    // of a flat gray fill
    metallicTexture:
      "repeating-linear-gradient(115deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 1px, transparent 1px, transparent 5px)",
  },
  3: {
    order: "order-3",
    avatarSize: "h-20 w-20 text-xl",
    ring: "border-accent-light/60 shadow-[0_0_14px_var(--accent-primary-glow)]",
    width: 96,
    height: 74,
    capHeight: 18,
    // lightened vs. the original near-black graphite so 3rd place still
    // reads clearly even with no data (was disappearing into the canvas)
    topGradient: "linear-gradient(135deg, #5c636c 0%, #454b54 55%, #262b32 100%)",
    frontGradient: "linear-gradient(180deg, #363c44 0%, #262a30 55%, #14161a 100%)",
    frontHighlight: "linear-gradient(180deg, rgba(255,255,255,0.16), transparent 45%)",
    edgeGlow: "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 16px rgba(0,0,0,0.3)",
    dropShadow: "drop-shadow(0 12px 16px rgba(0,0,0,0.5))",
    numberColor: "#d6dae1",
    metallicTexture: undefined as string | undefined,
  },
  4: {
    order: "order-4",
    avatarSize: "h-14 w-14 text-base",
    ring: "border-hairline-strong shadow-none",
    width: 76,
    height: 40,
    capHeight: 14,
    topGradient: "linear-gradient(135deg, #3a3f46 0%, #282c31 55%, #16181b 100%)",
    frontGradient: "linear-gradient(180deg, #1e2125 0%, #17191c 55%, #0a0b0c 100%)",
    frontHighlight: "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 45%)",
    edgeGlow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 10px rgba(0,0,0,0.3)",
    dropShadow: "drop-shadow(0 8px 12px rgba(0,0,0,0.45))",
    numberColor: "#8a92a0",
    metallicTexture: undefined as string | undefined,
  },
} as const;

export type PodiumRank = 1 | 2 | 3 | 4;

export function Pedestal({ rank }: { rank: PodiumRank }) {
  const m = PODIUM_MATERIAL[rank];
  const frontTop = m.capHeight / 2;

  return (
    <div className="relative shrink-0" style={{ width: m.width, height: m.height }}>
      <div className="absolute left-0 top-0" style={{ width: m.width, height: m.height, filter: m.dropShadow }}>
        {/* domed top */}
        <div className="absolute left-0 top-0 w-full overflow-hidden rounded-[50%]" style={{ height: m.capHeight, background: m.topGradient }} aria-hidden>
          {m.metallicTexture && <div className="absolute inset-0" style={{ background: m.metallicTexture }} />}
        </div>
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
          {m.metallicTexture && <div className="absolute inset-0" style={{ background: m.metallicTexture }} aria-hidden />}
          <div className="relative flex h-full items-center justify-center">
            <span
              className="font-black leading-none"
              style={{
                color: m.numberColor,
                fontSize: rank === 4 ? "clamp(13px,3cqw,19px)" : "clamp(18px,5cqw,30px)",
                textShadow: "0 2px 6px rgba(0,0,0,0.45)",
              }}
            >
              {rank}º
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyPodiumSlot({ rank }: { rank: PodiumRank }) {
  const m = PODIUM_MATERIAL[rank];
  return (
    <div className={`flex flex-col items-center gap-2.5 ${m.order}`}>
      <div className={`flex items-center justify-center rounded-full border-[3px] bg-surface-2 text-accent-light ${m.ring} ${m.avatarSize}`}>
        <svg viewBox="0 0 24 24" width="42%" height="42%" fill="currentColor">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
      </div>
      <p className="text-[clamp(13px,2.4cqw,17px)] font-bold text-primary">---</p>
      <p className="text-[clamp(18px,5.5cqw,28px)] font-black text-accent-light">—</p>
      <p className="mb-1 text-[clamp(11px,2cqw,14px)] font-semibold text-secondary">sem dados</p>
      <div className="opacity-50">
        <Pedestal rank={rank} />
      </div>
    </div>
  );
}

export function PodiumShell({
  title,
  subtitle,
  gap = "gap-7",
  footer,
  children,
}: {
  title: string;
  /** Explains the ranking criterion right under the title (e.g. "Ordenado por valor fechado") so it's never ambiguous what's being ranked. */
  subtitle?: string;
  gap?: string;
  /** Extra row below the podium itself — used for a 4th place that doesn't get a full pedestal slot. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden ${glassPanelClass} pb-3`}
      style={{ ...glassPanelStyle, containerType: "inline-size" }}
    >
      {/* 1st place casts light straight up through the card, like the block is the light source */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[85%] w-36 -translate-x-1/2 bg-gradient-to-t from-accent-primary/45 via-accent-light/15 to-transparent blur-2xl" aria-hidden />
      {/* discreet radial glow behind 1st place specifically, higher up than the bottom light beam */}
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-light/20 blur-3xl" aria-hidden />

      <div className="relative mb-3">
        {/* cqw (container-query width, tied to this card's own rendered
            width) instead of a flat px size — grows on a wide TV layout
            without touching how it looks at normal desktop widths */}
        <h3 className="flex items-center gap-2 text-[clamp(13px,2.2cqw,17px)] font-bold uppercase tracking-wide text-primary">
          <TrophyIcon className="text-gold" />
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 pl-[21px] text-[clamp(11px,1.8cqw,13px)] font-medium text-muted">{subtitle}</p>}
      </div>

      {/* pedestals sit close to the card's own bottom edge, as if rising
          from inside it, but not perfectly flush — leaves a hair of room
          so they read as "raised" rather than glued to the floor */}
      <div className={`relative flex flex-1 items-end justify-center ${gap}`}>{children}</div>

      {footer}
    </div>
  );
}
