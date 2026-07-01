import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("trail_id")
    .eq("id", user.id)
    .single();

  if (!profile?.trail_id) redirect("/");

  const { modules, mod, topics, hasExercise, topicHasExercise, nextTopicHref, getTopicStatus } =
    await getTopicNavContext(supabase, user.id, profile.trail_id, module_id, topic_id);

  const { data: repertoireItems } = await supabase
    .from("repertoire_items")
    .select("id, title, content_type, youtube_url, content_html")
    .eq("topic_id", topic_id)
    .order("order_index")
    .limit(1);

  const repertoireItem = repertoireItems?.[0] ?? null;

  const nextHref = topicHasExercise
    ? `/modulo/${module_id}/topico/${topic_id}/exercicio`
    : nextTopicHref;

  return (
    <div className="-mx-10 -my-10 flex min-h-screen">
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

      <main className="flex-1 ml-64 px-10 py-10 max-w-2xl">
        <ModuleSelector
          modules={modules.map((m) => ({ id: m.id, title: m.title, orderIndex: m.orderIndex, unlocked: m.unlocked }))}
          currentModuleId={module_id}
        />

        <RepertorioView
          userId={user.id}
          topicId={topic_id}
          item={repertoireItem}
          hasExercise={topicHasExercise}
          nextHref={nextHref}
        />
      </main>
    </div>
  );
}
