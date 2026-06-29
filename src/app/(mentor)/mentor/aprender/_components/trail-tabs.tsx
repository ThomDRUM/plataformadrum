"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/mentor/aprender", label: "Trilha Mentor" },
  { href: "/mentor/aprender/trilha-sucessor", label: "Trilha Sucessor" },
  { href: "/mentor/aprender/trilha-sucedido", label: "Trilha Sucedido" },
] as const;

export function TrailTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-border mb-6">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/mentor/aprender"
            ? pathname === "/mentor/aprender" || pathname.startsWith("/mentor/aprender/modulo")
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
