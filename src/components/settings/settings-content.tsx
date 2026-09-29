"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { updateOwnProfile, updateOwnPassword } from "@/lib/actions/settings";

interface Props {
  fullName: string;
  email: string | null;
}

export function SettingsContent({ fullName, email }: Props) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Configurações
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gerencie seus dados pessoais e sua segurança.
      </p>

      <Tabs defaultValue="perfil" className="mt-8 max-w-2xl">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="pt-6">
          <PerfilSection fullName={fullName} email={email} />
        </TabsContent>

        <TabsContent value="seguranca" className="pt-6">
          <SegurancaSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PerfilSection({ fullName, email }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newFullName = String(form.get("full_name") ?? "").trim();

    startTransition(async () => {
      const result = await updateOwnProfile(newFullName);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Perfil atualizado.");
      setIsDirty(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Seus dados pessoais na plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          onChange={(e) =>
            setIsDirty(
              String(new FormData(e.currentTarget).get("full_name") ?? "").trim() !== fullName
            )
          }
          className="space-y-4"
        >
          {email && (
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <FieldContent>
                <Input id="email" defaultValue={email} disabled />
                <FieldDescription>
                  O e-mail de acesso não pode ser alterado por aqui.
                </FieldDescription>
              </FieldContent>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="full_name">Nome completo</FieldLabel>
            <Input id="full_name" name="full_name" defaultValue={fullName} required minLength={2} />
          </Field>

          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? "Salvando…" : "Salvar perfil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SegurancaSection() {
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = password.length >= 6 && password === confirmPassword;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      const result = await updateOwnPassword(password);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Senha alterada.");
      setPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>Altere a senha usada para entrar na plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="new_password">Nova senha</FieldLabel>
            <Input
              id="new_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm_password">Confirmar nova senha</FieldLabel>
            <FieldContent>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={mismatch}
              />
              {mismatch && <FieldDescription>As senhas não coincidem.</FieldDescription>}
            </FieldContent>
          </Field>

          <Button type="submit" disabled={isPending || !canSubmit}>
            {isPending ? "Alterando…" : "Alterar senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
