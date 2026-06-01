import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompetenciaPage } from "./competencia-page";

export type DeliverableData = {
  id: string;
  title: string;
  instructions_html: string | null;
  is_primary: boolean;
  submission: {
    id: string;
    text_content: string | null;
    external_link: string | null;
    status: string;
  } | null;
};

export type CompetencyData = {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  order_index: number;
  status: "done" | "active" | "future";
  deliverables: DeliverableData[];
  repertoire_count: number;
  reflection_count: number;
};

export type ModuleData = {
  id: string;
  title: string;
  order_index: number;
  module_status: string;
  competencies: CompetencyData[];
};

export default async function CompetenciaPageWrapper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("trail_id")
    .eq("id", user.id)
    .single();

  if (!profile?.trail_id) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
      </div>
    );
  }

  const [
    modulesResult,
    competenciesResult,
    moduleStatusResult,
    deliverablesResult,
    submissionsResult,
    repertoireResult,
    reflectionsResult,
  ] = await Promise.all([
    supabase.from("modules").select("id, title, order_index").eq("trail_id", profile.trail_id).order("order_index"),
    supabase.from("competencies").select("id, module_id, title, description, order_index").order("order_index"),
    supabase.from("user_module_status").select("module_id, status").eq("user_id", user.id),
    supabase.from("deliverables").select("id, competency_id, title, instructions_html, is_primary"),
    supabase.from("deliverable_submissions").select("id, deliverable_id, text_content, external_link, status").eq("user_id", user.id),
    supabase.from("repertoire_items").select("id, competency_id"),
    supabase.from("reflections").select("id, competency_id"),
  ]);

  const modules = modulesResult.data ?? [];
  const allCompetencies = competenciesResult.data ?? [];
  const moduleStatuses = moduleStatusResult.data ?? [];
  const deliverables = deliverablesResult.data ?? [];
  const submissions = submissionsResult.data ?? [];
  const repertoireItems = repertoireResult.data ?? [];
  const reflections = reflectionsResult.data ?? [];

  // Build lookup maps
  const moduleStatusMap = Object.fromEntries(moduleStatuses.map((s) => [s.module_id, s.status]));
  const submissionMap = Object.fromEntries(submissions.map((s) => [s.deliverable_id, s]));

  const repertoireCountMap: Record<string, number> = {};
  for (const r of repertoireItems) {
    repertoireCountMap[r.competency_id] = (repertoireCountMap[r.competency_id] ?? 0) + 1;
  }
  const reflectionCountMap: Record<string, number> = {};
  for (const r of reflections) {
    reflectionCountMap[r.competency_id] = (reflectionCountMap[r.competency_id] ?? 0) + 1;
  }

  // Derive active module
  const activeModule =
    modules.find((m) => moduleStatusMap[m.id] === "in_progress") ??
    modules.find((m) => !moduleStatusMap[m.id] || moduleStatusMap[m.id] === "not_started") ??
    null;

  // Derive done competencies
  const doneCompetencyIds = new Set(
    submissions
      .filter((s) => s.status === "submitted" || s.status === "completed")
      .map((s) => deliverables.find((d) => d.id === s.deliverable_id)?.competency_id)
      .filter(Boolean) as string[]
  );

  // Current competency = first non-done in active module
  const activeModuleCompetencies = allCompetencies
    .filter((c) => c.module_id === activeModule?.id)
    .sort((a, b) => a.order_index - b.order_index);

  const currentCompetencyId =
    activeModuleCompetencies.find((c) => !doneCompetencyIds.has(c.id))?.id ??
    activeModuleCompetencies[0]?.id ??
    allCompetencies[0]?.id ??
    null;

  // Assemble full data
  const modulesData: ModuleData[] = modules.map((mod) => {
    const modCompetencies = allCompetencies
      .filter((c) => c.module_id === mod.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((comp): CompetencyData => {
        let status: "done" | "active" | "future";
        if (doneCompetencyIds.has(comp.id)) status = "done";
        else if (comp.id === currentCompetencyId) status = "active";
        else status = "future";

        const compDeliverables: DeliverableData[] = deliverables
          .filter((d) => d.competency_id === comp.id)
          .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
          .map((d) => ({
            id: d.id,
            title: d.title,
            instructions_html: d.instructions_html,
            is_primary: d.is_primary,
            submission: submissionMap[d.id]
              ? {
                  id: submissionMap[d.id].id,
                  text_content: submissionMap[d.id].text_content,
                  external_link: submissionMap[d.id].external_link,
                  status: submissionMap[d.id].status,
                }
              : null,
          }));

        return {
          id: comp.id,
          module_id: comp.module_id,
          title: comp.title,
          description: comp.description,
          order_index: comp.order_index,
          status,
          deliverables: compDeliverables,
          repertoire_count: repertoireCountMap[comp.id] ?? 0,
          reflection_count: reflectionCountMap[comp.id] ?? 0,
        };
      });

    return {
      id: mod.id,
      title: mod.title,
      order_index: mod.order_index,
      module_status: moduleStatusMap[mod.id] ?? "not_started",
      competencies: modCompetencies,
    };
  });

  return (
    <Suspense fallback={
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    }>
      <CompetenciaPage
        modules={modulesData}
        defaultCompetencyId={currentCompetencyId ?? ""}
        userId={user.id}
      />
    </Suspense>
  );
}
