"use client";

import { useState, useTransition } from "react";
import { createMentorado } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Trail { id: string; name: string }

export function NovoMentoradoForm({ trails }: { trails: Trail[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createMentorado(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Nome completo</Label>
        <Input name="full_name" required placeholder="Ana Rodrigues" />
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input name="email" type="email" required placeholder="ana@empresa.com" />
      </div>

      <div className="space-y-1.5">
        <Label>Senha inicial</Label>
        <Input name="password" type="password" required placeholder="Senha temporária" minLength={6} />
        <p className="text-xs text-muted-foreground">O mentorado usará esta senha no primeiro acesso.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Trilha</Label>
        <select
          name="trail_id"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
        >
          <option value="">Sem trilha</option>
          {trails.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Intenção anual</Label>
        <Textarea
          name="yearly_intention"
          placeholder="O que este mentorado quer alcançar este ano..."
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Criando..." : "Criar mentorado"}
        </Button>
        <LinkButton href="/admin" variant="outline">Cancelar</LinkButton>
      </div>
    </form>
  );
}
