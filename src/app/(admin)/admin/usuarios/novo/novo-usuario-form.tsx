"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/actions/admin/users";
import { Field, TextField, SelectField, FormError } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

interface Props {
  trails: { id: string; title: string; trail_type: string }[];
  families: { id: string; name: string; projectId: string | null }[];
}

export function NovoUsuarioForm({ trails, families }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("student");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const familyId = String(form.get("family_id") ?? "");
    const projectId = families.find((f) => f.id === familyId)?.projectId ?? null;

    startTransition(async () => {
      const result = await createUser({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        fullName: String(form.get("full_name") ?? "").trim(),
        role: role as "student" | "mentor" | "admin",
        studentType: (String(form.get("student_type") ?? "") || null) as
          | "successor"
          | "succeeded"
          | null,
        trailId: String(form.get("trail_id") ?? "") || null,
        projectId,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/admin/usuarios/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <FormError message={error} />

      <Field label="Nome completo">
        <TextField name="full_name" required minLength={2} autoComplete="off" />
      </Field>

      <Field label="E-mail" hint="É com este e-mail que a pessoa vai entrar na plataforma.">
        <TextField name="email" type="email" required autoComplete="off" />
      </Field>

      <Field label="Senha provisória" hint="Mínimo de 6 caracteres.">
        <TextField name="password" type="text" required minLength={6} autoComplete="new-password" />
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
          <SelectField name="student_type" defaultValue="">
            <option value="">Não definido</option>
            <option value="successor">Sucessor</option>
            <option value="succeeded">Sucedido</option>
          </SelectField>
        </Field>
      )}

      {role !== "admin" && (
        <>
          <Field label="Formação" hint="Pode ser definida depois.">
            <SelectField name="trail_id" defaultValue="">
              <option value="">Nenhuma</option>
              {trails.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </SelectField>
          </Field>

          <Field
            label="Família"
            hint={
              role === "mentor"
                ? "Para mentores, o vínculo com as famílias é feito na tela do usuário depois de criado."
                : "Vincula o mentorado ao projeto da família."
            }
          >
            <SelectField name="family_id" defaultValue="" disabled={role === "mentor"}>
              <option value="">Nenhuma</option>
              {families.map((f) => (
                <option key={f.id} value={f.id} disabled={!f.projectId}>
                  {f.name}
                  {!f.projectId ? " (sem projeto)" : ""}
                </option>
              ))}
            </SelectField>
          </Field>
        </>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Criando…" : "Criar usuário"}
        </Button>
        <LinkButton href="/admin/usuarios" variant="ghost" size="lg">
          Cancelar
        </LinkButton>
      </div>
    </form>
  );
}
