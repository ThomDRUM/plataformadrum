"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ReflectionData, QuestionData, CompetencyOption } from "./page";

interface Props {
  reflection: ReflectionData;
  questions: QuestionData[];
  answersMap: Record<string, string>;
  userId: string;
  competency?: CompetencyOption;
}

function deriveStatus(questions: QuestionData[], answers: Record<string, string>) {
  if (questions.length === 0) return "empty";
  const answered = questions.filter((q) => answers[q.id]?.trim()).length;
  if (answered === 0) return "not_started";
  if (answered < questions.length) return "in_progress";
  return "answered";
}

const STATUS_CONFIG = {
  answered:    { label: "Respondida",    className: "border-emerald-300 text-emerald-700 bg-emerald-50" },
  in_progress: { label: "Em andamento",  className: "border-amber-300/70 text-amber-700 bg-amber-50" },
  not_started: { label: "Não iniciada",  className: "border-border text-muted-foreground" },
  empty:       { label: "Sem perguntas", className: "border-border text-muted-foreground/50" },
};

export function ReflectionCard({ reflection, questions, answersMap: initialAnswers, userId, competency }: Props) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const status = deriveStatus(questions, answers);
  const config = STATUS_CONFIG[status];

  const saveAnswer = useCallback(async (questionId: string, text: string) => {
    setSaving((s) => ({ ...s, [questionId]: true }));
    const supabase = createClient();
    await supabase
      .from("reflection_answers")
      .upsert(
        { user_id: userId, question_id: questionId, answer_text: text, updated_at: new Date().toISOString() },
        { onConflict: "user_id,question_id" }
      );
    setSaving((s) => ({ ...s, [questionId]: false }));
  }, [userId]);

  function handleChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (timers.current[questionId]) clearTimeout(timers.current[questionId]);
    timers.current[questionId] = setTimeout(() => saveAnswer(questionId, value), 800);
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-foreground leading-snug">
              {reflection.title}
            </span>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded border flex-shrink-0",
              config.className
            )}>
              {config.label}
            </span>
            {reflection.is_required && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground/60 flex-shrink-0">
                Obrigatória
              </span>
            )}
          </div>
          {reflection.context && !open && (
            <p className="mt-1 text-[11px] text-muted-foreground/70 truncate">
              {reflection.context}
            </p>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        }
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-border space-y-4">
          {reflection.context && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {reflection.context}
            </p>
          )}

          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground/60">Nenhuma pergunta definida.</p>
          )}

          {questions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <p className="text-sm font-medium text-foreground leading-snug">
                {q.question_text}
              </p>
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder="Escreva sua reflexão..."
                rows={3}
                className={cn(
                  "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm",
                  "placeholder:text-muted-foreground/50 resize-y",
                  "focus:outline-none focus:ring-1 focus:ring-ring"
                )}
              />
              {saving[q.id] && (
                <p className="text-[10px] text-muted-foreground">Salvando...</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
