import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavChild {
  id: string;
  href: string;
  label: string;
}

interface NavItem {
  id: string | null;
  href: string;
  label: string;
  children?: NavChild[];
}

export function TrailModuleNav({ items, currentId }: { items: NavItem[]; currentId: string | null }) {
  return (
    <nav className="w-56 shrink-0">
      <div className="sticky top-10 flex flex-col gap-2">
        {items.map((item) => {
          const isActive = item.id === currentId;

          return (
            <div key={item.href} className="flex flex-col gap-1">
              <Link
                href={item.href}
                className={cn(
                  "text-left text-sm px-3 py-2 rounded-xl border leading-snug transition-colors",
                  isActive
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>

              {isActive && item.children && item.children.length > 0 && (
                <div className="ml-3 flex flex-col gap-1 border-l border-border pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="text-left text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
