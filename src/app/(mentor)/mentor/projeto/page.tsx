import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { ProjetoClient } from "./_components/projeto-client";

export default async function ProjetoPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("project_id, projects(families(name))")
    .eq("mentor_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!mp) redirect("/login");

  const projectId = mp.project_id;
  const project = mp.projects as { families: { name: string } | null } | null;
  const familyName = project?.families?.name ?? "Projeto";

  const [overviewRes, outcomesRes, rulesRes, rolesRes] = await Promise.all([
    supabase.from("project_overview").select("intention, mwta, point_a, point_b").eq("project_id", projectId).single(),
    supabase.from("project_desired_outcomes").select("id, text").eq("project_id", projectId).order("order_index"),
    supabase.from("project_rules").select("id, title, description").eq("project_id", projectId).order("order_index"),
    supabase.from("project_roles").select("id, person_name, description").eq("project_id", projectId).order("order_index"),
  ]);

  return (
    <ProjetoClient
      projectId={projectId}
      familyName={familyName}
      overview={overviewRes.data ?? { intention: "", mwta: "", point_a: "", point_b: "" }}
      outcomes={(outcomesRes.data ?? []) as { id: string; text: string }[]}
      rules={(rulesRes.data ?? []) as { id: string; title: string; description: string }[]}
      roles={(rolesRes.data ?? []) as { id: string; person_name: string; description: string }[]}
    />
  );
}
