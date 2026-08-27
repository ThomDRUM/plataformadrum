"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FormattedText } from "@/components/topic/formatted-text";

export interface ExerciseData {
  id: string;
  title: string;
  instructions: string | null;
}

export interface QuestionData {
  id: string;
  question_text: string;
  order_index: number;
}

interface Props {
  userId: string;
  topicId: string;
  exercise: ExerciseData;
  questions: QuestionData[];
  initialAnswers: Record<string, string>;
  submittedInitial: boolean;
  nextHref: string;
}

export function ExerciseBlock({ userId, topicId, exercise, questions, initialAnswers, submittedInitial, nextHref }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [submitted, setSubmitted] = useState(submittedInitial);
  const [submitting, setSubmitting] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const allAnswered = useMemo(
    () => questions.every((q) => (answers[q.id] ?? "").trim().length > 0),
    [questions, answers]
  );

  const saveAnswer = useCallback(
    async (questionId: string, text: string) => {
      const supabase = createClient();
      await supabase.from("exercise_answers").upsert(
        {
          user_id: userId,
          question_id: questionId,
          answer_text: text,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "question_id,user_id" }
      );
    },
    [userId]
  );

  function handleChange(questionId: string, value: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (timers.current[questionId]) clearTimeout(timers.current[questionId]);
    timers.current[questionId] = setTimeout(() => saveAnswer(questionId, value), 3000);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const supabase = createClient();
    const now = new Date().toISOString();

    for (const q of questions) {
      if (timers.current[q.id]) clearTimeout(timers.current[q.id]);
      await supabase.from("exercise_answers").upsert(
        {
          user_id: userId,
          question_id: q.id,
          answer_text: answers[q.id] ?? "",
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: "question_id,user_id" }
      );
    }

    await supabase.from("user_topic_progress").upsert(
      {
        user_id: userId,
        topic_id: topicId,
        exercise_completed: true,
        completed_at: now,
      },
      { onConflict: "user_id,topic_id" }
    );

    setSubmitted(true);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
        Exercício
      </p>

      <div className="border border-border rounded-lg p-5 space-y-5">
        <div>
          <p className="text-sm font-medium text-foreground leading-snug">{exercise.title}</p>
          {exercise.instructions && (
            <FormattedText
              text={exercise.instructions}
              className="mt-1.5 text-base text-muted-foreground leading-relaxed"
            />
          )}
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <FormattedText
                text={q.question_text}
                className="text-base font-medium text-foreground leading-snug"
              />
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                readOnly={submitted}
                placeholder="Escreva sua resposta..."
                rows={4}
                className={cn(
                  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground/50 resize-y",
                  "focus:outline-none focus:ring-1 focus:ring-ring",
                  submitted && "bg-muted/30 text-muted-foreground cursor-default"
                )}
              />
            </div>
          ))}
        </div>

        {submitted ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-md text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed"
            >
              Exercício enviado
            </button>
            {nextHref && (
              <Link
                href={nextHref}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Próximo →
              </Link>
            )}
          </div>
        ) : (
          allAnswered && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              Enviar exercício
            </button>
          )
        )}
      </div>
    </div>
  );
}
