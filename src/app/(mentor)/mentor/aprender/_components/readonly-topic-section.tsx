import type { ReferenceTopicFull } from "@/lib/mentor/reference-trail";
import { ReadOnlyRepertoireBlock } from "./readonly-repertoire-block";
import { ReadOnlyExerciseBlock } from "./readonly-exercise-block";

export function ReadOnlyTopicSection({
  moduleNumber,
  topic,
}: {
  moduleNumber: number;
  topic: ReferenceTopicFull;
}) {
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

      <ReadOnlyRepertoireBlock item={topic.repertoireItem} />
      {topic.exercise && (
        <div id={`exercicio-${topic.id}`} className="scroll-mt-24">
          <ReadOnlyExerciseBlock exercise={topic.exercise} questions={topic.exercise.questions} />
        </div>
      )}
    </div>
  );
}
