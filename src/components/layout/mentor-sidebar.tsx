"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, Users, GraduationCap, BookOpen, LogOut, Handshake } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/mentor/projeto", label: "Projeto", icon: LayoutDashboard },
  { href: "/mentor/cronograma", label: "Cronograma", icon: Calendar },
  { href: "/mentor/alinhamentos", label: "Alinhamentos", icon: Handshake },
  { href: "/mentor/familia", label: "Família", icon: Users },
  { href: "/mentor/mentorados", label: "Mentorados", icon: GraduationCap },
  { href: "/mentor/aprender", label: "Aprender", icon: BookOpen },
];

interface Props {
  userName: string;
  familyName: string;
}

export function MentorSidebar({ userName, familyName }: Props) {
  const pathname = usePathname();

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-card border-r border-border flex flex-col z-20">
      {/* Header */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-foreground">D</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">DRUM</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{familyName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
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

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md mb-1">
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">Mentor DRUM</p>
          </div>
        </div>
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
