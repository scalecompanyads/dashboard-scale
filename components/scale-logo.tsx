import Image from "next/image";

/** Ícone + assinatura "Scale". A assinatura é o único lugar que ainda usa a
 * serifa da marca (Canela Deck, self-hosted de public/canela-text-trial) —
 * ela é marca, não interface. Títulos e rótulos ficam na Manrope
 * (font-display) e o corpo na Inter. */
export function ScaleLogo({ size = "md" }: { size?: "md" | "lg" }) {
  const iconPx = size === "lg" ? 34 : 27;
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/scale-icon.png" alt="" width={iconPx} height={iconPx} priority />
      <span
        className={`font-brand font-bold leading-none tracking-tight text-primary ${size === "lg" ? "text-[26px]" : "text-[20px]"}`}
      >
        Scale
      </span>
    </span>
  );
}
