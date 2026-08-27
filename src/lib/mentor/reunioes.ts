import { createClient } from "@/lib/supabase/server";

export interface Meeting {
  id: string;
  name: string;
  meeting_date: string | null;
  tipo: string | null;
  participantes: string | null;
  proposito: string | null;
  perguntas_principais: string | null;
  notes: string | null;
}

export interface ReunioesOverviewData {
  projectId: string;
  familyName: string;
  meetings: Meeting[];
}

export async function getReunioesOverview(mentorId: string): Promise<ReunioesOverviewData | null> {
  const supabase = await createClient();

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("project_id, projects(families(name))")
    .eq("mentor_id", mentorId)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!mp) return null;

  const projectId = mp.project_id;
  const project = mp.projects as { families: { name: string } | null } | null;
  const familyName = project?.families?.name ?? "Projeto";

  const { data: meetings } = await supabase
    .from("project_meetings")
    .select("id, name, meeting_date, tipo, participantes, proposito, perguntas_principais, notes")
    .eq("project_id", projectId)
    .order("meeting_date");

  return {
    projectId,
    familyName,
    meetings: (meetings ?? []) as Meeting[],
  };
}
