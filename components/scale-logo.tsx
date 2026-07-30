import Image from "next/image";

/** Icon + "Scale" wordmark — the wordmark uses the brand's display serif
 * (Canela, self-hosted from public/canela-text-trial); everything else in
 * the app stays on Inter, matching the brand board's own split (Canela is
 * reserved for headline-style type, never for tracked uppercase labels). */
export function ScaleLogo({ size = "md" }: { size?: "md" | "lg" }) {
  const iconPx = size === "lg" ? 34 : 27;
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/scale-icon.png" alt="" width={iconPx} height={iconPx} priority />
      <span
        className={`font-display font-medium leading-none tracking-tight text-primary ${size === "lg" ? "text-[26px]" : "text-[20px]"}`}
      >
        Scale
      </span>
    </span>
  );
}
