"use client";

import { useState } from "react";
import { CheckCircle2, Circle, CircleAlert, ChevronDown, ChevronUp } from "lucide-react";
import type { AdminAnswerRow, AdminTopicProgressRow } from "@/lib/admin/queries";

function formatDateTimeBR(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pt-BR");
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} às ${time}`;
}

function RespostaBlock({ answer }: { answer: AdminAnswerRow }) {
  return (
    <div className="space-y-2 py-3 border-b border-border last:border-b-0">
      <p className="text-sm font-medium text-foreground leading-snug">{answer.questionText}</p>
      <div className="rounded-md bg-muted/30 border border-border px-3 py-2 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {answer.answerText || "—"}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {answer.submittedAt ? `Enviado em ${formatDateTimeBR(answer.submittedAt)}` : "Rascunho (não enviado)"}
      </p>
      {answer.mentorNotes.length > 0 && (
        <ul className="space-y-1">
          {answer.mentorNotes.map((n, i) => (
            <li key={i} className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground/70">Nota de {n.mentorName}:</span> {n.note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Versão somente leitura do `TopicRow` do mentor: mostra leitura, exercício e
 * as respostas do aluno, sem campo de nota. Diferente do mentor, exibe também
 * rascunhos autosalvos que ainda não foram enviados.
 */
export function TopicoProgressoRow({
  topic,
  moduleOrderIndex,
}: {
  topic: AdminTopicProgressRow;
  moduleOrderIndex: number;
}) {
  const [showAnswers, setShowAnswers] = useState(false);
  const partial = topic.status === "completed_partial";
  const hasAnyAnswer = topic.hasExercise && topic.answers.some((a) => a.answerText);

  return (
    <div className="rounded-md border border-border/60">
      <div className="flex items-center gap-2.5 px-3 py-2">
        {partial ? (
          <CircleAlert
            className="w-3.5 h-3.5 text-amber-500 shrink-0"
            aria-label="Enviado com respostas em branco"
          />
        ) : topic.status === "completed" ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        ) : (
          <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            {moduleOrderIndex}.{topic.orderIndex} — {topic.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {topic.repertoireViewed ? "Leitura concluída" : "Leitura pendente"}
            {topic.hasExercise && (
              <>
                {" · "}
                {topic.exerciseCompleted
                  ? partial
                    ? "Exercício enviado com respostas em branco"
                    : "Exercício enviado"
                  : "Exercício pendente"}
              </>
            )}
          </p>
        </div>
        {hasAnyAnswer && (
          <button
            type="button"
            onClick={() => setShowAnswers((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            Ver respostas
            {showAnswers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {showAnswers && hasAnyAnswer && (
        <div className="px-3 pb-3 border-t border-border/60">
          {topic.answers.map((a) => (
            <RespostaBlock key={a.questionId} answer={a} />
          ))}
        </div>
      )}
    </div>
  );
}
