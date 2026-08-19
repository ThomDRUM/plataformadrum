"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, LockOpen } from "lucide-react";
import { setModuleUnlockDate, setModuleForceUnlocked } from "@/lib/actions/admin/users";
import { SectionTitle } from "@/components/admin/page-header";
import { TextField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import type { ModuleAccessRow } from "@/lib/admin/queries";
import type { ActionResult } from "@/lib/admin/types";

interface Props {
  userId: string;
  modules: ModuleAccessRow[];
  hasTrail: boolean;
}

export function ModulosSection({ userId, modules, hasTrail }: Props) {
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

  return (
    <section>
      <SectionTitle>Módulos liberados</SectionTitle>
      <p className="mb-4 text-xs text-muted-foreground max-w-2xl">
        Um módulo abre quando a <strong>liberação imediata</strong> está ligada, ou quando a
        data de liberação já passou <strong>e</strong> o módulo anterior está concluído. Só a
        data, sozinha, não abre um módulo se o anterior ainda estiver em aberto.
      </p>

      {!hasTrail ? (
        <p className="text-sm text-muted-foreground">
          Atribua uma formação para poder liberar módulos.
        </p>
      ) : modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          A formação atribuída ainda não tem módulos.
        </p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg max-w-2xl">
          {modules.map((mod, index) => (
            <li key={mod.moduleId} className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">
                {index + 1}
              </span>
              <span className="flex-1 min-w-0 text-sm truncate">{mod.title}</span>

              <TextField
                type="date"
                className="w-36 shrink-0"
                defaultValue={mod.unlockDate ?? ""}
                disabled={isPending}
                onChange={(e) =>
                  run(
                    () => setModuleUnlockDate(userId, mod.moduleId, e.target.value || null),
                    "Data de liberação atualizada."
                  )
                }
              />

              <Button
                variant={mod.forceUnlocked ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0"
                disabled={isPending}
                onClick={() =>
                  run(
                    () => setModuleForceUnlocked(userId, mod.moduleId, !mod.forceUnlocked),
                    mod.forceUnlocked ? "Liberação imediata desligada." : "Módulo liberado."
                  )
                }
              >
                {mod.forceUnlocked ? (
                  <>
                    <LockOpen className="w-3.5 h-3.5" />
                    Liberado
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Liberar
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
