"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ScaleLogo } from "@/components/scale-logo";

const TABS = [
  { href: "/comercial", label: "Comercial" },
  { href: "/marketing", label: "Marketing" },
] as const;

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

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
      <div className="flex flex-wrap items-center gap-8">
        <ScaleLogo />

        <nav className="flex items-center gap-1.5">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  "rounded-lg border px-3.5 py-1.5 text-[13px] font-bold transition-all duration-200 " +
                  (active
                    ? "border-accent-primary/50 bg-white/[0.06] text-white shadow-[0_0_14px_rgba(17,77,219,0.18)]"
                    : "border-transparent text-muted hover:text-white")
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">{children}</div>
        {userEmail && (
          <div className="hidden items-center gap-2 rounded-lg border border-hairline bg-white/[0.02] py-1 pl-1 pr-3 md:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent-primary to-accent-light text-[10px] font-extrabold text-white">
              {userEmail[0]?.toUpperCase()}
            </span>
            <span className="text-[12px] text-secondary">{userEmail}</span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-secondary transition-all duration-200 hover:bg-white/[0.05] hover:text-white"
        >
          <SignOutIcon />
          Sair
        </button>
      </div>
    </div>
  );
}
