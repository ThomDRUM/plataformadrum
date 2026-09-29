import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { getStudentAccessData } from "@/lib/student/access";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module_id: string }>;
}) {
  const { module_id } = await params;
  const supabase = await createClient();
  const profile = await getSessionProfile();
  if (!profile?.trailId) redirect("/");

  const { modules, topicsByModule } = await getStudentAccessData(
    supabase,
    profile.id,
    profile.trailId
  );

  const mod = modules.find((m) => m.id === module_id);
  if (!mod || !mod.unlocked) redirect("/");

  const topics = topicsByModule.get(module_id) ?? [];
  const firstTopic = topics[0];
  if (!firstTopic) redirect("/");

  redirect(`/modulo/${module_id}/topico/${firstTopic.id}`);
}
