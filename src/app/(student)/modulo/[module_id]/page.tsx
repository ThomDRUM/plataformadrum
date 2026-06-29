import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentAccessData } from "@/lib/student/access";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module_id: string }>;
}) {
  const { module_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("student_type")
    .eq("id", user.id)
    .single();

  if (!profile?.student_type) redirect("/");

  const { modules, topicsByModule } = await getStudentAccessData(
    supabase,
    user.id,
    profile.student_type
  );

  const mod = modules.find((m) => m.id === module_id);
  if (!mod || !mod.unlocked) redirect("/");

  const topics = topicsByModule.get(module_id) ?? [];
  const firstTopic = topics[0];
  if (!firstTopic) redirect("/");

  redirect(`/modulo/${module_id}/topico/${firstTopic.id}`);
}
