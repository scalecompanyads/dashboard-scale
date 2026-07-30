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
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline/70 px-1 pb-4">
      <div className="flex flex-wrap items-center gap-6">
        <Image src="/scale-logo.svg" alt="Scale Company" width={104} height={26} className="h-5 w-auto opacity-90" priority />

        <nav className="flex items-center gap-1">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  "relative rounded-md px-3 py-1.5 text-[13px] font-bold transition-all duration-200 " +
                  (active ? "text-white" : "text-muted hover:text-white")
                }
              >
                {tab.label}
                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-[17px] h-[2px] rounded-full bg-gradient-to-r from-accent-primary to-accent-light shadow-[0_0_10px_var(--accent-primary-glow)]"
                    aria-hidden
                  />
                )}
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
          className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-secondary transition-all duration-200 hover:bg-white/[0.05] hover:text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
