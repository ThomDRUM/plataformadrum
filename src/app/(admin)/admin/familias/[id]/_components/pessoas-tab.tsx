"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  setUserProject,
  addMentorToProject,
  removeMentorFromProject,
} from "@/lib/actions/admin/users";
import { EmptyState } from "@/components/admin/page-header";
import { STUDENT_TYPE_LABEL, type ActionResult } from "@/lib/admin/types";
import { VinculoPanel, type VinculoOption } from "./vinculo-panel";

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
  /** Chamado depois de gravar — o dialog de detalhe usa para recarregar. */
  onSaved?: () => void;
}

export function PessoasTab({
  projects,
  students,
  mentorLinks,
  allProfiles,
  onSaved,
}: Props) {
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
      onSaved?.();
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
  const availableStudents: VinculoOption[] = allProfiles
    .filter((p) => p.role === "student" && !linkedStudentIds.has(p.id))
    .map((p) => ({
      id: p.id,
      // Vincular alguém que já está em outra família move o vínculo, não duplica.
      label: p.project_id ? `${p.full_name} (já em outra família)` : p.full_name,
    }));

  const linkedMentorIds = new Set(
    mentorLinks.filter((m) => m.projectId === project.id).map((m) => m.mentorId)
  );
  const availableMentors: VinculoOption[] = allProfiles
    .filter((p) => p.role === "mentor" && !linkedMentorIds.has(p.id))
    .map((p) => ({ id: p.id, label: p.full_name }));

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <VinculoPanel
        title="Mentorados"
        description={`Vinculados ao projeto "${project.name}".`}
        count={students.length}
        emptyLabel="Nenhum mentorado vinculado a esta família."
        removeLabel="Desvincular mentorado"
        items={students.map((student) => ({
          key: student.id,
          profileId: student.id,
          name: student.full_name,
          meta: student.student_type
            ? STUDENT_TYPE_LABEL[student.student_type] ?? student.student_type
            : null,
          onRemove: () =>
            run(() => setUserProject(student.id, null), "Mentorado desvinculado."),
        }))}
        selectLabel="Selecione um mentorado…"
        options={availableStudents}
        exhaustedLabel="Todos os mentorados da plataforma já estão vinculados a esta família."
        value={studentToAdd}
        onValueChange={setStudentToAdd}
        onAdd={() => {
          run(() => setUserProject(studentToAdd, project.id), "Mentorado vinculado.");
          setStudentToAdd("");
        }}
        disabled={isPending}
      />

      <VinculoPanel
        title="Mentores"
        description="O mentor acompanha todos os mentorados desta família."
        count={mentorLinks.length}
        emptyLabel="Nenhum mentor vinculado."
        removeLabel="Desvincular mentor"
        items={mentorLinks.map((link) => ({
          key: link.id,
          profileId: link.mentorId,
          name: link.name,
          onRemove: () =>
            run(
              () => removeMentorFromProject(link.mentorId, link.projectId),
              "Mentor desvinculado."
            ),
        }))}
        selectLabel="Selecione um mentor…"
        options={availableMentors}
        exhaustedLabel="Todos os mentores da plataforma já acompanham esta família."
        value={mentorToAdd}
        onValueChange={setMentorToAdd}
        onAdd={() => {
          run(() => addMentorToProject(mentorToAdd, project.id), "Mentor vinculado.");
          setMentorToAdd("");
        }}
        disabled={isPending}
      />
    </div>
  );
}
