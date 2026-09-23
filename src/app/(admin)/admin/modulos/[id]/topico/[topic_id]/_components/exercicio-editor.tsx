"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { saveExercise, deleteExercise } from "@/lib/actions/admin/topic-content";
import { Field, TextField, TextAreaField, FormError } from "@/components/admin/form-fields";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { SaveBar } from "./save-bar";

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
  const [dirty, setDirty] = useState(false);

  const [title, setTitle] = useState(exercise?.title ?? "");
  const [instructions, setInstructions] = useState(exercise?.instructions ?? "");
  const [drafts, setDrafts] = useState<QuestionDraft[]>(
    questions.length > 0
      ? questions.map((q) => ({ id: q.id, text: q.question_text }))
      : [{ id: null, text: "" }]
  );

  function updateDraft(index: number, text: string) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, text } : d)));
    setDirty(true);
  }

  function addDraft() {
    setDrafts((prev) => [...prev, { id: null, text: "" }]);
  }

  function removeDraft(index: number) {
    setDrafts((prev) => (prev.length === 1 ? [{ id: null, text: "" }] : prev.filter((_, i) => i !== index)));
    setDirty(true);
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

      setDirty(false);
      toast.success("Exercício salvo.");
      router.refresh();
    });
  }

  return (
    <Frame spacing="sm">
      <FrameHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <FrameTitle>Exercício</FrameTitle>
          <FrameDescription>
            Opcional. Um tópico sem exercício é concluído assim que o mentorado lê o repertório.
          </FrameDescription>
        </div>
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
              setDirty(false);
              toast.success("Exercício excluído.");
              router.refresh();
            }}
          />
        )}
      </FrameHeader>

      <FramePanel>
        <div className="space-y-4">
          <FormError message={error} />

          <Field label="Título">
            <TextField
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              placeholder="Exercício"
            />
          </Field>

          <Field
            label="Instruções"
            hint="Texto simples. Linha em branco separa parágrafos; linhas começando com “- ” viram lista."
          >
            <TextAreaField
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                setDirty(true);
              }}
              rows={4}
            />
          </Field>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-foreground">Perguntas</span>

            <ol className="divide-y divide-border rounded-lg border border-border">
              {drafts.map((draft, index) => (
                <li key={draft.id ?? `new-${index}`} className="flex items-start gap-2 px-3 py-2.5">
                  <span className="mt-2 w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <TextAreaField
                    value={draft.text}
                    onChange={(e) => updateDraft(index, e.target.value)}
                    rows={2}
                    placeholder="Escreva a pergunta"
                    className="min-h-14"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
                    title="Remover pergunta"
                    onClick={() => removeDraft(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ol>

            <span className="block text-xs text-muted-foreground">
              Editar uma pergunta existente preserva as respostas já enviadas; removê-la apaga
              as respostas dela.
            </span>

            <Button type="button" variant="outline" size="sm" onClick={addDraft}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar pergunta
            </Button>
          </div>
        </div>
      </FramePanel>

      <FrameFooter>
        <SaveBar
          label={exercise ? "Salvar exercício" : "Criar exercício"}
          isPending={isPending}
          dirty={dirty}
          disabled={title.trim().length === 0}
          onSave={handleSave}
        />
      </FrameFooter>
    </Frame>
  );
}
