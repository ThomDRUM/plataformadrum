"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Plus, ChevronRight, BookOpen, PenLine } from "lucide-react";
import { createTopic, deleteTopic, swapTopicOrder } from "@/lib/actions/admin/content";
import { SectionTitle } from "@/components/admin/page-header";
import { TextField } from "@/components/admin/form-fields";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/types";

interface Topic {
  id: string;
  title: string;
  learningObjective: string | null;
  orderIndex: number;
  hasRepertoire: boolean;
  hasExercise: boolean;
}

interface Props {
  moduleId: string;
  topics: Topic[];
}

export function TopicosSection({ moduleId, topics }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");

  function run(fn: () => Promise<ActionResult>, successMessage: string) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createTopic(moduleId, {
        title: newTitle.trim(),
        learningObjective: null,
        why: null,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setNewTitle("");
      toast.success("Tópico criado.");
      router.push(`/admin/modulos/${moduleId}/topico/${result.data.id}`);
    });
  }

  return (
    <section>
      <SectionTitle>Tópicos</SectionTitle>
      <p className="mb-4 text-xs text-muted-foreground max-w-2xl">
        O mentorado percorre os tópicos nesta ordem. Cada um tem um repertório para ler e,
        opcionalmente, um exercício para responder.
      </p>

      {topics.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">Nenhum tópico neste módulo ainda.</p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg mb-4">
          {topics.map((topic, index) => (
            <li key={topic.id} className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/modulos/${moduleId}/topico/${topic.id}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {topic.title}
                </Link>
                <div className="flex items-center gap-3 mt-0.5">
                  <span
                    className={
                      topic.hasRepertoire
                        ? "inline-flex items-center gap-1 text-xs text-muted-foreground"
                        : "inline-flex items-center gap-1 text-xs text-destructive/70"
                    }
                  >
                    <BookOpen className="w-3 h-3" />
                    {topic.hasRepertoire ? "Repertório" : "Sem repertório"}
                  </span>
                  {topic.hasExercise && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <PenLine className="w-3 h-3" />
                      Exercício
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                title="Subir"
                disabled={isPending || index === 0}
                onClick={() =>
                  run(
                    () =>
                      swapTopicOrder(
                        moduleId,
                        { id: topic.id, orderIndex: topic.orderIndex },
                        { id: topics[index - 1].id, orderIndex: topics[index - 1].orderIndex }
                      ),
                    "Ordem atualizada."
                  )
                }
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                title="Descer"
                disabled={isPending || index === topics.length - 1}
                onClick={() =>
                  run(
                    () =>
                      swapTopicOrder(
                        moduleId,
                        { id: topic.id, orderIndex: topic.orderIndex },
                        { id: topics[index + 1].id, orderIndex: topics[index + 1].orderIndex }
                      ),
                    "Ordem atualizada."
                  )
                }
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>

              <DeleteButton
                itemName={topic.title}
                warning="O repertório, o exercício e as respostas já dadas pelos mentorados neste tópico são removidos."
                action={async () => {
                  const result = await deleteTopic(topic.id, moduleId);
                  if (!result.ok) throw new Error(result.error);
                  toast.success("Tópico excluído.");
                  router.refresh();
                }}
              />

              <Link
                href={`/admin/modulos/${moduleId}/topico/${topic.id}`}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label={`Abrir ${topic.title}`}
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <TextField
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título do novo tópico"
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTitle.trim().length >= 2) {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending || newTitle.trim().length < 2}
          onClick={handleCreate}
        >
          <Plus className="w-3.5 h-3.5" />
          Criar tópico
        </Button>
      </div>
    </section>
  );
}
