"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createModule, updateModule, type ModuleInput } from "@/lib/actions/admin/content";
import {
  Field,
  TextField,
  TextAreaField,
  FormError,
} from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  /** Presente = edição; ausente = criação. */
  moduleId?: string;
  initial?: {
    title: string;
    internalName: string;
    intention: string | null;
    why: string | null;
  };
  /**
   * Chamado depois de salvar, com o id do módulo. Sem isso, a criação navega
   * para a tela do módulo — o que a página de detalhe quer; os sheets, abertos
   * de dentro da lista, preferem fechar e ficar na lista.
   */
  onSaved?: (moduleId: string) => void;
  /** Botão de cancelar: um `SheetClose` nos sheets, nada na página de detalhe. */
  cancel?: React.ReactNode;
  className?: string;
}

export function ModuloForm({ moduleId, initial, onSaved, cancel, className }: Props) {
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
        router.refresh();
        onSaved?.(moduleId);
        return;
      }

      const result = await createModule(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Módulo criado.");
      router.refresh();

      if (onSaved) {
        onSaved(result.data.id);
        return;
      }

      router.push(`/admin/modulos/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      <FormError message={error} />

      <Field label="Título" hint="É o que o mentorado vê.">
        <TextField
          name="title"
          defaultValue={initial?.title ?? ""}
          required
          minLength={2}
          autoComplete="off"
        />
      </Field>

      <Field
        label="Nome interno"
        hint="Só para a equipe se organizar. Se ficar vazio, repete o título."
      >
        <TextField name="internal_name" defaultValue={initial?.internalName ?? ""} />
      </Field>

      <Field label="Intenção">
        <TextAreaField name="intention" defaultValue={initial?.intention ?? ""} rows={3} />
      </Field>

      <Field label="Por quê">
        <TextAreaField name="why" defaultValue={initial?.why ?? ""} rows={3} />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Salvando…" : moduleId ? "Salvar módulo" : "Criar módulo"}
        </Button>
        {cancel}
      </div>
    </form>
  );
}
