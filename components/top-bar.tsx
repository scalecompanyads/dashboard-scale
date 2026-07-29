"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/comercial", label: "Comercial" },
  { href: "/marketing", label: "Marketing" },
] as const;

export function TopBar({ userEmail, children }: { userEmail: string | null; children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/auth/signout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface-1 px-5 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center gap-6">
        <Image src="/scale-logo.svg" alt="Scale Company" width={110} height={28} className="h-6 w-auto opacity-95" priority />
        <nav className="flex gap-2">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  "rounded-full border px-4 py-2 text-xs font-bold tracking-wide backdrop-blur-sm transition " +
                  (active
                    ? "border-accent-primary bg-accent-primary/20 text-white shadow-[0_0_20px_var(--accent-primary-glow)]"
                    : "border-hairline bg-black/30 text-secondary hover:border-hairline-strong hover:bg-white/5 hover:text-white")
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {children}
        {userEmail && <span className="hidden text-xs text-muted sm:inline">{userEmail}</span>}
        <button
          onClick={handleSignOut}
          className="rounded-full border border-hairline bg-black/30 px-3 py-2 text-xs font-semibold text-secondary transition hover:border-hairline-strong hover:text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
