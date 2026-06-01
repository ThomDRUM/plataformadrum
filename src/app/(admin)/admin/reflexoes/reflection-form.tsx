"use client";

import { useState, useTransition } from "react";
import { createReflection } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface Competency {
  id: string;
  title: string;
  modules: { title: string } | null;
}

export function ReflectionForm({ competencies }: { competencies: Competency[] }) {
  const [questions, setQuestions] = useState<string[]>([""]);
  const [isPending, startTransition] = useTransition();

  function addQuestion() {
    setQuestions((prev) => [...prev, ""]);
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateQuestion(i: number, val: string) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? val : q)));
  }

  function handleSubmit(formData: FormData) {
    formData.set("questions", JSON.stringify(questions));
    startTransition(() => createReflection(formData));
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Competência</Label>
        <select name="competency_id" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value="">Selecionar</option>
          {competencies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} — {c.modules?.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input name="title" required placeholder="Reflexão sobre dilema" />
      </div>

      <div className="space-y-1.5">
        <Label>Contexto (opcional)</Label>
        <Textarea name="context" rows={2} placeholder="Contexto introdutório para o mentorado..." />
      </div>

      <div className="space-y-2">
        <Label>Perguntas</Label>
        {questions.map((q, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => updateQuestion(i, e.target.value)}
              placeholder={`Pergunta ${i + 1}`}
              className="flex-1"
            />
            {questions.length > 1 && (
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeQuestion(i)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Adicionar pergunta
        </Button>
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Criando..." : "Criar reflexão"}
      </Button>
    </form>
  );
}
