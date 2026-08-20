"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateFamilyContent, updateProject } from "@/lib/actions/admin/families";
import type { FamilyOverview } from "@/lib/admin/queries";
import {
  Field,
  TextField,
  TextAreaField,
  SelectField,
  FormError,
} from "@/components/admin/form-fields";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Props {
  familyName: string;
  /** `undefined` enquanto carrega, `null` quando a leitura falhou. */
  overview: FamilyOverview | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Edição da família a partir da lista: dados próprios e o projeto.
 *
 * Os vínculos de mentorado e mentor ficam fora — dependem da lista de perfis
 * disponíveis e continuam na tela da família.
 */
export function EditarFamiliaSheet({ familyName, overview, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const project = overview?.projects[0] ?? null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!overview) return;
    setError(null);

    const form = new FormData(e.currentTarget);
    const duration = String(form.get("duration_months") ?? "").trim();

    startTransition(async () => {
      const familyResult = await updateFamilyContent(overview.family.id, {
        name: String(form.get("name") ?? "").trim(),
        businessName: String(form.get("business_name") ?? "").trim(),
        history: String(form.get("history") ?? ""),
        mission: String(form.get("mission") ?? ""),
        vision: String(form.get("vision") ?? ""),
        values: String(form.get("values") ?? ""),
      });

      if (!familyResult.ok) {
        setError(familyResult.error);
        return;
      }

      // O projeto é uma tabela separada, então é um segundo update. Se ele
      // falhar, os dados da família já entraram — o erro diz exatamente isso
      // em vez de sugerir que nada foi salvo.
      if (project) {
        const projectResult = await updateProject(project.id, overview.family.id, {
          name: String(form.get("project_name") ?? "").trim(),
          status: String(form.get("status") ?? "active") as
            | "active"
            | "paused"
            | "completed",
          startDate: String(form.get("start_date") ?? "") || null,
          endDate: String(form.get("end_date") ?? "") || null,
          durationMonths: duration ? Number(duration) : null,
        });

        if (!projectResult.ok) {
          setError(`Dados da família salvos, mas o projeto não: ${projectResult.error}`);
          router.refresh();
          return;
        }
      }

      toast.success("Família atualizada.");
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full gap-0 overflow-y-auto sm:max-w-lg"
        overlayClassName={ADMIN_OVERLAY}
      >
        <SheetHeader>
          <SheetTitle>Editar {familyName}</SheetTitle>
          <SheetDescription>
            Dados da família e do projeto. Vincular mentorados e mentores continua na
            tela da família.
          </SheetDescription>
        </SheetHeader>

        {overview === undefined ? (
          <p className="p-4 text-sm text-muted-foreground">Carregando…</p>
        ) : overview === null ? (
          <p className="p-4 text-sm text-muted-foreground">
            Não foi possível carregar os dados desta família.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-4">
            <FormError message={error} />

            <Field label="Nome da família">
              <TextField
                name="name"
                defaultValue={overview.family.name}
                required
                minLength={2}
                autoComplete="off"
              />
            </Field>

            <Field label="Nome do negócio" hint="Opcional.">
              <TextField
                name="business_name"
                defaultValue={overview.family.businessName}
              />
            </Field>

            <Separator />

            {project ? (
              <>
                <Field label="Nome do projeto">
                  <TextField
                    name="project_name"
                    defaultValue={project.name}
                    required
                    minLength={2}
                  />
                </Field>

                <Field label="Status do projeto">
                  <SelectField name="status" defaultValue={project.status}>
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Concluído</option>
                  </SelectField>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Início">
                    <TextField
                      name="start_date"
                      type="date"
                      defaultValue={project.startDate ?? ""}
                    />
                  </Field>
                  <Field label="Término">
                    <TextField
                      name="end_date"
                      type="date"
                      defaultValue={project.endDate ?? ""}
                    />
                  </Field>
                </div>

                <Field label="Duração (meses)">
                  <TextField
                    name="duration_months"
                    type="number"
                    min={1}
                    defaultValue={project.durationMonths ?? ""}
                  />
                </Field>
              </>
            ) : (
              // Sem projeto a família não recebe ninguém, e criar um é feito na
              // tela da família — aqui só o aviso.
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                Esta família não tem projeto. Sem um projeto, não é possível vincular
                mentorados nem mentores. Crie um na tela da família.
              </p>
            )}

            <Separator />

            <Field label="História">
              <TextAreaField name="history" rows={4} defaultValue={overview.family.history} />
            </Field>

            <Field label="Missão">
              <TextAreaField name="mission" rows={3} defaultValue={overview.family.mission} />
            </Field>

            <Field label="Visão">
              <TextAreaField name="vision" rows={3} defaultValue={overview.family.vision} />
            </Field>

            <Field label="Valores">
              <TextAreaField name="values" rows={3} defaultValue={overview.family.values} />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? "Salvando…" : "Salvar"}
              </Button>
              <SheetClose render={<Button variant="ghost" size="lg" />}>Cancelar</SheetClose>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
