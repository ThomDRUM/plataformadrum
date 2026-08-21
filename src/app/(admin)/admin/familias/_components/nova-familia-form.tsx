"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createFamily, type FamilyMemberInput } from "@/lib/actions/admin/families";
import { Field, TextField, FormError } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MembrosField, toMemberInput, type MembroRow } from "./membros-field";

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
  // A árvore só existe no formulário até a família ser criada, então os membros
  // ficam no estado com um id local — o do banco só vem depois do insert.
  const [members, setMembers] = useState<MembroRow[]>([]);
  const nextLocalId = useRef(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createFamily({
        name: String(form.get("name") ?? "").trim(),
        businessName: String(form.get("business_name") ?? "").trim(),
        projectName: String(form.get("project_name") ?? "").trim(),
        members: members.map(toMemberInput),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Família criada, árvore não: avisar é melhor do que sumir com o erro — os
      // membros se refazem na edição.
      if (result.data.memberError) {
        toast.error(`Família criada, mas os membros não: ${result.data.memberError}`);
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

      <Separator />

      <MembrosField
        members={members}
        onAdd={(member: FamilyMemberInput) =>
          setMembers((current) => [
            ...current,
            { ...member, id: `local-${nextLocalId.current++}` },
          ])
        }
        onRemove={(id) => setMembers((current) => current.filter((m) => m.id !== id))}
        hint="Opcional — a árvore também pode ser montada depois, pelo mentor. Parentesco e cônjuges são definidos lá."
        disabled={isPending}
      />

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Criando…" : "Criar família"}
        </Button>
        {cancel}
      </div>
    </form>
  );
}
