import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMentorTopicNavContext } from "@/lib/mentor/topic-nav";
import { LearnSidebar } from "@/components/topic/learn-sidebar";
import { TrailTabs } from "@/app/(mentor)/mentor/aprender/_components/trail-tabs";
import { TrailModuleSelector } from "@/app/(mentor)/mentor/aprender/_components/trail-module-selector";
import { RepertorioView } from "./repertorio-view";

const BASE_HREF = "/mentor/aprender/modulo";
const BACK_HREF = "/mentor/aprender";
const BACK_LABEL = "Voltar à Trilha Mentor";

export default async function MentorTopicRepertoirePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { modules, mod, topics, nextTopic, hasExercise, topicHasExercise, getTopicStatus } =
    await getMentorTopicNavContext(supabase, user.id, module_id, topic_id, BACK_HREF);

  const { data: repertoireItems } = await supabase
    .from("repertoire_items")
    .select("id, title, content_type, youtube_url, content_html")
    .eq("topic_id", topic_id)
    .order("order_index")
    .limit(1);

  const repertoireItem = repertoireItems?.[0] ?? null;

  const nextTopicHref = nextTopic ? `${BASE_HREF}/${module_id}/topico/${nextTopic.id}` : BACK_HREF;
  const nextHref = topicHasExercise
    ? `${BASE_HREF}/${module_id}/topico/${topic_id}/exercicio`
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
        baseHref={BASE_HREF}
        backHref={BACK_HREF}
        backLabel={BACK_LABEL}
      />

      <main className="flex-1 ml-64 px-10 py-10 max-w-2xl">
        <TrailTabs />
        <TrailModuleSelector
          modules={modules}
          currentModuleId={module_id}
          baseHref={BASE_HREF}
          overviewHref="/mentor/aprender"
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
