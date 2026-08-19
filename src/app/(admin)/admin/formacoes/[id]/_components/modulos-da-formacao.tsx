"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, X, Plus, ExternalLink } from "lucide-react";
import {
  addModuleToTrail,
  removeModuleFromTrail,
  swapTrailModuleOrder,
} from "@/lib/actions/admin/content";
import { SectionTitle } from "@/components/admin/page-header";
import { SelectField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/admin/types";

interface TrailModule {
  linkId: string;
  moduleId: string;
  title: string;
  internalName: string;
  orderIndex: number;
}

interface Props {
  trailId: string;
  modules: TrailModule[];
  allModules: { id: string; title: string; internal_name: string }[];
}

export function ModulosDaFormacao({ trailId, modules, allModules }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [moduleToAdd, setModuleToAdd] = useState("");

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

  const linkedIds = new Set(modules.map((m) => m.moduleId));
  const available = allModules.filter((m) => !linkedIds.has(m.id));

  return (
    <section>
      <SectionTitle>Módulos da formação</SectionTitle>
      <p className="mb-4 text-xs text-muted-foreground max-w-2xl">
        A ordem aqui é a ordem em que o mentorado percorre os módulos. Um mesmo módulo pode
        estar em mais de uma formação — editá-lo altera o conteúdo em todas elas.
      </p>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">
          Nenhum módulo nesta formação ainda.
        </p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg mb-4">
          {modules.map((mod, index) => (
            <li key={mod.linkId} className="flex items-center gap-2 px-3 py-2.5">
              <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/admin/modulos/${mod.moduleId}`}
                  className="text-sm font-medium hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  {mod.title}
                  <ExternalLink className="w-3 h-3" />
                </Link>
                {mod.internalName && mod.internalName !== mod.title && (
                  <p className="text-xs text-muted-foreground truncate">{mod.internalName}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                title="Subir"
                disabled={isPending || index === 0}
                onClick={() =>
                  run(
                    () =>
                      swapTrailModuleOrder(
                        trailId,
                        { linkId: mod.linkId, orderIndex: mod.orderIndex },
                        {
                          linkId: modules[index - 1].linkId,
                          orderIndex: modules[index - 1].orderIndex,
                        }
                      ),
                    "Ordem atualizada."
                  )
                }
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                title="Descer"
                disabled={isPending || index === modules.length - 1}
                onClick={() =>
                  run(
                    () =>
                      swapTrailModuleOrder(
                        trailId,
                        { linkId: mod.linkId, orderIndex: mod.orderIndex },
                        {
                          linkId: modules[index + 1].linkId,
                          orderIndex: modules[index + 1].orderIndex,
                        }
                      ),
                    "Ordem atualizada."
                  )
                }
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() =>
                  run(
                    () => removeModuleFromTrail(trailId, mod.linkId),
                    "Módulo removido da formação."
                  )
                }
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <div className="flex items-center gap-2">
          <SelectField
            value={moduleToAdd}
            onChange={(e) => setModuleToAdd(e.target.value)}
            className="max-w-sm"
          >
            <option value="">Selecione um módulo…</option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </SelectField>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isPending || !moduleToAdd}
            onClick={() => {
              run(() => addModuleToTrail(trailId, moduleToAdd), "Módulo adicionado.");
              setModuleToAdd("");
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Todos os módulos já estão nesta formação.{" "}
          <Link href="/admin/modulos" className="text-primary underline underline-offset-2">
            Criar um novo módulo
          </Link>
          .
        </p>
      )}
    </section>
  );
}
