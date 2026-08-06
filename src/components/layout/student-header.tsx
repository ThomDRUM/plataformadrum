"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function StudentHeader() {
  const pathname = usePathname();
  const title =
    pathname === "/"
      ? "Home"
      : pathname === "/aprender" || pathname.startsWith("/modulo")
        ? "Aprender"
        : null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <h1 className="text-sm font-medium text-foreground">{title}</h1>
    </header>
  );
}
