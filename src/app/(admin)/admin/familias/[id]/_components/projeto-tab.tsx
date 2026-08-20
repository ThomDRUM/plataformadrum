"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProject, createProject } from "@/lib/actions/admin/families";
import { Field, TextField, SelectField, FormError } from "@/components/admin/form-fields";
import { ProjectStatusBadge } from "@/components/admin/status-badge";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  duration_months: number | null;
}

interface Props {
  familyId: string;
  projects: Project[];
}

export function ProjetoTab({ familyId, projects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  function handleSubmit(project: Project, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const duration = String(form.get("duration_months") ?? "").trim();

    startTransition(async () => {
      const result = await updateProject(project.id, familyId, {
        name: String(form.get("name") ?? "").trim(),
        status: String(form.get("status") ?? "active") as "active" | "paused" | "completed",
        startDate: String(form.get("start_date") ?? "") || null,
        endDate: String(form.get("end_date") ?? "") || null,
        durationMonths: duration ? Number(duration) : null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Projeto atualizado.");
      router.refresh();
    });
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createProject(familyId, newName);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNewName("");
      toast.success("Projeto criado.");
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <FormError message={error} />

      {projects.length === 0 && (
        <Frame spacing="sm" className="[--frame-border-color:color-mix(in_oklch,var(--color-destructive)_35%,transparent)]">
          <FrameHeader>
            <FrameTitle>Esta família não tem projeto</FrameTitle>
            <FrameDescription>
              Sem um projeto, não é possível vincular mentorados nem mentores a ela.
            </FrameDescription>
          </FrameHeader>
          <FrameFooter>
            <div className="flex items-center gap-2">
              <TextField
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do projeto"
                className="h-9"
              />
              <Button
                type="button"
                size="lg"
                className="shrink-0"
                disabled={isPending || newName.trim().length < 2}
                onClick={handleCreate}
              >
                Criar projeto
              </Button>
            </div>
          </FrameFooter>
        </Frame>
      )}

      {projects.map((project) => (
        <form key={project.id} onSubmit={(e) => handleSubmit(project, e)}>
          <Frame spacing="sm">
            <FrameHeader>
              <FrameTitle className="flex items-center gap-2">
                {project.name}
                <ProjectStatusBadge status={project.status} />
              </FrameTitle>
              <FrameDescription>
                É por este projeto que mentorados e mentores se ligam à família.
              </FrameDescription>
            </FrameHeader>

            <FramePanel>
              <div className="space-y-4">
                <Field label="Nome do projeto">
                  <TextField name="name" defaultValue={project.name} required minLength={2} />
                </Field>

                <Field label="Status">
                  <SelectField name="status" defaultValue={project.status}>
                    <option value="active">Ativo</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Concluído</option>
                  </SelectField>
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Início">
                    <TextField
                      name="start_date"
                      type="date"
                      defaultValue={project.start_date ?? ""}
                    />
                  </Field>
                  <Field label="Término">
                    <TextField
                      name="end_date"
                      type="date"
                      defaultValue={project.end_date ?? ""}
                    />
                  </Field>
                  <Field label="Duração (meses)">
                    <TextField
                      name="duration_months"
                      type="number"
                      min={1}
                      defaultValue={project.duration_months ?? ""}
                    />
                  </Field>
                </div>
              </div>
            </FramePanel>

            <FrameFooter>
              <Button type="submit" size="lg" className="w-fit" disabled={isPending}>
                {isPending ? "Salvando…" : "Salvar projeto"}
              </Button>
            </FrameFooter>
          </Frame>
        </form>
      ))}
    </div>
  );
}
