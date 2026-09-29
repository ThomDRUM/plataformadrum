"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RepertoireBlock, type RepertoireItemData } from "./repertoire-block";
import { ExerciseBlock, type ExerciseData, type QuestionData } from "./exercise-block";

interface Props {
  userId: string;
  topicId: string;
  repertoireItem: RepertoireItemData | null;
  repertoireViewedInitial: boolean;
  hasExercise: boolean;
  exercise: ExerciseData | null;
  questions: QuestionData[];
  answersMap: Record<string, string>;
  submittedInitial: boolean;
  nextHref: string;
}

export function TopicBody({
  userId,
  topicId,
  repertoireItem,
  repertoireViewedInitial,
  hasExercise,
  exercise,
  questions,
  answersMap,
  submittedInitial,
  nextHref,
}: Props) {
  const router = useRouter();
  const [repertoireViewed, setRepertoireViewed] = useState(repertoireViewedInitial);
  const exerciseRef = useRef<HTMLDivElement>(null);
  const wasViewedRef = useRef(repertoireViewedInitial);

  useEffect(() => {
    if (repertoireViewed && !wasViewedRef.current && hasExercise) {
      exerciseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    wasViewedRef.current = repertoireViewed;
  }, [repertoireViewed, hasExercise]);

  function handleRepertoireAdvance() {
    setRepertoireViewed(true);
    if (!hasExercise) {
      // Progresso recém-gravado: invalida o Router Cache antes de navegar para
      // a próxima tela não vir de uma cópia em cache (staleTimes, next.config).
      router.refresh();
      router.push(nextHref);
    }
  }

  return (
    <div className="space-y-10">
      <RepertoireBlock
        userId={userId}
        topicId={topicId}
        item={repertoireItem}
        viewed={repertoireViewed}
        hasExercise={hasExercise}
        onAdvance={handleRepertoireAdvance}
      />

      {hasExercise && exercise && repertoireViewed && (
        <div ref={exerciseRef}>
          <ExerciseBlock
            userId={userId}
            topicId={topicId}
            exercise={exercise}
            questions={questions}
            initialAnswers={answersMap}
            submittedInitial={submittedInitial}
            nextHref={nextHref}
          />
        </div>
      )}
    </div>
  );
}
