"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import {
  Users,
  Map,
  Layers,
  BookOpen,
  MessageSquare,
  Package,
  LogOut,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Mentorados", icon: Users, exact: true },
  { href: "/admin/trilhas", label: "Trilhas", icon: Map },
  { href: "/admin/modulos", label: "Módulos", icon: Layers },
  { href: "/admin/competencias", label: "Competências", icon: Settings },
  { href: "/admin/repertorio", label: "Repertório", icon: BookOpen },
  { href: "/admin/reflexoes", label: "Reflexões", icon: MessageSquare },
  { href: "/admin/entregas", label: "Entregas", icon: Package },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-card border-r border-border flex flex-col z-20">
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-foreground">D</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">DRUM</p>
            <p className="text-xs text-muted-foreground mt-0.5">Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await logout();
            window.location.href = "/login";
          }}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground h-8 px-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-xs">Sair</span>
        </Button>
      </div>
    </aside>
  );
}
