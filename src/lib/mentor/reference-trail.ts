import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { RepertoireItemData } from "@/components/topic/repertoire-block";
import type { ExerciseData, QuestionData } from "@/components/topic/exercise-block";

type Client = SupabaseClient<Database>;

export type ReferenceTrailType = "successor" | "succeeded";

/** Trilhas de referência são conteúdo fixo — TTL alinhado ao staleTimes.dynamic. */
const REFERENCE_TTL = 60;

export interface ReferenceTopicFull {
  id: string;
  title: string;
  orderIndex: number;
  learningObjective: string | null;
  why: string | null;
  repertoireItem: RepertoireItemData | null;
  exercise: (ExerciseData & { questions: QuestionData[] }) | null;
}

export interface ReferenceModuleFull {
  id: string;
  title: string;
  intention: string | null;
  why: string | null;
  orderIndex: number;
  topics: ReferenceTopicFull[];
}

export interface FullReferenceTrailData {
  trail: { id: string; title: string; intention: string | null; why: string | null };
  modules: ReferenceModuleFull[];
}

async function fetchFullReferenceTrail(
  supabase: Client,
  trailType: ReferenceTrailType
): Promise<FullReferenceTrailData | null> {
  const trailsRes = await supabase
    .from("trails")
    .select("id, title, intention, why")
    .eq("trail_type", trailType)
    .limit(1);

  if (trailsRes.error) throw trailsRes.error;

  const trail = trailsRes.data?.[0] ?? null;
  if (!trail) return null;

  const trailModulesRes = await supabase
    .from("trail_modules")
    .select("order_index, modules(id, title, intention, why)")
    .eq("trail_id", trail.id)
    .order("order_index");

  if (trailModulesRes.error) throw trailModulesRes.error;

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

  const { data: topics } = moduleIds.length
    ? await supabase
        .from("topics")
        .select("id, module_id, title, order_index, learning_objective, why")
        .in("module_id", moduleIds)
        .order("order_index")
    : { data: [] };

  const allTopics = topics ?? [];
  const topicIds = allTopics.map((t) => t.id);

  const [{ data: repertoireRows }, { data: exerciseRows }] = topicIds.length
    ? await Promise.all([
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
      ])
    : [{ data: [] }, { data: [] }];

  const repertoireByTopic = new Map<string, RepertoireItemData>();
  for (const r of repertoireRows ?? []) {
    if (!repertoireByTopic.has(r.topic_id)) repertoireByTopic.set(r.topic_id, r);
  }

  const exerciseByTopic = new Map<string, ExerciseData & { questions: QuestionData[] }>();
  for (const row of exerciseRows ?? []) {
    if (exerciseByTopic.has(row.topic_id)) continue;
    const questions = [...(row.exercise_questions ?? [])].sort((a, b) => a.order_index - b.order_index);
    exerciseByTopic.set(row.topic_id, {
      id: row.id,
      title: row.title,
      instructions: row.instructions,
      questions,
    });
  }

  const topicsByModule = new Map<string, ReferenceTopicFull[]>();
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
    modules: allModules.map((m) => ({
      id: m.id,
      title: m.title,
      intention: m.intention,
      why: m.why,
      orderIndex: m.order_index,
      topics: topicsByModule.get(m.id) ?? [],
    })),
  };
}

export async function getFullReferenceTrail(
  supabase: Client,
  trailType: ReferenceTrailType
): Promise<FullReferenceTrailData | null> {
  // Um erro de infra não deve ficar gravado no cache por 60s: em falha,
  // devolvemos null só para este render e o próximo request tenta de novo.
  return unstable_cache(
    () => fetchFullReferenceTrail(supabase, trailType),
    ["reference-trail-full", trailType],
    { revalidate: REFERENCE_TTL, tags: [`reference-trail:${trailType}`] }
  )().catch(() => null);
}
