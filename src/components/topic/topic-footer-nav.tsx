import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavTarget {
  href: string;
  label: string;
}

interface Props {
  previous: NavTarget | null;
  next: NavTarget | null;
  backHref?: string;
  backLabel?: string;
}

export function TopicFooterNav({
  previous,
  next,
  backHref = "/",
  backLabel = "Voltar à formação",
}: Props) {
  return (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
      {previous ? (
        <Link
          href={previous.href}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {previous.label}
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          href={next.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
        >
          {next.label}
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
        >
          {backLabel}
        </Link>
      )}
    </div>
  );
}
