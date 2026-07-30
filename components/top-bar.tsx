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
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-hairline bg-surface-1 px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-5">
        <Image src="/scale-logo.svg" alt="Scale Company" width={104} height={26} className="h-5 w-auto opacity-90" priority />

        <nav className="flex items-center gap-1 rounded-lg bg-black/20 p-1">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  "rounded-md px-3.5 py-1.5 text-[12.5px] font-bold transition-all duration-200 " +
                  (active
                    ? "bg-gradient-to-r from-accent-primary to-accent-light text-ink-strong shadow-[0_0_18px_var(--accent-primary-glow)]"
                    : "text-secondary hover:text-white")
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2.5">{children}</div>
        {userEmail && <span className="hidden text-[12px] text-muted md:inline">{userEmail}</span>}
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-hairline px-3.5 py-1.5 text-[12.5px] font-semibold text-secondary transition-all duration-200 hover:border-hairline-strong hover:bg-white/[0.04] hover:text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
