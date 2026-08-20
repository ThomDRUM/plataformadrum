"use client";

import { BookOpen, PenLine } from "lucide-react";

import type { AdminModuleRow, ModuleOverview } from "@/lib/admin/queries";
import { TRAIL_TYPE_LABEL } from "@/lib/admin/types";

import { CollapsibleText, Empty, Section } from "@/components/admin/info-sections";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** `undefined` enquanto carrega, `null` quando a leitura falhou. */
export type Overview = ModuleOverview | null | undefined;

interface Props {
  module: AdminModuleRow;
  overview: Overview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModuloInfoDialog({ module: mod, overview, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-2xl"
        overlayClassName={ADMIN_OVERLAY}
      >
        <DialogHeader>
          <DialogTitle>{mod.title}</DialogTitle>
          <DialogDescription>
            {/* O nome interno repete o título quando ninguém preencheu um
                apelido próprio — nesse caso não vale a linha. */}
            {mod.internalName && mod.internalName !== mod.title
              ? mod.internalName
              : "Módulo independente, reaproveitável em várias formações"}
          </DialogDescription>
        </DialogHeader>

        {overview === undefined ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : overview === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Não foi possível carregar os dados deste módulo.
          </p>
        ) : (
          <div className="space-y-6 py-2">
            <Section title={`Tópicos (${overview.topics.length})`}>
              {overview.topics.length === 0 ? (
                <Empty>
                  Nenhum tópico neste módulo — não há o que ler nem o que responder.
                </Empty>
              ) : (
                <ol className="divide-y divide-border rounded-lg border border-border">
                  {overview.topics.map((topic, index) => (
                    <li key={topic.id} className="flex items-start gap-2 px-3 py-2">
                      <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {index + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{topic.title}</p>
                        {topic.learningObjective && (
                          <p className="text-xs text-muted-foreground">
                            {topic.learningObjective}
                          </p>
                        )}
                      </div>
                      {/* Mesma leitura da tela do módulo: repertório vazio é um
                          problema, exercício é opcional. */}
                      <span className="flex shrink-0 items-center gap-3 pt-0.5">
                        <span
                          className={
                            topic.hasRepertoire
                              ? "inline-flex items-center gap-1 text-xs text-muted-foreground"
                              : "inline-flex items-center gap-1 text-xs text-destructive/70"
                          }
                        >
                          <BookOpen aria-hidden="true" className="size-3" />
                          {topic.hasRepertoire ? "Repertório" : "Sem repertório"}
                        </span>
                        {topic.hasExercise && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <PenLine aria-hidden="true" className="size-3" />
                            Exercício
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Section>

            <Separator />

            <Section title={`Formações que usam este módulo (${overview.trails.length})`}>
              {overview.trails.length === 0 ? (
                <Empty>
                  Fora de todas as formações — nenhum mentorado ou mentor chega a este
                  módulo.
                </Empty>
              ) : (
                <ul className="space-y-1.5">
                  {overview.trails.map((trail) => (
                    <li key={trail.id} className="flex items-center gap-2">
                      <span>{trail.title}</span>
                      <Badge variant="secondary" size="sm">
                        {TRAIL_TYPE_LABEL[trail.trailType] ?? trail.trailType}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Separator />

            <div className="space-y-3">
              <CollapsibleText title="Intenção" text={overview.module.intention} />
              <CollapsibleText title="Por quê" text={overview.module.why} />
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
          <LinkButton href={`/admin/modulos/${mod.id}`}>Escrever tópicos</LinkButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
