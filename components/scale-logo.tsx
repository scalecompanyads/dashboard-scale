import Image from "next/image";

/** Icon + "Scale" wordmark — the wordmark uses the brand's display serif
 * (Canela Deck, self-hosted from public/canela-text-trial); everything else
 * apart from headings/eyebrows stays on Inter, matching the institutional
 * site's split between Canela Deck (headlines + eyebrows) and Inter (body). */
export function ScaleLogo({ size = "md" }: { size?: "md" | "lg" }) {
  const iconPx = size === "lg" ? 34 : 27;
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/scale-icon.png" alt="" width={iconPx} height={iconPx} priority />
      <span
        className={`font-display font-bold leading-none tracking-tight text-primary ${size === "lg" ? "text-[26px]" : "text-[20px]"}`}
      >
        Scale
      </span>
    </span>
  );
}
