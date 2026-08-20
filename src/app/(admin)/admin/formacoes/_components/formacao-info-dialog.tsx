"use client";

import type { AdminTrailRow, TrailOverview } from "@/lib/admin/queries";
import { ROLE_LABEL, STUDENT_TYPE_LABEL, TRAIL_TYPE_LABEL } from "@/lib/admin/types";

import {
  CollapsibleText,
  Empty,
  Section,
} from "@/components/admin/info-sections";
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
export type Overview = TrailOverview | null | undefined;

interface Props {
  trail: AdminTrailRow;
  overview: Overview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormacaoInfoDialog({ trail, overview, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-2xl"
        overlayClassName={ADMIN_OVERLAY}
      >
        <DialogHeader>
          <DialogTitle>{trail.title}</DialogTitle>
          <DialogDescription>
            Formação para {TRAIL_TYPE_LABEL[trail.trailType] ?? trail.trailType}
          </DialogDescription>
        </DialogHeader>

        {overview === undefined ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : overview === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Não foi possível carregar os dados desta formação.
          </p>
        ) : (
          <div className="space-y-6 py-2">
            <Section title={`Módulos (${overview.modules.length})`}>
              {overview.modules.length === 0 ? (
                <Empty>
                  Nenhum módulo nesta formação — quem a recebe não encontra o que
                  estudar.
                </Empty>
              ) : (
                <ol className="divide-y divide-border rounded-lg border border-border">
                  {overview.modules.map((mod, index) => (
                    <li
                      key={mod.id}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2"
                    >
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {index + 1}.
                      </span>
                      <span className="font-medium">{mod.title}</span>
                      {mod.internalName && mod.internalName !== mod.title && (
                        <span className="text-xs text-muted-foreground">
                          {mod.internalName}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {mod.topicCount} {mod.topicCount === 1 ? "tópico" : "tópicos"}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Section>

            <Separator />

            <Section title={`Usuários com esta formação (${overview.users.length})`}>
              {overview.users.length === 0 ? (
                <Empty>Nenhum usuário recebeu esta formação.</Empty>
              ) : (
                <ul className="space-y-1.5">
                  {overview.users.map((user) => (
                    <li key={user.id} className="flex items-center gap-2">
                      <span>{user.name}</span>
                      <Badge variant="secondary" size="sm">
                        {ROLE_LABEL[user.role] ?? user.role}
                      </Badge>
                      {user.studentType && (
                        <span className="text-xs text-muted-foreground">
                          {STUDENT_TYPE_LABEL[user.studentType] ?? user.studentType}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Separator />

            <div className="space-y-3">
              <CollapsibleText title="Intenção" text={overview.trail.intention} />
              <CollapsibleText title="Por quê" text={overview.trail.why} />
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
          <LinkButton href={`/admin/formacoes/${trail.id}`}>Montar formação</LinkButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
