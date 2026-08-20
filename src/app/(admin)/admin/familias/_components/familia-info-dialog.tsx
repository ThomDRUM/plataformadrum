"use client";

import type { AdminFamilyRow } from "@/lib/admin/queries";
import type { FamilyOverview } from "@/lib/admin/queries";
import { STUDENT_TYPE_LABEL } from "@/lib/admin/types";

import {
  CollapsibleText,
  Empty,
  Row,
  Section,
} from "@/components/admin/info-sections";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { ProjectStatusBadge } from "@/components/admin/status-badge";
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
export type Overview = FamilyOverview | null | undefined;

interface Props {
  family: AdminFamilyRow;
  overview: Overview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FamiliaInfoDialog({ family, overview, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-2xl"
        overlayClassName={ADMIN_OVERLAY}
      >
        <DialogHeader>
          <DialogTitle>{family.name}</DialogTitle>
          <DialogDescription>
            {family.businessName || "Sem negócio informado"}
          </DialogDescription>
        </DialogHeader>

        {overview === undefined ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : overview === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Não foi possível carregar os dados desta família.
          </p>
        ) : (
          <div className="space-y-6 py-2">
            <Section title="Projeto">
              {overview.projects.length === 0 ? (
                <ProjectStatusBadge status={undefined} />
              ) : (
                <div className="space-y-4">
                  {overview.projects.map((project) => (
                    <dl
                      key={project.id}
                      className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2"
                    >
                      <Row label="Nome">{project.name}</Row>
                      <Row label="Status">
                        <ProjectStatusBadge status={project.status} />
                      </Row>
                      <Row label="Início">{formatDate(project.startDate)}</Row>
                      <Row label="Término">{formatDate(project.endDate)}</Row>
                      <Row label="Duração">
                        {project.durationMonths
                          ? `${project.durationMonths} ${
                              project.durationMonths === 1 ? "mês" : "meses"
                            }`
                          : "—"}
                      </Row>
                    </dl>
                  ))}
                </div>
              )}
            </Section>

            <Separator />

            <Section title={`Membros da família (${overview.members.length})`}>
              {overview.members.length === 0 ? (
                <Empty>Árvore genealógica ainda não preenchida.</Empty>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {overview.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2"
                    >
                      <span className="font-medium">{member.name}</span>
                      {member.familyRole && (
                        <span className="text-muted-foreground">{member.familyRole}</span>
                      )}
                      <span className="ml-auto flex items-center gap-2">
                        {member.worksInBusiness && member.businessRole && (
                          <span className="text-xs text-muted-foreground">
                            {member.businessRole}
                          </span>
                        )}
                        <Badge variant="secondary" size="sm">
                          G{member.generation}
                        </Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Separator />

            <Section title={`Mentorados (${overview.students.length})`}>
              {overview.students.length === 0 ? (
                <Empty>Nenhum mentorado vinculado.</Empty>
              ) : (
                <ul className="space-y-1.5">
                  {overview.students.map((student) => (
                    <li key={student.id} className="flex items-center gap-2">
                      <span>{student.name}</span>
                      {student.studentType && (
                        <Badge variant="secondary" size="sm">
                          {STUDENT_TYPE_LABEL[student.studentType] ?? student.studentType}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={`Mentores (${overview.mentors.length})`}>
              {overview.mentors.length === 0 ? (
                <Empty>Nenhum mentor vinculado.</Empty>
              ) : (
                <ul className="space-y-1.5">
                  {overview.mentors.map((mentor) => (
                    <li key={mentor.id}>{mentor.name}</li>
                  ))}
                </ul>
              )}
            </Section>

            <Separator />

            <div className="space-y-3">
              <CollapsibleText title="História" text={overview.family.history} />
              <CollapsibleText title="Missão" text={overview.family.mission} />
              <CollapsibleText title="Visão" text={overview.family.vision} />
              <CollapsibleText title="Valores" text={overview.family.values} />
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
          <LinkButton href={`/admin/familias/${family.id}`}>Vincular pessoas</LinkButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** `date` vem do Postgres como `YYYY-MM-DD`. */
function formatDate(date: string | null) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
