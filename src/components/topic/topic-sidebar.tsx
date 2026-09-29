import Link from "next/link";
import { ArrowLeft, Circle, CircleDot, CircleAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicStatus } from "@/lib/student/topic-status";

interface SidebarTopic {
  id: string;
  orderIndex: number;
  title: string;
  status: TopicStatus;
}

interface Props {
  moduleTitle: string;
  moduleNumber: number;
  topics: SidebarTopic[];
  currentTopicId: string;
  moduleId: string;
  baseHref?: string;
  backHref?: string;
  backLabel?: string;
  hideStatus?: boolean;
}

function StatusIcon({ status }: { status: TopicStatus }) {
  if (status === "completed_partial") {
    return (
      <CircleAlert
        className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
        aria-label="Enviado com respostas em branco"
      />
    );
  }
  if (status === "completed") {
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />;
  }
  if (status === "repertoire_viewed") {
    return <CircleDot className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />;
  }
  return <Circle className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />;
}

export function TopicSidebar({
  moduleTitle,
  moduleNumber,
  topics,
  currentTopicId,
  moduleId,
  baseHref = "/modulo",
  backHref = "/",
  backLabel = "Voltar à formação",
  hideStatus = false,
}: Props) {
  return (
    <aside className="fixed inset-y-0 left-56 w-64 bg-card border-r border-border flex flex-col z-10">
      <div className="px-5 py-6 border-b border-border">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
          Módulo {moduleNumber}
        </p>
        <p className="text-sm font-semibold text-foreground leading-snug">{moduleTitle}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {topics.map((t) => {
          const isActive = t.id === currentTopicId;
          return (
            <Link
              key={t.id}
              href={`${baseHref}/${moduleId}/topico/${t.id}`}
              className={cn(
                "flex items-start gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {!hideStatus && (
                <span className="mt-0.5">
                  <StatusIcon status={t.status} />
                </span>
              )}
              <span className="leading-snug">
                {moduleNumber}.{t.orderIndex} — {t.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <Link
          href={backHref}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>
      </div>
    </aside>
  );
}
