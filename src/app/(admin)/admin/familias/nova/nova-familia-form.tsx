"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFamily } from "@/lib/actions/admin/families";
import { Field, TextField, FormError } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

export function NovaFamiliaForm() {
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

      router.push(`/admin/familias/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
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
        <LinkButton href="/admin/familias" variant="ghost" size="lg">
          Cancelar
        </LinkButton>
      </div>
    </form>
  );
}
