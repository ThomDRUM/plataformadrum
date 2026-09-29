"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createTrail, updateTrail, type TrailInput } from "@/lib/actions/admin/content";
import {
  Field,
  TextField,
  TextAreaField,
  SelectField,
  FormError,
} from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  /** Presente = edição; ausente = criação. */
  trailId?: string;
  initial?: {
    title: string;
    trailType: string;
    intention: string | null;
    why: string | null;
  };
  /**
   * Chamado depois de salvar, com o id da formação. Sem isso, a criação navega
   * para a tela da formação — o que a página de detalhe quer; os sheets,
   * abertos de dentro da lista, preferem fechar e ficar na lista.
   */
  onSaved?: (trailId: string) => void;
  /** Botão de cancelar: um `SheetClose` nos sheets, nada na página de detalhe. */
  cancel?: React.ReactNode;
  className?: string;
}

export function FormacaoForm({ trailId, initial, onSaved, cancel, className }: Props) {
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
        router.refresh();
        onSaved?.(trailId);
        return;
      }

      const result = await createTrail(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Formação criada.");
      router.refresh();

      if (onSaved) {
        onSaved(result.data.id);
        return;
      }

      router.push(`/admin/formacoes/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      <FormError message={error} />

      <Field label="Título">
        <TextField
          name="title"
          defaultValue={initial?.title ?? ""}
          required
          minLength={2}
          autoComplete="off"
        />
      </Field>

      <Field label="Para quem" hint="Define qual público esta formação atende.">
        <SelectField name="trail_type" defaultValue={initial?.trailType ?? "successor"}>
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

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Salvando…" : trailId ? "Salvar formação" : "Criar formação"}
        </Button>
        {cancel}
      </div>
    </form>
  );
}
