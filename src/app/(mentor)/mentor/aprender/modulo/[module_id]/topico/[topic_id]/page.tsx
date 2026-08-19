import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { getMentorTopicNavContext } from "@/lib/mentor/topic-nav";
import { LearnSidebar } from "@/components/topic/learn-sidebar";
import { TopicFooterNav } from "@/components/topic/topic-footer-nav";
import { TrailTabs } from "@/app/(mentor)/mentor/aprender/_components/trail-tabs";
import { TrailModuleSelector } from "@/app/(mentor)/mentor/aprender/_components/trail-module-selector";

const BASE_HREF = "/mentor/aprender/modulo";
const BACK_HREF = "/mentor/aprender";
const BACK_LABEL = "Voltar à Trilha Mentor";

export default async function MentorTopicOverviewPage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { modules, mod, topics, previousTopic, nextTopic, isLastTopic, hasExercise, getTopicStatus } =
    await getMentorTopicNavContext(supabase, user.id, module_id, topic_id, BACK_HREF);

  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, learning_objective, why, order_index")
    .eq("id", topic_id)
    .single();

  if (!topic) redirect(`${BASE_HREF}/${module_id}`);

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
        baseHref={BASE_HREF}
        backHref={BACK_HREF}
        backLabel={BACK_LABEL}
      />

      <main className="flex-1 ml-64 px-10 py-10 max-w-4xl">
        <TrailTabs />
        <TrailModuleSelector
          modules={modules}
          currentModuleId={module_id}
          baseHref={BASE_HREF}
          overviewHref="/mentor/aprender"
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

        <TopicFooterNav
          moduleId={module_id}
          previousTopicId={previousTopic?.id ?? null}
          nextTopicId={nextTopic?.id ?? null}
          isLastTopic={isLastTopic}
          baseHref={BASE_HREF}
          backHref={BACK_HREF}
          backLabel={BACK_LABEL}
        />
      </main>
    </div>
  );
}
