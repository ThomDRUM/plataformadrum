"use client";

import { useRouter } from "next/navigation";
import type { MentorTopicFull } from "@/lib/mentor/mentor-trail-content";
import { RepertoireBlock } from "@/components/topic/repertoire-block";
import { ExerciseBlock } from "@/components/topic/exercise-block";

/** Próximo tópico dentro do mesmo módulo (âncora local) ou próximo módulo (página). */
export type NextTopicTarget = { type: "anchor"; id: string } | { type: "page"; href: string } | null;

interface Props {
  userId: string;
  moduleNumber: number;
  topic: MentorTopicFull;
  next: NextTopicTarget;
}

export function InteractiveTopicSection({ userId, moduleNumber, topic, next }: Props) {
  const router = useRouter();

  return (
    <div id={`topico-${topic.id}`} className="scroll-mt-24 space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground leading-snug">
          {moduleNumber}.{topic.orderIndex} — {topic.title}
        </h3>

        {topic.learningObjective && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
              O que você vai aprender
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{topic.learningObjective}</p>
          </div>
        )}

        {topic.why && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
              Por quê?
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{topic.why}</p>
          </div>
        )}
      </div>

      <RepertoireBlock
        userId={userId}
        topicId={topic.id}
        item={topic.repertoireItem}
        viewed={topic.repertoireViewed}
        hasExercise={!!topic.exercise}
        onAdvance={() => {
          if (!next) return;
          if (next.type === "anchor") {
            document.getElementById(next.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            router.push(next.href);
          }
        }}
      />

      {topic.exercise && (
        <div id={`exercicio-${topic.id}`} className="scroll-mt-24">
          <ExerciseBlock
            userId={userId}
            topicId={topic.id}
            exercise={topic.exercise}
            questions={topic.exercise.questions}
            initialAnswers={topic.exercise.answers}
            submittedInitial={topic.exercise.submitted}
            nextHref={next ? (next.type === "anchor" ? `#${next.id}` : next.href) : ""}
          />
        </div>
      )}
    </div>
  );
}
