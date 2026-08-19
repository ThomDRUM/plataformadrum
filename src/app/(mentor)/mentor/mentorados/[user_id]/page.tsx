import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { buildStudentAccessData, getCachedTrailContent, getUserProgress } from "@/lib/student/access";
import { ModuleList, type ModuleData } from "./_components/module-list";

export default async function MentoradoDetailPage({
  params,
}: {
  params: Promise<{ user_id: string }>;
}) {
  const { user_id } = await params;
  const supabase = await createClient();
  const mentor = await getSessionProfile();
  if (!mentor) redirect("/login");

  const [mentorProjectsRes, studentRes] = await Promise.all([
    supabase.from("mentor_projects").select("project_id").eq("mentor_id", mentor.id),
    supabase
      .from("profiles")
      .select("id, full_name, student_type, project_id, trail_id")
      .eq("id", user_id)
      .single(),
  ]);

  const projectIds = (mentorProjectsRes.data ?? []).map((mp) => mp.project_id);
  const student = studentRes.data;

  if (!student || !student.project_id || !projectIds.includes(student.project_id)) {
    redirect("/mentor/mentorados");
  }

  const typeLabel = student.student_type === "successor" ? "Sucessor" : student.student_type === "succeeded" ? "Sucedido" : null;

  if (!student.trail_id) {
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

  const content = await getCachedTrailContent(supabase, student.trail_id);
  const exercises = content.exercises;
  const exerciseIds = exercises.map((e) => e.id);

  // Progresso do aluno e o bloco de questões/respostas/notas em paralelo:
  // as respostas trazem as notas do mentor aninhadas, num único round-trip.
  const [userProgress, questionsRes] = await Promise.all([
    getUserProgress(
      supabase,
      student.id,
      content.modules.map((m) => m.id),
      content.topics.map((t) => t.id)
    ),
    exerciseIds.length
      ? supabase
          .from("exercise_questions")
          .select(
            "id, exercise_id, question_text, order_index, exercise_answers(id, question_id, answer_text, submitted_at, mentor_answer_notes(answer_id, note, mentor_id))"
          )
          .in("exercise_id", exerciseIds)
          .eq("exercise_answers.user_id", student.id)
          .eq("exercise_answers.mentor_answer_notes.mentor_id", mentor.id)
          .order("order_index")
      : Promise.resolve({ data: [] }),
  ]);

  const { modules, topicsByModule, hasExercise, getTopicStatus } = buildStudentAccessData(
    content,
    userProgress
  );

  const accessMap = new Map(userProgress.access.map((a) => [a.module_id, a]));
  const progressByTopicId = new Map(userProgress.progress.map((p) => [p.topic_id, p]));

  const questions = questionsRes.data ?? [];

  const answersByQuestionId = new Map(
    questions.flatMap((q) => (q.exercise_answers ?? []).map((a) => [a.question_id, a] as const))
  );
  const notesByAnswerId = new Map(
    questions.flatMap((q) =>
      (q.exercise_answers ?? []).flatMap((a) =>
        (a.mentor_answer_notes ?? [])
          // o filtro aninhado já restringe ao mentor logado; re-checar aqui
          // garante que uma nota de outro mentor nunca vaze para a UI
          .filter((n) => n.mentor_id === mentor.id)
          .map((n) => [n.answer_id, n.note] as const)
      )
    )
  );

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

      <ModuleList userId={student.id} mentorId={mentor.id} modules={moduleData} />
    </div>
  );
}
