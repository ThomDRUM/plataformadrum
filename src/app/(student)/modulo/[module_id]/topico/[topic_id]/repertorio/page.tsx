import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { getTopicNavContext } from "@/lib/student/topic-context";
import { LearnSidebar } from "@/components/topic/learn-sidebar";
import { ModuleSelector } from "@/components/topic/module-selector";
import { RepertorioView } from "./repertorio-view";

export default async function TopicRepertoirePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  const supabase = await createClient();
  const profile = await getSessionProfile();
  if (!profile?.trailId) redirect("/");

  const { modules, mod, topics, hasExercise, topicHasExercise, nextStepHref, getTopicStatus } =
    await getTopicNavContext(supabase, profile.id, profile.trailId, module_id, topic_id, "repertorio");

  const { data: repertoireItems } = await supabase
    .from("repertoire_items")
    .select("id, title, content_type, youtube_url, content_html")
    .eq("topic_id", topic_id)
    .order("order_index")
    .limit(1);

  const repertoireItem = repertoireItems?.[0] ?? null;

  return (
    <div className="flex gap-10">
      <LearnSidebar
        moduleTitle={mod.title}
        moduleNumber={mod.orderIndex}
        topics={topics.map((t) => ({
          id: t.id,
          orderIndex: t.orderIndex,
          title: t.title,
          status: getTopicStatus(t.id),
          hasExercise: hasExercise(t.id),
        }))}
        currentTopicId={topic_id}
        activeState="repertorio"
        moduleId={module_id}
      />

      <div className="min-w-0 flex-1 max-w-4xl">
        <ModuleSelector
          modules={modules.map((m) => ({ id: m.id, title: m.title, orderIndex: m.orderIndex, unlocked: m.unlocked }))}
          currentModuleId={module_id}
        />

        <RepertorioView
          userId={profile.id}
          topicId={topic_id}
          item={repertoireItem}
          hasExercise={topicHasExercise}
          nextHref={nextStepHref}
        />
      </div>
    </div>
  );
}
