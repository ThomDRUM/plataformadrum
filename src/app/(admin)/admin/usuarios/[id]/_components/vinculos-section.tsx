"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import {
  setUserTrail,
  setUserProject,
  addMentorToProject,
  removeMentorFromProject,
} from "@/lib/actions/admin/users";
import { Field, SelectField } from "@/components/admin/form-fields";
import { SectionTitle } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/types";

interface Family {
  id: string;
  name: string;
  projects: { id: string; name: string }[];
}

interface Props {
  userId: string;
  role: string;
  trailId: string | null;
  projectId: string | null;
  trails: { id: string; title: string; trail_type: string }[];
  families: Family[];
  mentorProjectIds: string[];
}

export function VinculosSection({
  userId,
  role,
  trailId,
  projectId,
  trails,
  families,
  mentorProjectIds,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<ActionResult>, successMessage: string) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  const projectOptions = families.flatMap((f) =>
    f.projects.map((p) => ({ id: p.id, label: f.name }))
  );

  return (
    <section className="space-y-6">
      <div>
        <SectionTitle>Formação</SectionTitle>
        <div className="max-w-lg">
          <Field
            label="Formação atribuída"
            hint="Define quais módulos aparecem para esta pessoa."
          >
            <SelectField
              defaultValue={trailId ?? ""}
              disabled={isPending}
              onChange={(e) =>
                run(() => setUserTrail(userId, e.target.value || null), "Formação atualizada.")
              }
            >
              <option value="">Nenhuma</option>
              {trails.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
      </div>

      {role === "student" && (
        <div>
          <SectionTitle>Família</SectionTitle>
          <div className="max-w-lg">
            <Field
              label="Família do mentorado"
              hint="O vínculo é feito pelo projeto da família — é ele que liga mentorados e mentores."
            >
              <SelectField
                defaultValue={projectId ?? ""}
                disabled={isPending}
                onChange={(e) =>
                  run(() => setUserProject(userId, e.target.value || null), "Família atualizada.")
                }
              >
                <option value="">Nenhuma</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </SelectField>
            </Field>
            {projectOptions.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Nenhuma família tem projeto ainda. Crie uma família para poder vincular.
              </p>
            )}
          </div>
        </div>
      )}

      {role === "mentor" && (
        <div>
          <SectionTitle>Famílias atendidas</SectionTitle>
          <p className="mb-3 text-xs text-muted-foreground max-w-lg">
            Um mentor atende famílias inteiras. Ao vincular uma família, ele passa a
            acompanhar todos os mentorados ligados ao projeto dela.
          </p>

          {families.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma família cadastrada.</p>
          ) : (
            <ul className="max-w-lg divide-y divide-border border border-border rounded-lg">
              {families.flatMap((family) =>
                family.projects.map((project) => {
                  const linked = mentorProjectIds.includes(project.id);
                  return (
                    <li
                      key={project.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{family.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{project.name}</p>
                      </div>
                      {linked ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            run(
                              () => removeMentorFromProject(userId, project.id),
                              "Vínculo removido."
                            )
                          }
                        >
                          <X className="w-3.5 h-3.5" />
                          Remover
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() =>
                            run(() => addMentorToProject(userId, project.id), "Vínculo criado.")
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                          Vincular
                        </Button>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
