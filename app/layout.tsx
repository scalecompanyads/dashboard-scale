import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import localFont from "next/font/local";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Títulos, rótulos de KPI e cabeçalhos de tabela. Variável (200–800), então
// não precisa declarar pesos. Substituiu a Canela nesses lugares: em caixa
// alta e corpo pequeno — que é como os rótulos de KPI aparecem — a serifa
// perdia legibilidade.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

// Serifa da marca (Canela Deck, igual ao site institucional). Hoje serve só
// à assinatura "Scale" do topo: é marca, não interface. Corte trial
// self-hosted; trocar pelos arquivos licenciados no mesmo caminho quando
// houver licença.
const canela = localFont({
  variable: "--font-canela",
  display: "swap",
  src: [
    { path: "../public/canela-text-trial/CanelaDeck-Regular-Trial.otf", weight: "400", style: "normal" },
    { path: "../public/canela-text-trial/CanelaDeck-Bold-Trial.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Dashboard Comercial — Scale",
  description: "Dashboard comercial e de marketing da Scale Company.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable} ${canela.variable} antialiased`}>
      {/* suppressHydrationWarning: some browser extensions (ColorZilla, Grammarly, etc.)
          inject attributes like cz-shortcut-listen into <body> before React hydrates,
          which otherwise falsely reports as a hydration mismatch. */}
      <body className="min-h-screen" suppressHydrationWarning>
        <DotPattern
          cr={1}
          className={cn(
            "fixed inset-0 -z-10 h-full w-full fill-accent-primary/10 md:fill-accent-primary/10",
            "[mask-image:radial-gradient(ellipse_80%_60%_at_50%_-10%,white,transparent_75%)]"
          )}
        />
        {children}
      </body>
    </html>
  );
}
