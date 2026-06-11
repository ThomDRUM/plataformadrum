import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CronogramaClient } from "./_components/cronograma-client";

export default async function CronogramaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("project_id, projects(start_date, end_date, families(name))")
    .eq("mentor_id", user.id)
    .single();

  if (!mp) redirect("/login");

  const projectId = mp.project_id;
  const project = mp.projects as { start_date: string | null; end_date: string | null; families: { name: string } | null } | null;
  const familyName = project?.families?.name ?? "Projeto";
  const projectStart = project?.start_date ?? "2026-06-01";
  const projectEnd   = project?.end_date   ?? "2026-12-31";

  const { data: scheduleItems } = await supabase
    .from("project_schedule")
    .select("id, title, start_date, end_date, status, mentor_notes, has_events, project_events(id, title, date)")
    .eq("project_id", projectId)
    .order("order_index");

  type RawItem = {
    id: string; title: string;
    start_date: string | null; end_date: string | null;
    status: string; mentor_notes: string; has_events: boolean;
    project_events: { id: string; title: string; date: string | null }[];
  };

  const items = (scheduleItems ?? []) as RawItem[];

  return (
    <CronogramaClient
      projectId={projectId}
      familyName={familyName}
      projectStart={projectStart}
      projectEnd={projectEnd}
      items={items as Parameters<typeof CronogramaClient>[0]["items"]}
    />
  );
}
