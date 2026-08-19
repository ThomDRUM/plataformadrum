"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTrail, updateTrail, type TrailInput } from "@/lib/actions/admin/content";
import { Field, TextField, TextAreaField, SelectField, FormError } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

interface Props {
  trailId?: string;
  initial?: {
    title: string;
    trail_type: string;
    intention: string | null;
    why: string | null;
  };
  onDone?: () => void;
}

export function FormacaoForm({ trailId, initial, onDone }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const input: TrailInput = {
      title: String(form.get("title") ?? "").trim(),
      trailType: String(form.get("trail_type") ?? "successor") as TrailInput["trailType"],
      intention: String(form.get("intention") ?? ""),
      why: String(form.get("why") ?? ""),
    };

    // Criar e editar em ramos separados: unir os dois retornos numa variável
    // só apagaria o `data` do create, que é o id para onde navegamos.
    startTransition(async () => {
      if (trailId) {
        const result = await updateTrail(trailId, input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Formação atualizada.");
      } else {
        const result = await createTrail(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        toast.success("Formação criada.");
        router.push(`/admin/formacoes/${result.data.id}`);
      }

      router.refresh();
      onDone?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <FormError message={error} />

      <Field label="Título">
        <TextField name="title" defaultValue={initial?.title ?? ""} required minLength={2} />
      </Field>

      <Field label="Para quem" hint="Define qual público esta formação atende.">
        <SelectField name="trail_type" defaultValue={initial?.trail_type ?? "successor"}>
          <option value="successor">Sucessor</option>
          <option value="succeeded">Sucedido</option>
          <option value="mentor">Mentor</option>
        </SelectField>
      </Field>

      <Field label="Intenção">
        <TextAreaField name="intention" defaultValue={initial?.intention ?? ""} rows={3} />
      </Field>

      <Field label="Por quê">
        <TextAreaField name="why" defaultValue={initial?.why ?? ""} rows={3} />
      </Field>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Salvando…" : trailId ? "Salvar formação" : "Criar formação"}
      </Button>
    </form>
  );
}
