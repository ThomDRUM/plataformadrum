import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { CronogramaClient } from "./_components/cronograma-client";

export default async function CronogramaPage() {
  const supabase = await createClient();
  const mentor = await getSessionProfile();
  if (!mentor) redirect("/login");

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("project_id, projects(start_date, end_date, families(name))")
    .eq("mentor_id", mentor.id)
    .single();

  if (!mp) redirect("/login");

  const projectId = mp.project_id;
  const project = mp.projects as { start_date: string | null; end_date: string | null; families: { name: string } | null } | null;
  const familyName = project?.families?.name ?? "Projeto";
  const projectStart = project?.start_date ?? "2026-06-01";
  const projectEnd   = project?.end_date   ?? "2026-12-31";

  const [scheduleRes, meetingsRes] = await Promise.all([
    supabase
      .from("project_schedule")
      .select("id, title, start_date, end_date, status, mentor_notes")
      .eq("project_id", projectId)
      .order("order_index"),
    supabase
      .from("project_meetings")
      .select("id, name, meeting_date, tipo")
      .eq("project_id", projectId)
      .order("meeting_date"),
  ]);

  const scheduleItems = scheduleRes.data;
  const meetings = meetingsRes.data;

  type RawItem = {
    id: string; title: string;
    start_date: string | null; end_date: string | null;
    status: string; mentor_notes: string;
  };

  const items = (scheduleItems ?? []) as RawItem[];

  return (
    <CronogramaClient
      projectId={projectId}
      familyName={familyName}
      startDate={project?.start_date ?? null}
      endDate={project?.end_date ?? null}
      projectStart={projectStart}
      projectEnd={projectEnd}
      items={items as Parameters<typeof CronogramaClient>[0]["items"]}
      meetings={(meetings ?? []) as { id: string; name: string; meeting_date: string | null; tipo: string | null }[]}
    />
  );
}
