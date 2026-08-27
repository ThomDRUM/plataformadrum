import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getCachedTrailIdByType, trailContentTag } from "@/lib/student/access";
import type { RepertoireItemData } from "@/components/topic/repertoire-block";
import type { ExerciseData, QuestionData } from "@/components/topic/exercise-block";

type Client = SupabaseClient<Database>;

/** Conteúdo pedagógico, alinhado ao TTL de `trail-content` em lib/student/access.ts. */
const CONTENT_TTL = 60;

interface MentorTopicContent {
  id: string;
  title: string;
  orderIndex: number;
  learningObjective: string | null;
  why: string | null;
  repertoireItem: RepertoireItemData | null;
  exercise: (ExerciseData & { questions: QuestionData[] }) | null;
}

interface MentorModuleContent {
  id: string;
  title: string;
  intention: string | null;
  why: string | null;
  orderIndex: number;
  topics: MentorTopicContent[];
}

interface MentorTrailContent {
  trail: { id: string; title: string; intention: string | null; why: string | null } | null;
  modules: MentorModuleContent[];
}

export interface MentorTopicFull extends MentorTopicContent {
  repertoireViewed: boolean;
  exercise: (ExerciseData & { questions: QuestionData[]; answers: Record<string, string>; submitted: boolean }) | null;
}

export interface MentorModuleFull {
  id: string;
  title: string;
  intention: string | null;
  why: string | null;
  orderIndex: number;
  topics: MentorTopicFull[];
}

export interface MentorTrailFullData {
  trail: { id: string; title: string; intention: string | null; why: string | null } | null;
  modules: MentorModuleFull[];
}

const EMPTY_CONTENT: MentorTrailContent = { trail: null, modules: [] };

/** Mesmo formato de `fetchFullReferenceTrail` em lib/mentor/reference-trail.ts, para a trilha real do mentor. */
async function fetchMentorTrailContent(supabase: Client, trailId: string): Promise<MentorTrailContent> {
  const [trailRes, trailModulesRes] = await Promise.all([
    supabase.from("trails").select("id, title, intention, why").eq("id", trailId).maybeSingle(),
    supabase
      .from("trail_modules")
      .select("order_index, modules(id, title, intention, why)")
      .eq("trail_id", trailId)
      .order("order_index"),
  ]);

  if (trailRes.error) throw trailRes.error;
  if (trailModulesRes.error) throw trailModulesRes.error;

  const trail = trailRes.data;
  if (!trail) return EMPTY_CONTENT;

  const allModules = (trailModulesRes.data ?? [])
    .filter((tm) => tm.modules !== null)
    .map((tm) => ({
      id: tm.modules!.id,
      title: tm.modules!.title,
      intention: tm.modules!.intention,
      why: tm.modules!.why,
      order_index: tm.order_index,
    }));
  const moduleIds = allModules.map((m) => m.id);
  if (moduleIds.length === 0) return { trail, modules: [] };

  const topicsRes = await supabase
    .from("topics")
    .select("id, module_id, title, order_index, learning_objective, why")
    .in("module_id", moduleIds)
    .order("order_index");

  if (topicsRes.error) throw topicsRes.error;

  const allTopics = topicsRes.data ?? [];
  const topicIds = allTopics.map((t) => t.id);
  if (topicIds.length === 0) {
    return { trail, modules: allModules.map((m) => ({ ...toModuleShape(m), topics: [] })) };
  }

  const [repertoireRes, exercisesRes] = await Promise.all([
    supabase
      .from("repertoire_items")
      .select("id, topic_id, title, content_type, youtube_url, content_html")
      .in("topic_id", topicIds)
      .order("order_index"),
    supabase
      .from("exercises")
      .select("id, topic_id, title, instructions, exercise_questions(id, question_text, order_index)")
      .in("topic_id", topicIds)
      .order("order_index"),
  ]);

  if (repertoireRes.error) throw repertoireRes.error;
  if (exercisesRes.error) throw exercisesRes.error;

  const repertoireByTopic = new Map<string, RepertoireItemData>();
  for (const r of repertoireRes.data ?? []) {
    if (!repertoireByTopic.has(r.topic_id)) repertoireByTopic.set(r.topic_id, r);
  }

  const exerciseByTopic = new Map<string, ExerciseData & { questions: QuestionData[] }>();
  for (const row of exercisesRes.data ?? []) {
    if (exerciseByTopic.has(row.topic_id)) continue;
    const questions = [...(row.exercise_questions ?? [])].sort((a, b) => a.order_index - b.order_index);
    exerciseByTopic.set(row.topic_id, {
      id: row.id,
      title: row.title,
      instructions: row.instructions,
      questions,
    });
  }

  const topicsByModule = new Map<string, MentorTopicContent[]>();
  for (const t of allTopics) {
    const list = topicsByModule.get(t.module_id) ?? [];
    list.push({
      id: t.id,
      title: t.title,
      orderIndex: t.order_index,
      learningObjective: t.learning_objective,
      why: t.why,
      repertoireItem: repertoireByTopic.get(t.id) ?? null,
      exercise: exerciseByTopic.get(t.id) ?? null,
    });
    topicsByModule.set(t.module_id, list);
  }

  return {
    trail,
    modules: allModules.map((m) => ({ ...toModuleShape(m), topics: topicsByModule.get(m.id) ?? [] })),
  };
}

