"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/usuarios": "Usuários",
  "/admin/familias": "Famílias",
  "/admin/formacoes": "Formações",
  "/admin/modulos": "Módulos",
};

export function AdminHeader() {
  const pathname = usePathname();
  const activeHref = Object.keys(pageTitles)
    .filter((href) => pathname.startsWith(href))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <h1 className="text-sm font-medium text-foreground">
        {activeHref ? pageTitles[activeHref] : null}
      </h1>
    </header>
  );
}
