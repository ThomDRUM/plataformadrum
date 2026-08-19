"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { saveExercise, deleteExercise } from "@/lib/actions/admin/topic-content";
import { Field, TextField, TextAreaField, FormError } from "@/components/admin/form-fields";
import { SectionTitle } from "@/components/admin/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";

interface Props {
  topicId: string;
  moduleId: string;
  exercise: { id: string; title: string; instructions: string | null } | null;
  questions: { id: string; question_text: string; order_index: number }[];
}

interface QuestionDraft {
  /** `null` numa pergunta nova — o id só existe depois de gravada. */
  id: string | null;
  text: string;
}

export function ExercicioEditor({ topicId, moduleId, exercise, questions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(exercise?.title ?? "");
  const [instructions, setInstructions] = useState(exercise?.instructions ?? "");
  const [drafts, setDrafts] = useState<QuestionDraft[]>(
    questions.length > 0
      ? questions.map((q) => ({ id: q.id, text: q.question_text }))
      : [{ id: null, text: "" }]
  );

  function updateDraft(index: number, text: string) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, text } : d)));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, { id: null, text: "" }]);
  }

  function removeDraft(index: number) {
    setDrafts((prev) => (prev.length === 1 ? [{ id: null, text: "" }] : prev.filter((_, i) => i !== index)));
  }

  function handleSave() {
    setError(null);

    const filled = drafts.filter((d) => d.text.trim().length > 0);
    if (filled.length === 0) {
      setError("Adicione ao menos uma pergunta.");
      return;
    }

    startTransition(async () => {
      const result = await saveExercise(topicId, moduleId, {
        title: title.trim(),
        instructions,
        questions: filled.map((d) => ({ id: d.id, text: d.text.trim() })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success("Exercício salvo.");
      router.refresh();
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <SectionTitle>Exercício</SectionTitle>
        {exercise && (
          <DeleteButton
            itemName="o exercício deste tópico"
            warning="As perguntas e todas as respostas já enviadas pelos mentorados são removidas."
            action={async () => {
              const result = await deleteExercise(exercise.id, topicId, moduleId);
              if (!result.ok) throw new Error(result.error);
              setTitle("");
              setInstructions("");
              setDrafts([{ id: null, text: "" }]);
              toast.success("Exercício excluído.");
              router.refresh();
            }}
          />
        )}
      </div>

      <p className="mb-4 text-xs text-muted-foreground max-w-2xl">
        Opcional. Um tópico sem exercício é concluído assim que o mentorado lê o repertório.
        Editar uma pergunta existente preserva as respostas já enviadas; removê-la apaga as
        respostas dela.
      </p>

      <div className="space-y-4 max-w-2xl">
        <FormError message={error} />

        <Field label="Título">
          <TextField
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Exercício"
            className="max-w-md"
          />
        </Field>

        <Field
          label="Instruções"
          hint="Texto simples. Linha em branco separa parágrafos; linhas começando com “- ” viram lista."
        >
          <TextAreaField
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
          />
        </Field>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-foreground">Perguntas</span>
          {drafts.map((draft, index) => (
            <div key={draft.id ?? `new-${index}`} className="flex items-start gap-2">
              <span className="mt-2 text-xs text-muted-foreground tabular-nums w-4 shrink-0">
                {index + 1}
              </span>
              <TextAreaField
                value={draft.text}
                onChange={(e) => updateDraft(index, e.target.value)}
                rows={2}
                placeholder="Escreva a pergunta"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-1 text-muted-foreground hover:text-destructive shrink-0"
                title="Remover pergunta"
                onClick={() => removeDraft(index)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="ghost" size="sm" onClick={addDraft}>
            <Plus className="w-3.5 h-3.5" />
            Adicionar pergunta
          </Button>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={isPending || title.trim().length === 0}
        >
          {isPending ? "Salvando…" : "Salvar exercício"}
        </Button>
      </div>
    </section>
  );
}
