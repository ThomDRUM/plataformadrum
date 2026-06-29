import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStudentAccessData } from "@/lib/student/access";
import { ModuleList, type ModuleData } from "./_components/module-list";

export default async function MentoradoDetailPage({
  params,
}: {
  params: Promise<{ user_id: string }>;
}) {
  const { user_id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mentorProjects } = await supabase
    .from("mentor_projects")
    .select("project_id")
    .eq("mentor_id", user.id);

  const projectIds = (mentorProjects ?? []).map((mp) => mp.project_id);

  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, student_type, project_id")
    .eq("id", user_id)
    .single();

  if (!student || !student.project_id || !projectIds.includes(student.project_id)) {
    redirect("/mentor/mentorados");
  }

  const typeLabel = student.student_type === "successor" ? "Sucessor" : student.student_type === "succeeded" ? "Sucedido" : null;

  if (!student.student_type) {
    return (
      <div className="max-w-3xl space-y-6">
        <Link href="/mentor/mentorados" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{student.full_name}</h1>
        <p className="text-sm text-muted-foreground/60">A jornada deste mentorado ainda não foi configurada.</p>
      </div>
    );
  }

  const { modules, topicsByModule, hasExercise, getTopicStatus } = await getStudentAccessData(
    supabase,
    student.id,
    student.student_type
  );

  const moduleIds = modules.map((m) => m.id);
  const { data: accessRows } = moduleIds.length
    ? await supabase
        .from("user_module_access")
        .select("module_id, unlock_date, force_unlocked")
        .eq("user_id", student.id)
        .in("module_id", moduleIds)
    : { data: [] };
  const accessMap = new Map((accessRows ?? []).map((a) => [a.module_id, a]));

  const allTopicIds = [...topicsByModule.values()].flat().map((t) => t.id);

  const { data: progressRows } = allTopicIds.length
    ? await supabase
        .from("user_topic_progress")
        .select("topic_id, repertoire_viewed, exercise_completed")
        .eq("user_id", student.id)
        .in("topic_id", allTopicIds)
    : { data: [] };
  const progressByTopicId = new Map((progressRows ?? []).map((p) => [p.topic_id, p]));

  const { data: exerciseRows } = allTopicIds.length
    ? await supabase
        .from("exercises")
        .select("id, topic_id, title")
        .in("topic_id", allTopicIds)
    : { data: [] };
  const exercises = exerciseRows ?? [];
  const exerciseIds = exercises.map((e) => e.id);

  const { data: questionRows } = exerciseIds.length
    ? await supabase
        .from("exercise_questions")
        .select("id, exercise_id, question_text, order_index")
        .in("exercise_id", exerciseIds)
        .order("order_index")
    : { data: [] };
  const questions = questionRows ?? [];
  const questionIds = questions.map((q) => q.id);

  const { data: answerRows } = questionIds.length
    ? await supabase
        .from("exercise_answers")
        .select("id, question_id, answer_text, submitted_at")
        .eq("user_id", student.id)
        .in("question_id", questionIds)
    : { data: [] };
  const answers = answerRows ?? [];
  const answerIds = answers.map((a) => a.id);

  const { data: noteRows } = answerIds.length
    ? await supabase
        .from("mentor_answer_notes")
        .select("id, answer_id, note")
        .eq("mentor_id", user.id)
        .in("answer_id", answerIds)
    : { data: [] };
  const notesByAnswerId = new Map((noteRows ?? []).map((n) => [n.answer_id, n.note]));
  const answersByQuestionId = new Map(answers.map((a) => [a.question_id, a]));
  const questionsByExerciseId = new Map<string, typeof questions>();
  for (const q of questions) {
    const list = questionsByExerciseId.get(q.exercise_id) ?? [];
    list.push(q);
    questionsByExerciseId.set(q.exercise_id, list);
  }
  const exerciseByTopicId = new Map(exercises.map((e) => [e.topic_id, e]));

  const moduleData: ModuleData[] = modules.map((mod) => {
    const access = accessMap.get(mod.id);
    const topics = topicsByModule.get(mod.id) ?? [];

    return {
      id: mod.id,
      title: mod.title,
      orderIndex: mod.orderIndex,
      unlocked: mod.unlocked,
      unlockDate: access?.unlock_date ?? null,
      forceUnlocked: access?.force_unlocked === true,
      topics: topics.map((topic) => {
        const exercise = exerciseByTopicId.get(topic.id);
        const exerciseQuestions = exercise ? questionsByExerciseId.get(exercise.id) ?? [] : [];
        const progress = progressByTopicId.get(topic.id);

        return {
          id: topic.id,
          title: topic.title,
          orderIndex: topic.orderIndex,
          status: getTopicStatus(topic.id),
          hasExercise: hasExercise(topic.id),
          repertoireViewed: progress?.repertoire_viewed === true,
          exerciseCompleted: progress?.exercise_completed === true,
          exercise: exercise
            ? {
                id: exercise.id,
                title: exercise.title,
                questions: exerciseQuestions.map((q) => {
                  const answer = answersByQuestionId.get(q.id);
                  return {
                    id: q.id,
                    questionText: q.question_text,
                    answerText: answer?.answer_text ?? null,
                    submittedAt: answer?.submitted_at ?? null,
                    answerId: answer?.id ?? null,
                    note: answer ? notesByAnswerId.get(answer.id) ?? "" : "",
                  };
                }),
              }
            : null,
        };
      }),
    };
  });

  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <Link href="/mentor/mentorados" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{student.full_name}</h1>
          {typeLabel && (
            <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
              {typeLabel}
            </span>
          )}
        </div>
      </div>

      <ModuleList userId={student.id} mentorId={user.id} modules={moduleData} />
    </div>
  );
}
