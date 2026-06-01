import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RepertoireClient } from "./repertoire-client";

export type RepertoireItemData = {
  id: string;
  competency_id: string;
  title: string;
  type: string;
  level: number;
  material_type: string | null;
  short_summary: string | null;
  full_summary: string | null;
  external_url: string | null;
  content_html: string | null;
};

export type CompetencyOption = {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
};

export type ModuleOption = {
  id: string;
  title: string;
  order_index: number;
};

export default async function RepertorioPage() {
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

  const [modulesResult, competenciesResult, itemsResult, consumedResult, moduleStatusResult, submissionsResult, deliverablesResult] = await Promise.all([
    supabase.from("modules").select("id, title, order_index").eq("trail_id", profile.trail_id).order("order_index"),
    supabase.from("competencies").select("id, module_id, title, order_index").order("order_index"),
    supabase.from("repertoire_items").select("id, competency_id, title, type, level, material_type, short_summary, full_summary, external_url, content_html").order("level", { ascending: true }),
    supabase.from("user_repertoire_consumed").select("repertoire_item_id").eq("user_id", user.id),
    supabase.from("user_module_status").select("module_id, status").eq("user_id", user.id),
    supabase.from("deliverable_submissions").select("deliverable_id, status").eq("user_id", user.id).in("status", ["submitted", "completed"]),
    supabase.from("deliverables").select("id, competency_id"),
  ]);

  const modules = modulesResult.data ?? [];
  const allCompetencies = competenciesResult.data ?? [];
  const items = itemsResult.data ?? [];
  const consumedIds = (consumedResult.data ?? []).map((r) => r.repertoire_item_id);
  const moduleStatuses = moduleStatusResult.data ?? [];
  const submissions = submissionsResult.data ?? [];
  const deliverables = deliverablesResult.data ?? [];

  // Filter competencies to this trail's modules only
  const moduleIds = new Set(modules.map((m) => m.id));
  const competencies = allCompetencies.filter((c) => moduleIds.has(c.module_id));

  // Derive current competency
  const moduleStatusMap = Object.fromEntries(moduleStatuses.map((s) => [s.module_id, s.status]));
  const activeModule =
    modules.find((m) => moduleStatusMap[m.id] === "in_progress") ??
    modules.find((m) => !moduleStatusMap[m.id] || moduleStatusMap[m.id] === "not_started") ??
    null;

  const doneCompetencyIds = new Set(
    submissions
      .map((s) => deliverables.find((d) => d.id === s.deliverable_id)?.competency_id)
      .filter(Boolean) as string[]
  );

  const activeModuleCompetencies = competencies
    .filter((c) => c.module_id === activeModule?.id)
    .sort((a, b) => a.order_index - b.order_index);

  const currentCompetencyId =
    activeModuleCompetencies.find((c) => !doneCompetencyIds.has(c.id))?.id ??
    activeModuleCompetencies[0]?.id ??
    competencies[0]?.id ??
    null;

  return (
    <Suspense fallback={
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    }>
      <RepertoireClient
        modules={modules}
        competencies={competencies}
        items={items}
        consumedIds={consumedIds}
        userId={user.id}
        currentCompetencyId={currentCompetencyId}
      />
    </Suspense>
  );
}
