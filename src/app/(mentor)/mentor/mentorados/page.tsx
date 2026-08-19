import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { buildStudentAccessData, getCachedTrailContent, type UserProgress } from "@/lib/student/access";
import { MentoradoCard } from "./_components/mentorado-card";

export default async function MentoradosPage() {
  const supabase = await createClient();
  const mentor = await getSessionProfile();
  if (!mentor) redirect("/login");

  const { data: mentorProjects } = await supabase
    .from("mentor_projects")
    .select("project_id")
    .eq("mentor_id", mentor.id);

  const projectIds = (mentorProjects ?? []).map((mp) => mp.project_id);

  const { data: students } = projectIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, student_type, trail_id")
        .eq("role", "student")
        .in("project_id", projectIds)
    : { data: [] };

  const studentList = students ?? [];
  const studentIds = studentList.map((s) => s.id);
  const trailIds = [...new Set(studentList.map((s) => s.trail_id).filter((t): t is string => !!t))];

  // Conteúdo buscado uma vez por trilha distinta (não por aluno), e o progresso
  // de todos os alunos em duas queries batch. Antes era 6 queries × N alunos.
  const trailContents = new Map(
    await Promise.all(
      trailIds.map(async (trailId) => [trailId, await getCachedTrailContent(supabase, trailId)] as const)
    )
  );

  const allModuleIds = [...new Set([...trailContents.values()].flatMap((c) => c.modules.map((m) => m.id)))];
  const allTopicIds = [...new Set([...trailContents.values()].flatMap((c) => c.topics.map((t) => t.id)))];

  const [accessRes, progressRes] = await Promise.all([
    studentIds.length && allModuleIds.length
      ? supabase
          .from("user_module_access")
          .select("user_id, module_id, unlock_date, force_unlocked")
          .in("user_id", studentIds)
          .in("module_id", allModuleIds)
      : Promise.resolve({ data: [] }),
    studentIds.length && allTopicIds.length
      ? supabase
          .from("user_topic_progress")
          .select("user_id, topic_id, repertoire_viewed, exercise_completed")
          .in("user_id", studentIds)
          .in("topic_id", allTopicIds)
      : Promise.resolve({ data: [] }),
  ]);

  const progressByUser = new Map<string, UserProgress>(
    studentIds.map((id) => [id, { access: [], progress: [] }])
  );
  for (const row of accessRes.data ?? []) {
    progressByUser.get(row.user_id)?.access.push(row);
  }
  for (const row of progressRes.data ?? []) {
    progressByUser.get(row.user_id)?.progress.push(row);
  }

  const mentorados = studentList.map((student) => {
    const content = student.trail_id ? trailContents.get(student.trail_id) : null;

    if (!content?.trail) {
      return {
        id: student.id,
        fullName: student.full_name,
        studentType: student.student_type as string | null,
        modulesUnlocked: 0,
        modulesTotal: 0,
      };
    }

    const { modules } = buildStudentAccessData(
      content,
      progressByUser.get(student.id) ?? { access: [], progress: [] }
    );

    return {
      id: student.id,
      fullName: student.full_name,
      studentType: student.student_type,
      modulesUnlocked: modules.filter((m) => m.unlocked).length,
      modulesTotal: modules.length,
    };
  });

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Mentorados</h1>
      </div>

      {mentorados.length === 0 ? (
        <p className="text-sm text-muted-foreground/60">Nenhum mentorado vinculado ainda.</p>
      ) : (
        <div className="space-y-3">
          {mentorados.map((m) => (
            <MentoradoCard key={m.id} {...m} />
          ))}
        </div>
      )}
    </div>
  );
}
