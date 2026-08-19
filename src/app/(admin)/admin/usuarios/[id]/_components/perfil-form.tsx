"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUserProfile, resetUserPassword } from "@/lib/actions/admin/users";
import { Field, TextField, TextAreaField, SelectField, FormError } from "@/components/admin/form-fields";
import { SectionTitle } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  email: string | null;
  fullName: string;
  role: string;
  studentType: string | null;
  yearlyIntention: string | null;
}

export function PerfilForm({
  userId,
  email,
  fullName,
  role: initialRole,
  studentType,
  yearlyIntention,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState(initialRole);

  const [password, setPassword] = useState("");
  const [isResetting, startReset] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateUserProfile(userId, {
        fullName: String(form.get("full_name") ?? "").trim(),
        role: role as "student" | "mentor" | "admin",
        studentType: (String(form.get("student_type") ?? "") || null) as
          | "successor"
          | "succeeded"
          | null,
        yearlyIntention: String(form.get("yearly_intention") ?? ""),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Perfil atualizado.");
      router.refresh();
    });
  }

  function handleResetPassword() {
    startReset(async () => {
      const result = await resetUserPassword(userId, password);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPassword("");
      toast.success("Senha alterada.");
    });
  }

  return (
    <section>
      <SectionTitle>Perfil</SectionTitle>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <FormError message={error} />

        {email && (
          <Field label="E-mail" hint="O e-mail de acesso não pode ser alterado por aqui.">
            <TextField defaultValue={email} disabled />
          </Field>
        )}

        <Field label="Nome completo">
          <TextField name="full_name" defaultValue={fullName} required minLength={2} />
        </Field>

        <Field label="Papel">
          <SelectField name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Mentorado</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </SelectField>
        </Field>

        {role === "student" && (
          <>
            <Field label="Tipo de mentorado">
              <SelectField name="student_type" defaultValue={studentType ?? ""}>
                <option value="">Não definido</option>
                <option value="successor">Sucessor</option>
                <option value="succeeded">Sucedido</option>
              </SelectField>
            </Field>

            <Field label="Intenção do ano">
              <TextAreaField name="yearly_intention" defaultValue={yearlyIntention ?? ""} rows={3} />
            </Field>
          </>
        )}

        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar perfil"}
        </Button>
      </form>

      <div className="mt-8 max-w-lg">
        <Field label="Definir nova senha" hint="Mínimo de 6 caracteres.">
          <div className="flex items-center gap-2">
            <TextField
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleResetPassword}
              disabled={isResetting || password.length < 6}
            >
              {isResetting ? "Alterando…" : "Alterar"}
            </Button>
          </div>
        </Field>
      </div>
    </section>
  );
}
