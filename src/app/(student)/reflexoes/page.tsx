import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReflexoesClient } from "./reflexoes-client";

export type ReflectionData = {
  id: string;
  competency_id: string;
  title: string;
  context: string | null;
  is_required: boolean;
};

export type QuestionData = {
  id: string;
  reflection_id: string;
  question_text: string;
  order_index: number;
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

export default async function ReflexoesPage() {
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

  const [modulesResult, competenciesResult, reflectionsResult, questionsResult, answersResult, moduleStatusResult, submissionsResult, deliverablesResult] =
    await Promise.all([
      supabase.from("modules").select("id, title, order_index").eq("trail_id", profile.trail_id).order("order_index"),
      supabase.from("competencies").select("id, module_id, title, order_index").order("order_index"),
      supabase.from("reflections").select("id, competency_id, title, context, is_required").order("created_at"),
      supabase.from("reflection_questions").select("id, reflection_id, question_text, order_index").order("order_index"),
      supabase.from("reflection_answers").select("question_id, answer_text").eq("user_id", user.id),
      supabase.from("user_module_status").select("module_id, status").eq("user_id", user.id),
      supabase.from("deliverable_submissions").select("deliverable_id, status").eq("user_id", user.id).in("status", ["submitted", "completed"]),
      supabase.from("deliverables").select("id, competency_id"),
    ]);

  const modules = modulesResult.data ?? [];
  const allCompetencies = competenciesResult.data ?? [];
  const reflections = reflectionsResult.data ?? [];
  const questions = questionsResult.data ?? [];
  const answers = answersResult.data ?? [];
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

  const answersMap = Object.fromEntries(answers.map((a) => [a.question_id, a.answer_text ?? ""]));

  return (
    <Suspense fallback={
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    }>
      <ReflexoesClient
        modules={modules}
        competencies={competencies}
        reflections={reflections}
        questions={questions}
        answersMap={answersMap}
        userId={user.id}
        currentCompetencyId={currentCompetencyId}
      />
    </Suspense>
  );
}
