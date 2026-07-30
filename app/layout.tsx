import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dashboard Comercial — Scale",
  description: "Dashboard comercial e de marketing da Scale Company.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      {/* suppressHydrationWarning: some browser extensions (ColorZilla, Grammarly, etc.)
          inject attributes like cz-shortcut-listen into <body> before React hydrates,
          which otherwise falsely reports as a hydration mismatch. */}
      <body className="min-h-screen" suppressHydrationWarning>
        <DotPattern
          cr={1}
          className={cn(
            "fixed inset-0 -z-10 h-full w-full fill-accent-primary/22 md:fill-accent-primary/22",
            "[mask-image:radial-gradient(ellipse_80%_60%_at_50%_-10%,white,transparent_75%)]"
          )}
        />
        {children}
      </body>
    </html>
  );
}
