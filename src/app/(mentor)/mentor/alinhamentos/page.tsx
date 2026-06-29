import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapaAlinhamentos } from "./_components/mapa-alinhamentos";
import { ReunioesSection } from "./_components/reunioes-section";

export default async function AlinhamentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mp } = await supabase
    .from("mentor_projects")
    .select("project_id")
    .eq("mentor_id", user.id)
    .single();

  if (!mp) redirect("/login");

  const projectId = mp.project_id;

  const { data: meetings } = await supabase
    .from("project_meetings")
    .select("id, name, meeting_date, tipo, participantes, proposito, perguntas_principais, notes")
    .eq("project_id", projectId)
    .order("meeting_date");

  return (
    <div className="max-w-3xl space-y-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Alinhamentos</h1>
      </div>

      <MapaAlinhamentos />

      <ReunioesSection
        projectId={projectId}
        meetings={(meetings ?? []) as {
          id: string; name: string; meeting_date: string | null;
          tipo: string | null; participantes: string | null;
          proposito: string | null; perguntas_principais: string | null;
          notes: string | null;
        }[]}
      />
    </div>
  );
}
