"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { saveExercise, deleteExercise } from "@/lib/actions/admin/topic-content";
import { isRichContentEmpty } from "@/lib/rich-content";
import { Field, TextField, FormError } from "@/components/admin/form-fields";
import { RichEditor } from "@/components/admin/rich-editor/rich-editor";
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
  /**
   * Chave de render estável: cada pergunta tem a própria instância do editor,
   * e uma chave por índice faria a instância de uma pergunta removida ser
   * reaproveitada pela seguinte.
   */
  key: string;
  text: string;
}

function newDraft(): QuestionDraft {
  return { id: null, key: crypto.randomUUID(), text: "" };
}

export function ExercicioEditor({ topicId, moduleId, exercise, questions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(exercise?.title ?? "");
  const [instructions, setInstructions] = useState(exercise?.instructions ?? "");
  const [drafts, setDrafts] = useState<QuestionDraft[]>(
    questions.length > 0
      ? questions.map((q) => ({ id: q.id, key: q.id, text: q.question_text }))
      : [newDraft()]
  );
  // O editor não é controlado: só lê `content` ao montar. Trocar a chave é o
  // que o faz remontar vazio depois de excluir o exercício.
  const [resetKey, setResetKey] = useState(0);

  function updateDraft(index: number, text: string) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, text } : d)));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, newDraft()]);
  }

  function removeDraft(index: number) {
    setDrafts((prev) => (prev.length === 1 ? [newDraft()] : prev.filter((_, i) => i !== index)));
  }

  function handleSave() {
    setError(null);

    const filled = drafts.filter((d) => !isRichContentEmpty(d.text));
    if (filled.length === 0) {
      setError("Adicione ao menos uma pergunta.");
      return;
    }

    startTransition(async () => {
      const result = await saveExercise(topicId, moduleId, {
        title: title.trim(),
        instructions,
        questions: filled.map((d) => ({ id: d.id, text: d.text })),
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
              setDrafts([newDraft()]);
              setResetKey((k) => k + 1);
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

      <div className="space-y-4 max-w-3xl">
        <FormError message={error} />

        <Field label="Título">
          <TextField
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Exercício"
            className="max-w-md"
          />
        </Field>

        {/* Sem `Field`: ele é um <label>, e um clique na barra do editor dentro
            de um label é repassado ao primeiro botão dela. */}
        <div>
          <span className="mb-1.5 block text-xs font-medium text-foreground">Instruções</span>
          <RichEditor
            key={resetKey}
            variant="compact"
            content={instructions}
            onChange={setInstructions}
            placeholder="Oriente o mentorado sobre como responder (opcional)"
            contentClassName="text-muted-foreground"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Negrito, itálico, listas, citação e link. O que você vê aqui é como o mentorado vai
            ler.
          </p>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-foreground">Perguntas</span>
          {drafts.map((draft, index) => (
            <div key={draft.key} className="flex items-start gap-2">
              <span className="mt-2 text-xs text-muted-foreground tabular-nums w-4 shrink-0">
                {index + 1}
              </span>
              <RichEditor
                variant="compact"
                content={draft.text}
                onChange={(html) => updateDraft(index, html)}
                placeholder="Escreva a pergunta"
                contentClassName="font-medium"
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
