"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFamily } from "@/lib/actions/admin/families";
import { Field, TextField, FormError } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  /**
   * Chamado com o id da família recém-criada. Sem isso, o formulário navega
   * para a tela dela — o que a rota `/nova` quer; o sheet, aberto de dentro da
   * lista, prefere fechar e ficar na lista.
   */
  onCreated?: (familyId: string) => void;
  /** Botão de cancelar: um link de volta na rota, um `SheetClose` no sheet. */
  cancel?: React.ReactNode;
  className?: string;
}

export function NovaFamiliaForm({ onCreated, cancel, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createFamily({
        name: String(form.get("name") ?? "").trim(),
        businessName: String(form.get("business_name") ?? "").trim(),
        projectName: String(form.get("project_name") ?? "").trim(),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();

      if (onCreated) {
        onCreated(result.data.id);
        return;
      }

      router.push(`/admin/familias/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      <FormError message={error} />

      <Field label="Nome da família">
        <TextField
          name="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="Nome do negócio" hint="Opcional.">
        <TextField name="business_name" />
      </Field>

      <Field
        label="Nome do projeto"
        hint="O projeto é o que liga mentorados e mentores a esta família."
      >
        <TextField
          name="project_name"
          required
          minLength={2}
          placeholder={name ? `Sucessão ${name}` : "Sucessão"}
        />
      </Field>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Criando…" : "Criar família"}
        </Button>
        {cancel}
      </div>
    </form>
  );
}
