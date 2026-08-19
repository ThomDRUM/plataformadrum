import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { getCachedTrailIdByType, getStudentAccessData } from "@/lib/student/access";

export default async function MentorTrailModulePage({
  params,
}: {
  params: Promise<{ module_id: string }>;
}) {
  const { module_id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const mentorTrailId = await getCachedTrailIdByType(supabase, "mentor");

  if (!mentorTrailId) redirect("/mentor/aprender");

  const { modules, topicsByModule } = await getStudentAccessData(supabase, user.id, mentorTrailId);

  const mod = modules.find((m) => m.id === module_id);
  if (!mod) redirect("/mentor/aprender");

  const topics = topicsByModule.get(module_id) ?? [];
  const firstTopic = topics[0];
  if (!firstTopic) redirect("/mentor/aprender");

  redirect(`/mentor/aprender/modulo/${module_id}/topico/${firstTopic.id}`);
}
