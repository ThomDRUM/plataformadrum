"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateUserBasics } from "@/lib/actions/admin/users";
import type { AdminUserRow } from "@/lib/admin/queries";
import { Field, TextField, SelectField, FormError } from "@/components/admin/form-fields";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  user: AdminUserRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edição rápida a partir da lista. Só o que dá para decidir olhando a linha —
 * formação, família e módulos continuam na tela do usuário, onde têm contexto.
 */
export function EditarUsuarioSheet({ user, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState(user.role);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateUserBasics(user.id, {
        fullName: String(form.get("full_name") ?? "").trim(),
        role: role as "student" | "mentor" | "admin",
        studentType: (String(form.get("student_type") ?? "") || null) as
          | "successor"
          | "succeeded"
          | null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success("Usuário atualizado.");
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
        overlayClassName={ADMIN_OVERLAY}
      >
        <SheetHeader>
          <SheetTitle>Editar usuário</SheetTitle>
          <SheetDescription>
            Ajuste rápido de nome e papel. Formação, família e módulos ficam na
            tela do usuário.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 p-4">
          <FormError message={error} />

          <Field label="Nome completo">
            <TextField
              name="full_name"
              defaultValue={user.fullName}
              required
              minLength={2}
              autoComplete="off"
            />
          </Field>

          <Field label="Papel">
            <SelectField name="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Mentorado</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </SelectField>
          </Field>

          {role === "student" && (
            <Field label="Tipo de mentorado">
              <SelectField name="student_type" defaultValue={user.studentType ?? ""}>
                <option value="">Não definido</option>
                <option value="successor">Sucessor</option>
                <option value="succeeded">Sucedido</option>
              </SelectField>
            </Field>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
            <SheetClose render={<Button variant="ghost" size="lg" />}>Cancelar</SheetClose>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
