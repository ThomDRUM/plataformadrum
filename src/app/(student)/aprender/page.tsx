import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentAccessData } from "@/lib/student/access";

export default async function AprenderEntryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("student_type")
    .eq("id", user.id)
    .single();

  if (!profile?.student_type) redirect("/");

  const { modules, topicsByModule, getTopicStatus } = await getStudentAccessData(
    supabase,
    user.id,
    profile.student_type
  );

  const unlockedModules = modules.filter((m) => m.unlocked);
  if (unlockedModules.length === 0) redirect("/");

  for (const mod of unlockedModules) {
    const topics = topicsByModule.get(mod.id) ?? [];
    const incomplete = topics.find((t) => getTopicStatus(t.id) !== "completed");
    if (incomplete) redirect(`/modulo/${mod.id}/topico/${incomplete.id}`);
  }

  const lastModule = unlockedModules[unlockedModules.length - 1];
  const lastModuleTopics = topicsByModule.get(lastModule.id) ?? [];
  if (lastModuleTopics[0]) redirect(`/modulo/${lastModule.id}/topico/${lastModuleTopics[0].id}`);

  redirect("/");
}
