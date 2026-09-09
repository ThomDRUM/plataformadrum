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
    <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
      {previous ? (
        <Link
          href={previous.href}
          className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
          className="ml-auto inline-flex min-w-0 items-center gap-1.5 text-right text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
        >
          {next.label}
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <Link
          href={backHref}
          className="ml-auto inline-flex min-w-0 items-center gap-1.5 text-right text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
        >
          {backLabel}
        </Link>
      )}
    </div>
  );
}
