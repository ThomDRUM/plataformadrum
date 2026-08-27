import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { getTopicNavContext } from "@/lib/student/topic-context";
import { LearnSidebar } from "@/components/topic/learn-sidebar";
import { ModuleSelector } from "@/components/topic/module-selector";
import { TopicFooterNav } from "@/components/topic/topic-footer-nav";

export default async function TopicOverviewPage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  const supabase = await createClient();
  const profile = await getSessionProfile();
  if (!profile?.trailId) redirect("/");

  const { modules, mod, topics, hasExercise, getTopicStatus, previousStepNav, nextStepNav } =
    await getTopicNavContext(supabase, profile.id, profile.trailId, module_id, topic_id, "overview");

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, learning_objective, why, order_index")
    .eq("id", topic_id)
    .single();

  if (!topic) redirect(`/modulo/${module_id}`);

  const moduleNumber = mod.orderIndex;
  const topicNumber = `${moduleNumber}.${topic.order_index}`;

  return (
    <div className="flex gap-10">
      <LearnSidebar
        moduleTitle={mod.title}
        moduleNumber={moduleNumber}
        topics={topics.map((t) => ({
          id: t.id,
          orderIndex: t.orderIndex,
          title: t.title,
          status: getTopicStatus(t.id),
          hasExercise: hasExercise(t.id),
        }))}
        currentTopicId={topic_id}
        activeState="overview"
        moduleId={module_id}
      />

      <div className="min-w-0 flex-1 max-w-4xl">
        <ModuleSelector
          modules={modules.map((m) => ({ id: m.id, title: m.title, orderIndex: m.orderIndex, unlocked: m.unlocked }))}
          currentModuleId={module_id}
        />

        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground leading-snug">
            {topicNumber} — {topic.title}
          </h1>

          {topic.learning_objective && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                O que você vai aprender
              </p>
              <p className="text-base text-foreground/80 leading-relaxed">
                {topic.learning_objective}
              </p>
            </div>
          )}

          {topic.why && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Por quê?
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">{topic.why}</p>
            </div>
          )}
        </div>

        <TopicFooterNav previous={previousStepNav} next={nextStepNav} />
      </div>
    </div>
  );
}
