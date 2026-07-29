import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
