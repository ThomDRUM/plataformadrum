"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUser, grantAdminByEmail } from "@/lib/actions/admin/users";
import { Field, TextField, FormError } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";

/**
 * Dois passos no mesmo formulário: primeiro só o e-mail — se a conta existe,
 * ela vira admin na hora. Se não existe, aparecem nome e senha provisória e o
 * segundo envio cria a conta já com o papel de admin.
 */
export function AdicionarAdminForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [needsAccount, setNeedsAccount] = useState(false);

  function handleEmailChange(next: string) {
    setEmail(next);
    // Os campos de conta nova valem para o e-mail que foi consultado.
    setNeedsAccount(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const trimmedEmail = email.trim();

    startTransition(async () => {
      if (!needsAccount) {
        const result = await grantAdminByEmail(trimmedEmail);
        if (!result.ok) {
          setError(result.error);
          return;
        }

        if (result.data.outcome === "needs_account") {
          setNeedsAccount(true);
          return;
        }

        toast.success(
          result.data.outcome === "already_admin"
            ? `${trimmedEmail} já é administrador.`
            : `${trimmedEmail} agora é administrador.`
        );
        setEmail("");
        router.refresh();
        return;
      }

      const result = await createUser({
        email: trimmedEmail,
        password: String(form.get("password") ?? ""),
        fullName: String(form.get("full_name") ?? "").trim(),
        role: "admin",
        studentType: null,
        trailId: null,
        projectId: null,
        mentorProjectIds: [],
        mentorIds: [],
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success(`Conta de administrador criada para ${trimmedEmail}.`);
      setEmail("");
      setNeedsAccount(false);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <div>
        <p className="text-sm font-medium text-foreground">Adicionar administrador</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Quem já tem conta passa a ter acesso ao admin. Se o e-mail ainda não tiver
          conta, você cria uma na sequência.
        </p>
      </div>

      <FormError message={error} />

      <Field label="E-mail">
        <TextField
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="pessoa@drumlearning.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
        />
      </Field>

      {needsAccount && (
        <div className="space-y-4 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Nenhuma conta usa este e-mail. Preencha para criá-la já como administrador.
          </p>

          <Field label="Nome completo">
            <TextField name="full_name" required minLength={2} autoComplete="off" />
          </Field>

          <Field label="Senha provisória" hint="Mínimo de 6 caracteres.">
            <TextField
              name="password"
              type="text"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </Field>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {needsAccount && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleEmailChange("")}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : needsAccount ? "Criar administrador" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}
