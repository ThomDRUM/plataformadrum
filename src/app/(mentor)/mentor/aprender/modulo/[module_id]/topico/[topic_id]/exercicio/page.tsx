import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { getMentorTopicNavContext } from "@/lib/mentor/topic-nav";
import { LearnSidebar } from "@/components/topic/learn-sidebar";
import { TrailTabs } from "@/app/(mentor)/mentor/aprender/_components/trail-tabs";
import { TrailModuleSelector } from "@/app/(mentor)/mentor/aprender/_components/trail-module-selector";
import { ExerciseBlock } from "@/components/topic/exercise-block";

const BASE_HREF = "/mentor/aprender/modulo";
const BACK_HREF = "/mentor/aprender";
const BACK_LABEL = "Voltar à Trilha Mentor";

export default async function MentorTopicExercisePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { modules, mod, topics, nextTopic, hasExercise, topicHasExercise, getTopicStatus } =
    await getMentorTopicNavContext(supabase, user.id, module_id, topic_id, BACK_HREF);

  const topicHref = `${BASE_HREF}/${module_id}/topico/${topic_id}`;
  if (!topicHasExercise) redirect(topicHref);

  const { data: exerciseRows } = await supabase
    .from("exercises")
    .select("id, title, instructions")
    .eq("topic_id", topic_id)
    .order("order_index")
    .limit(1);

  const exercise = exerciseRows?.[0] ?? null;
  if (!exercise) redirect(topicHref);

  const { data: questionRows } = await supabase
    .from("exercise_questions")
    .select("id, question_text, order_index")
    .eq("exercise_id", exercise.id)
    .order("order_index");

  const questions = questionRows ?? [];
  const questionIds = questions.map((q) => q.id);

  const { data: answerRows } = questionIds.length
    ? await supabase
        .from("exercise_answers")
        .select("id, question_id, answer_text, submitted_at")
        .eq("user_id", user.id)
        .in("question_id", questionIds)
    : { data: [] };

  const answersMap = new Map((answerRows ?? []).map((a) => [a.question_id, a]));
  const submitted = (answerRows ?? []).some((a) => a.submitted_at !== null);

  const nextTopicHref = nextTopic ? `${BASE_HREF}/${module_id}/topico/${nextTopic.id}` : BACK_HREF;

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
        activeState="exercicio"
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

        <ExerciseBlock
          userId={user.id}
          topicId={topic_id}
          exercise={exercise}
          questions={questions}
          initialAnswers={Object.fromEntries(
            [...answersMap.entries()].map(([qid, a]) => [qid, a.answer_text ?? ""])
          )}
          submittedInitial={submitted}
          nextHref={nextTopicHref}
        />
      </main>
    </div>
  );
}
