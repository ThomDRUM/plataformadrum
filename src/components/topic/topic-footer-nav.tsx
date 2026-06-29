import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  moduleId: string;
  previousTopicId: string | null;
  nextTopicId: string | null;
  isLastTopic: boolean;
  baseHref?: string;
  backHref?: string;
  backLabel?: string;
}

export function TopicFooterNav({
  moduleId,
  previousTopicId,
  nextTopicId,
  isLastTopic,
  baseHref = "/modulo",
  backHref = "/",
  backLabel = "Voltar à formação",
}: Props) {
  return (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
      {previousTopicId ? (
        <Link
          href={`${baseHref}/${moduleId}/topico/${previousTopicId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Tópico anterior
        </Link>
      ) : (
        <span />
      )}

      {isLastTopic ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
        >
          {backLabel}
        </Link>
      ) : nextTopicId ? (
        <Link
          href={`${baseHref}/${moduleId}/topico/${nextTopicId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
        >
          Próximo tópico
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
