import Link from "next/link";
import { ArrowLeft, BookOpen, ClipboardList, Circle, CircleDot, CircleAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isTopicDone, type TopicStatus } from "@/lib/student/topic-status";

export type TopicViewState = "overview" | "repertorio" | "exercicio";

interface SidebarTopic {
  id: string;
  orderIndex: number;
  title: string;
  status: TopicStatus;
  hasExercise: boolean;
}

interface Props {
  moduleTitle: string;
  moduleNumber: number;
  topics: SidebarTopic[];
  currentTopicId: string;
  activeState: TopicViewState;
  moduleId: string;
  baseHref?: string;
  backHref?: string;
  backLabel?: string;
  hideStatus?: boolean;
}

function SubItemStatusIcon({
  done,
  active,
  warning,
}: {
  done: boolean;
  active: boolean;
  warning?: boolean;
}) {
  if (warning) {
    return (
      <CircleAlert
        className="w-3 h-3 text-amber-500 flex-shrink-0"
        aria-label="Enviado com respostas em branco"
      />
    );
  }
  if (done) return <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />;
  if (active) return <CircleDot className="w-3 h-3 text-sky-600 flex-shrink-0" />;
  return <Circle className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />;
}

export function LearnSidebar({
  moduleTitle,
  moduleNumber,
  topics,
  currentTopicId,
  activeState,
  moduleId,
  baseHref = "/modulo",
  backHref = "/",
  backLabel = "Voltar à formação",
  hideStatus = false,
}: Props) {
  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-10 flex max-h-[calc(100vh-5rem)] flex-col rounded-lg border border-border bg-card">
        <div className="px-5 py-6 border-b border-border">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
            Módulo {moduleNumber}
          </p>
          <p className="text-sm font-semibold text-foreground leading-snug">{moduleTitle}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {topics.map((t) => {
            const isCurrentTopic = t.id === currentTopicId;
            const topicHref = `${baseHref}/${moduleId}/topico/${t.id}`;
            const repertoireDone = t.status !== "not_started";
            const exerciseDone = isTopicDone(t.status);
            const exerciseIncomplete = t.status === "completed_partial";
            const exerciseActive = t.status === "repertoire_viewed";

            const overviewActive = isCurrentTopic && activeState === "overview";
            const repertoireActive = isCurrentTopic && activeState === "repertorio";
            const exerciseSelected = isCurrentTopic && activeState === "exercicio";

            return (
              <div key={t.id} className={cn("rounded-md", isCurrentTopic && "bg-accent/40 -mx-1 px-1 py-1.5")}>
                <Link
                  href={topicHref}
                  className={cn(
                    "block px-2 py-1 rounded-md text-xs font-medium leading-snug mb-1 transition-colors",
                    overviewActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  )}
                >
                  {moduleNumber}.{t.orderIndex} — {t.title}
                </Link>
                <div className="space-y-0.5">
                  <Link
                    href={`${topicHref}/repertorio`}
                    className={cn(
                      "flex items-start gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      repertoireActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {!hideStatus && (
                      <span className="mt-0.5"><SubItemStatusIcon done={repertoireDone} active={false} /></span>
                    )}
                    <BookOpen className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/50 flex-shrink-0" />
                    <span className="leading-snug">Repertório</span>
                  </Link>
                  {t.hasExercise && (
                    <Link
                      href={`${topicHref}/exercicio`}
                      className={cn(
                        "flex items-start gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                        exerciseSelected
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {!hideStatus && (
                        <span className="mt-0.5">
                          <SubItemStatusIcon
                            done={exerciseDone}
                            active={exerciseActive}
                            warning={exerciseIncomplete}
                          />
                        </span>
                      )}
                      <ClipboardList className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/50 flex-shrink-0" />
                      <span className="leading-snug">Exercício</span>
                    </Link>
                  )}
                </div>
              </div>
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
      </div>
    </aside>
  );
}
