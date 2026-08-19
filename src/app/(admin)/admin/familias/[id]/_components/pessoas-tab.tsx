"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import {
  setUserProject,
  addMentorToProject,
  removeMentorFromProject,
} from "@/lib/actions/admin/users";
import { SectionTitle, EmptyState } from "@/components/admin/page-header";
import { SelectField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { STUDENT_TYPE_LABEL, type ActionResult } from "@/lib/admin/types";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  project_id: string | null;
}

interface Props {
  projects: { id: string; name: string }[];
  students: { id: string; full_name: string; student_type: string | null }[];
  mentorLinks: { id: string; mentorId: string; projectId: string; name: string }[];
  allProfiles: Profile[];
}

export function PessoasTab({ projects, students, mentorLinks, allProfiles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [studentToAdd, setStudentToAdd] = useState("");
  const [mentorToAdd, setMentorToAdd] = useState("");

  const project = projects[0] ?? null;

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

  if (!project) {
    return (
      <EmptyState>
        Esta família ainda não tem projeto. Crie um na aba <strong>Projeto</strong> para poder
        vincular pessoas.
      </EmptyState>
    );
  }

  const linkedStudentIds = new Set(students.map((s) => s.id));
  const availableStudents = allProfiles.filter(
    (p) => p.role === "student" && !linkedStudentIds.has(p.id)
  );

  const linkedMentorIds = new Set(
    mentorLinks.filter((m) => m.projectId === project.id).map((m) => m.mentorId)
  );
  const availableMentors = allProfiles.filter(
    (p) => p.role === "mentor" && !linkedMentorIds.has(p.id)
  );

  return (
    <div className="space-y-10 max-w-2xl">
      <section>
        <SectionTitle>Mentorados</SectionTitle>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">
            Nenhum mentorado vinculado a esta família.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg mb-3">
            {students.map((student) => (
              <li key={student.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/usuarios/${student.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {student.full_name}
                  </Link>
                  {student.student_type && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {STUDENT_TYPE_LABEL[student.student_type] ?? student.student_type}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    run(() => setUserProject(student.id, null), "Mentorado desvinculado.")
                  }
                >
                  <X className="w-3.5 h-3.5" />
                  Desvincular
                </Button>
              </li>
            ))}
          </ul>
        )}

        {availableStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <SelectField
              value={studentToAdd}
              onChange={(e) => setStudentToAdd(e.target.value)}
              className="max-w-xs"
            >
              <option value="">Selecione um mentorado…</option>
              {availableStudents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                  {p.project_id ? " (já em outra família)" : ""}
                </option>
              ))}
            </SelectField>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isPending || !studentToAdd}
              onClick={() => {
                run(() => setUserProject(studentToAdd, project.id), "Mentorado vinculado.");
                setStudentToAdd("");
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Vincular
            </Button>
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Mentores</SectionTitle>
        <p className="mb-3 text-xs text-muted-foreground">
          O mentor acompanha todos os mentorados desta família.
        </p>

        {mentorLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">Nenhum mentor vinculado.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg mb-3">
            {mentorLinks.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <Link
                  href={`/admin/usuarios/${link.mentorId}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    run(
                      () => removeMentorFromProject(link.mentorId, link.projectId),
                      "Mentor desvinculado."
                    )
                  }
                >
                  <X className="w-3.5 h-3.5" />
                  Desvincular
                </Button>
              </li>
            ))}
          </ul>
        )}

        {availableMentors.length > 0 && (
          <div className="flex items-center gap-2">
            <SelectField
              value={mentorToAdd}
              onChange={(e) => setMentorToAdd(e.target.value)}
              className="max-w-xs"
            >
              <option value="">Selecione um mentor…</option>
              {availableMentors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </SelectField>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isPending || !mentorToAdd}
              onClick={() => {
                run(() => addMentorToProject(mentorToAdd, project.id), "Mentor vinculado.");
                setMentorToAdd("");
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Vincular
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
