import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { getTopicNavContext } from "@/lib/student/topic-context";
import { LearnSidebar } from "@/components/topic/learn-sidebar";
import { ModuleSelector } from "@/components/topic/module-selector";
import { ExerciseBlock } from "@/components/topic/exercise-block";

export default async function TopicExercisePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  const supabase = await createClient();
  const profile = await getSessionProfile();
  if (!profile?.trailId) redirect("/");

  const { modules, mod, topics, hasExercise, topicHasExercise, nextTopicHref, getTopicStatus } =
    await getTopicNavContext(supabase, profile.id, profile.trailId, module_id, topic_id);

  if (!topicHasExercise) redirect(`/modulo/${module_id}/topico/${topic_id}`);

  const { data: exerciseRows } = await supabase
    .from("exercises")
    .select("id, title, instructions")
    .eq("topic_id", topic_id)
    .order("order_index")
    .limit(1);

  const exercise = exerciseRows?.[0] ?? null;
  if (!exercise) redirect(`/modulo/${module_id}/topico/${topic_id}`);

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
        .eq("user_id", profile.id)
        .in("question_id", questionIds)
    : { data: [] };

  const answersMap = new Map((answerRows ?? []).map((a) => [a.question_id, a]));
  const submitted = (answerRows ?? []).some((a) => a.submitted_at !== null);

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
      />

      <main className="flex-1 ml-64 px-10 py-10 max-w-4xl">
        <ModuleSelector
          modules={modules.map((m) => ({ id: m.id, title: m.title, orderIndex: m.orderIndex, unlocked: m.unlocked }))}
          currentModuleId={module_id}
        />

        <ExerciseBlock
          userId={profile.id}
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
