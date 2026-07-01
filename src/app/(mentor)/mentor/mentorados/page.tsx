import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentAccessData } from "@/lib/student/access";
import { MentoradoCard } from "./_components/mentorado-card";

export default async function MentoradosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mentorProjects } = await supabase
    .from("mentor_projects")
    .select("project_id")
    .eq("mentor_id", user.id);

  const projectIds = (mentorProjects ?? []).map((mp) => mp.project_id);

  const { data: students } = projectIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, student_type, trail_id")
        .eq("role", "student")
        .in("project_id", projectIds)
    : { data: [] };

  const mentorados = await Promise.all(
    (students ?? []).map(async (student) => {
      if (!student.trail_id) {
        return {
          id: student.id,
          fullName: student.full_name,
          studentType: student.student_type as string | null,
          modulesUnlocked: 0,
          modulesTotal: 0,
        };
      }

      const { modules } = await getStudentAccessData(
        supabase,
        student.id,
        student.trail_id
      );

      const modulesUnlocked = modules.filter((m) => m.unlocked).length;

      return {
        id: student.id,
        fullName: student.full_name,
        studentType: student.student_type,
        modulesUnlocked,
        modulesTotal: modules.length,
      };
    })
  );

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
