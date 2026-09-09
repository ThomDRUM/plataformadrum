import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectorModule {
  id: string;
  title: string;
  orderIndex: number;
  unlocked: boolean;
}

interface LeadingItem {
  label: string;
  href: string;
  active: boolean;
}

interface Props {
  modules: SelectorModule[];
  currentModuleId: string;
  baseHref?: string;
  leadingItem?: LeadingItem;
}

export function ModuleSelector({ modules, currentModuleId, baseHref = "/modulo", leadingItem }: Props) {
  return (
    <div className="mb-6 flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 border-b border-border pb-4">
      {leadingItem && (
        <Link
          href={leadingItem.href}
          className={cn(
            "max-w-full flex-shrink-0 whitespace-normal rounded-full border px-3 py-1.5 text-left text-xs transition-colors",
            leadingItem.active
              ? "border-foreground bg-foreground text-background font-medium"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {leadingItem.label}
        </Link>
      )}
      {modules.map((m) => {
        const isCurrent = m.id === currentModuleId;
        const label = `Módulo ${m.orderIndex} — ${m.title}`;

        if (!m.unlocked) {
          return (
            <span
              key={m.id}
              className="flex max-w-full flex-shrink-0 items-center gap-1.5 whitespace-normal rounded-full border border-border px-3 py-1.5 text-left text-xs text-muted-foreground/40"
              title="Módulo bloqueado"
            >
              <Lock className="w-3 h-3" />
              {label}
            </span>
          );
        }

        return (
          <Link
            key={m.id}
            href={`${baseHref}/${m.id}`}
            className={cn(
              "max-w-full flex-shrink-0 whitespace-normal rounded-full border px-3 py-1.5 text-left text-xs transition-colors",
              isCurrent
                ? "border-foreground bg-foreground text-background font-medium"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
