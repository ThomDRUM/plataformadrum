"use client";

import { useState } from "react";
import { CheckCircle2, Circle, CircleAlert, ChevronDown, ChevronUp } from "lucide-react";
import { saveMentorNote } from "@/lib/actions/mentor";
import { isTopicDone, type TopicStatus } from "@/lib/student/topic-status";

interface QuestionData {
  id: string;
  questionText: string;
  answerText: string | null;
  submittedAt: string | null;
  answerId: string | null;
  note: string;
}

export interface TopicData {
  id: string;
  title: string;
  orderIndex: number;
  status: TopicStatus;
  hasExercise: boolean;
  repertoireViewed: boolean;
  exerciseCompleted: boolean;
  exercise: { id: string; title: string; questions: QuestionData[] } | null;
}

function formatDateTimeBR(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("pt-BR");
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} às ${time}`;
}

function QuestionBlock({ question, mentorId }: { question: QuestionData; mentorId: string }) {
  const [note, setNote] = useState(question.note);

  async function handleBlur() {
    if (!question.answerId) return;
    await saveMentorNote(question.answerId, mentorId, note);
  }

  return (
    <div className="space-y-2 py-3 border-b border-border last:border-b-0">
      <p className="text-sm font-medium text-foreground leading-snug">{question.questionText}</p>
      <div className="rounded-md bg-muted/30 border border-border px-3 py-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {question.answerText || "—"}
      </div>
      {question.submittedAt && (
        <p className="text-[11px] text-muted-foreground">Enviado em {formatDateTimeBR(question.submittedAt)}</p>
      )}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sua nota</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleBlur}
          rows={2}
          placeholder="Escreva uma nota sobre esta resposta..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  );
}

export function TopicRow({ topic, mentorId, moduleOrderIndex }: { topic: TopicData; mentorId: string; moduleOrderIndex: number }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const canViewAnswers = topic.hasExercise && isTopicDone(topic.status) && topic.exercise;
  const partial = topic.status === "completed_partial";

  return (
    <div className="rounded-md border border-border/60">
      <div className="flex items-center gap-2.5 px-3 py-2">
        {partial ? (
          <CircleAlert
            className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
            aria-label="Enviado com respostas em branco"
          />
        ) : topic.status === "completed" ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            {moduleOrderIndex}.{topic.orderIndex} — {topic.title}
          </p>
          <p className="text-xs text-muted-foreground">
            📖 {topic.repertoireViewed ? "Repertório visto" : "Repertório não visto"}
            {topic.hasExercise && (
              <>
                {"   "}✏️{" "}
                {topic.exerciseCompleted
                  ? partial
                    ? "Exercício enviado com respostas em branco"
                    : "Exercício enviado"
                  : "Exercício pendente"}
              </>
            )}
          </p>
        </div>
        {canViewAnswers && (
          <button
            onClick={() => setShowAnswers((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            Ver respostas
            {showAnswers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showAnswers && canViewAnswers && topic.exercise && (
        <div className="px-3 pb-3 border-t border-border/60">
          {topic.exercise.questions.map((q) => (
            <QuestionBlock key={q.id} question={q} mentorId={mentorId} />
          ))}
        </div>
      )}
    </div>
  );
}