function toModuleShape(m: { id: string; title: string; intention: string | null; why: string | null; order_index: number }) {
  return { id: m.id, title: m.title, intention: m.intention, why: m.why, orderIndex: m.order_index };
}

async function getCachedMentorTrailContent(supabase: Client, trailId: string): Promise<MentorTrailContent> {
  try {
    return await unstable_cache(
      () => fetchMentorTrailContent(supabase, trailId),
      ["mentor-trail-full-content", trailId],
      { revalidate: CONTENT_TTL, tags: [trailContentTag(trailId)] }
    )();
  } catch {
    return EMPTY_CONTENT;
  }
}

/**
 * Conteúdo completo da trilha do mentor (todos os módulos/tópicos com
 * repertório e exercício) + progresso do usuário, para a página única com
 * scrollspy. Sem gating de módulo: a navegação da trilha do mentor já trata
 * todo módulo como liberado (ver TrailModuleSelector).
 */
export async function getMentorTrailFullContent(supabase: Client, userId: string): Promise<MentorTrailFullData> {
  const trailId = await getCachedTrailIdByType(supabase, "mentor");
  if (!trailId) return { trail: null, modules: [] };

  const content = await getCachedMentorTrailContent(supabase, trailId);
  if (!content.trail) return { trail: null, modules: [] };

  const topicIds = content.modules.flatMap((m) => m.topics.map((t) => t.id));
  const questionIds = content.modules.flatMap((m) =>
    m.topics.flatMap((t) => t.exercise?.questions.map((q) => q.id) ?? [])
  );

  const [progressRes, answersRes] = await Promise.all([
    topicIds.length
      ? supabase
          .from("user_topic_progress")
          .select("topic_id, repertoire_viewed")
          .eq("user_id", userId)
          .in("topic_id", topicIds)
      : Promise.resolve({ data: [] }),
    questionIds.length
      ? supabase
          .from("exercise_answers")
          .select("question_id, answer_text, submitted_at")
          .eq("user_id", userId)
          .in("question_id", questionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const viewedTopics = new Set(
    (progressRes.data ?? []).filter((p) => p.repertoire_viewed === true).map((p) => p.topic_id)
  );
  const answersByQuestion = new Map((answersRes.data ?? []).map((a) => [a.question_id, a]));

  return {
    trail: content.trail,
    modules: content.modules.map((mod) => ({
      ...mod,
      topics: mod.topics.map((topic) => ({
        ...topic,
        repertoireViewed: viewedTopics.has(topic.id),
        exercise: topic.exercise
          ? {
              ...topic.exercise,
              answers: Object.fromEntries(
                topic.exercise.questions.map((q) => [q.id, answersByQuestion.get(q.id)?.answer_text ?? ""])
              ),
              submitted: topic.exercise.questions.some(
                (q) => answersByQuestion.get(q.id)?.submitted_at != null
              ),
            }
          : null,
      })),
    })),
  };
}
