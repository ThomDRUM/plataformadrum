import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("trail_id")
    .eq("id", user.id)
    .single();

  if (!profile?.trail_id) redirect("/");

  const { modules, mod, topics, previousTopic, nextTopic, isLastTopic, hasExercise, getTopicStatus } =
    await getTopicNavContext(supabase, user.id, profile.trail_id, module_id, topic_id);

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, learning_objective, why, order_index")
    .eq("id", topic_id)
    .single();

  if (!topic) redirect(`/modulo/${module_id}`);

  const moduleNumber = mod.orderIndex;
  const topicNumber = `${moduleNumber}.${topic.order_index}`;

  return (
    <div className="-mx-10 -my-10 flex min-h-screen">
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

      <main className="flex-1 ml-64 px-10 py-10 max-w-2xl">
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
              <p className="text-sm text-foreground/80 leading-relaxed">
                {topic.learning_objective}
              </p>
            </div>
          )}

          {topic.why && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Por quê?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{topic.why}</p>
            </div>
          )}
        </div>

        <TopicFooterNav
          moduleId={module_id}
          previousTopicId={previousTopic?.id ?? null}
          nextTopicId={nextTopic?.id ?? null}
          isLastTopic={isLastTopic}
        />
      </main>
    </div>
  );
}
