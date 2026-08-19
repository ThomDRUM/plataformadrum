"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createModule, updateModule, type ModuleInput } from "@/lib/actions/admin/content";
import { Field, TextField, TextAreaField, FormError } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

interface Props {
  moduleId?: string;
  initial?: {
    title: string;
    internal_name: string;
    intention: string | null;
    why: string | null;
  };
}

export function ModuloForm({ moduleId, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const input: ModuleInput = {
      title: String(form.get("title") ?? "").trim(),
      internalName: String(form.get("internal_name") ?? "").trim(),
      intention: String(form.get("intention") ?? ""),
      why: String(form.get("why") ?? ""),
    };

    // Ramos separados: unir os dois retornos numa variável só apagaria o `data`
    // do create, que é o id para onde navegamos.
    startTransition(async () => {
      if (moduleId) {
        const result = await updateModule(moduleId, input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Módulo atualizado.");
      } else {
        const result = await createModule(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Módulo criado.");
        router.push(`/admin/modulos/${result.data.id}`);
      }

      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <FormError message={error} />

      <Field label="Título" hint="É o que o mentorado vê.">
        <TextField name="title" defaultValue={initial?.title ?? ""} required minLength={2} />
      </Field>

      <Field
        label="Nome interno"
        hint="Só para a equipe se organizar. Se ficar vazio, repete o título."
      >
        <TextField name="internal_name" defaultValue={initial?.internal_name ?? ""} />
      </Field>

      <Field label="Intenção">
        <TextAreaField name="intention" defaultValue={initial?.intention ?? ""} rows={3} />
      </Field>

      <Field label="Por quê">
        <TextAreaField name="why" defaultValue={initial?.why ?? ""} rows={3} />
      </Field>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Salvando…" : moduleId ? "Salvar módulo" : "Criar módulo"}
      </Button>
    </form>
  );
}
