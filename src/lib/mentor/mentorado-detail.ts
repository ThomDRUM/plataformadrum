import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { buildStudentAccessData, getCachedTrailContent, getUserProgress, type TopicStatus } from "@/lib/student/access";

type Client = SupabaseClient<Database>;

export interface MentoradoQuestionDetail {
  id: string;
  questionText: string;
  answerText: string | null;
  submittedAt: string | null;
  answerId: string | null;
  note: string;
}

export interface MentoradoTopicDetail {
  id: string;
  title: string;
  orderIndex: number;
  status: TopicStatus;
  hasExercise: boolean;
  repertoireViewed: boolean;
  exerciseCompleted: boolean;
  exercise: { id: string; title: string; questions: MentoradoQuestionDetail[] } | null;
}

export interface MentoradoModuleDetail {
  id: string;
  title: string;
  orderIndex: number;
  unlocked: boolean;
  unlockDate: string | null;
  forceUnlocked: boolean;
  topics: MentoradoTopicDetail[];
}

export interface MentoradoDetail {
  id: string;
  fullName: string;
  studentType: string | null;
  hasTrail: boolean;
  modules: MentoradoModuleDetail[];
}

/**
 * Carrega o detalhe completo de um mentorado (módulos, tópicos, exercícios e
 * notas do mentor). Retorna `null` quando `mentorId` não atende o projeto do
 * aluno — quem chama trata isso como "não encontrado", não como erro.
 */
export async function getMentoradoDetail(
  supabase: Client,
  mentorId: string,
  userId: string
): Promise<MentoradoDetail | null> {
  const [mentorProjectsRes, studentRes] = await Promise.all([
    supabase.from("mentor_projects").select("project_id").eq("mentor_id", mentorId),
    supabase
      .from("profiles")
      .select("id, full_name, student_type, project_id, trail_id")
      .eq("id", userId)
      .single(),
  ]);

  const projectIds = (mentorProjectsRes.data ?? []).map((mp) => mp.project_id);
  const student = studentRes.data;

  if (!student || !student.project_id || !projectIds.includes(student.project_id)) {
    return null;
  }

  if (!student.trail_id) {
    return {
      id: student.id,
      fullName: student.full_name,
      studentType: student.student_type,
      hasTrail: false,
      modules: [],
    };
  }

  const content = await getCachedTrailContent(supabase, student.trail_id);
  const exercises = content.exercises;
  const exerciseIds = exercises.map((e) => e.id);

  // Progresso do aluno e o bloco de questões/respostas/notas em paralelo: as
  // respostas trazem as notas do mentor aninhadas, num único round-trip.
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
          .eq("exercise_answers.mentor_answer_notes.mentor_id", mentorId)
          .order("order_index")
      : Promise.resolve({ data: [] }),
  ]);

  const { modules, topicsByModule, hasExercise, getTopicStatus } = buildStudentAccessData(content, userProgress);

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
          .filter((n) => n.mentor_id === mentorId)
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

  const modulesDetail: MentoradoModuleDetail[] = modules.map((mod) => {
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

  return {
    id: student.id,
    fullName: student.full_name,
    studentType: student.student_type,
    hasTrail: true,
    modules: modulesDetail,
  };
}
