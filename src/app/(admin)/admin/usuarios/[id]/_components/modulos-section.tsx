"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, ChevronUp, Lock, LockOpen, Unlock } from "lucide-react";
import { setModuleUnlockDate, setModuleForceUnlocked } from "@/lib/actions/admin/users";
import { isTopicDone } from "@/lib/student/topic-status";
import { SectionTitle } from "@/components/admin/page-header";
import { TextField } from "@/components/admin/form-fields";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import type { ModuleAccessRow } from "@/lib/admin/queries";
import type { ActionResult } from "@/lib/admin/types";
import { TopicoProgressoRow } from "./topico-progresso-row";

interface Props {
  userId: string;
  modules: ModuleAccessRow[];
  hasTrail: boolean;
}

type Run = (fn: () => Promise<ActionResult>, successMessage: string) => void;

function ModuloItem({
  userId,
  mod,
  isPending,
  run,
}: {
  userId: string;
  mod: ModuleAccessRow;
  isPending: boolean;
  run: Run;
}) {
  const [expanded, setExpanded] = useState(false);

  const doneTopics = mod.topics.filter((t) => isTopicDone(t.status)).length;
  const moduleComplete = mod.topics.length > 0 && doneTopics === mod.topics.length;
  const unlocked = mod.forceUnlocked || mod.unlocked;

  return (
    <li>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 basis-40 min-w-0 items-center gap-2.5 text-left"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">
            {mod.orderIndex}
          </span>
          <span className="flex-1 min-w-0 text-sm truncate">{mod.title}</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={unlocked ? "success-light" : "outline"} size="sm">
            {unlocked ? <Unlock /> : <Lock />}
            {unlocked ? "Liberado" : "Bloqueado"}
          </Badge>
          {moduleComplete && (
            <Badge variant="info-light" size="sm">
              <CheckCircle2 />
              Concluído
            </Badge>
          )}
          <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {doneTopics}/{mod.topics.length} tópicos
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
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
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-1.5">
          {mod.topics.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Este módulo ainda não tem tópicos.</p>
          ) : (
            mod.topics.map((topic) => (
              <TopicoProgressoRow key={topic.id} topic={topic} moduleOrderIndex={mod.orderIndex} />
            ))
          )}
        </div>
      )}
    </li>
  );
}

export function ModulosSection({ userId, modules, hasTrail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run: Run = (fn, successMessage) => {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  };

  return (
    <section>
      <SectionTitle>Módulos e evolução</SectionTitle>
      <p className="mb-4 text-xs text-muted-foreground max-w-2xl">
        Um módulo abre quando a <strong>liberação imediata</strong> está ligada, ou quando a data de
        liberação já passou <strong>e</strong> o módulo anterior está concluído. Só a data, sozinha,
        não abre um módulo se o anterior ainda estiver em aberto. Expanda um módulo para ver a
        leitura, os exercícios e as respostas do aluno.
      </p>

      {!hasTrail ? (
        <p className="text-sm text-muted-foreground">
          Atribua uma formação para poder liberar módulos.
        </p>
      ) : modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">A formação atribuída ainda não tem módulos.</p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg max-w-2xl">
          {modules.map((mod) => (
            <ModuloItem
              key={mod.moduleId}
              userId={userId}
              mod={mod}
              isPending={isPending}
              run={run}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
