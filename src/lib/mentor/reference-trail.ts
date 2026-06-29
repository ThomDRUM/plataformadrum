import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export type ReferenceTrailType = "successor" | "succeeded";

export interface ReferenceModule {
  id: string;
  title: string;
  intention: string | null;
  why: string | null;
  orderIndex: number;
  topics: { id: string; title: string; orderIndex: number }[];
}

export interface ReferenceTrailData {
  trail: { id: string; title: string; intention: string | null; why: string | null };
  modules: ReferenceModule[];
  topicsWithExercise: Set<string>;
}

export async function getReferenceTrail(
  supabase: Client,
  trailType: ReferenceTrailType
): Promise<ReferenceTrailData | null> {
  const { data: trail } = await supabase
    .from("trails")
    .select("id, title, intention, why")
    .eq("trail_type", trailType)
    .single();

  if (!trail) return null;

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, intention, why, order_index")
    .eq("trail_id", trail.id)
    .order("order_index");

  const allModules = modules ?? [];
  const moduleIds = allModules.map((m) => m.id);

  const { data: topics } = moduleIds.length
    ? await supabase
        .from("topics")
        .select("id, module_id, title, order_index")
        .in("module_id", moduleIds)
        .order("order_index")
    : { data: [] };

  const topicsByModule = new Map<string, { id: string; title: string; orderIndex: number }[]>();
  for (const t of topics ?? []) {
    const list = topicsByModule.get(t.module_id) ?? [];
    list.push({ id: t.id, title: t.title, orderIndex: t.order_index });
    topicsByModule.set(t.module_id, list);
  }

  const allTopics = topics ?? [];
  const topicIds = allTopics.map((t) => t.id);

  const { data: exercises } = topicIds.length
    ? await supabase.from("exercises").select("topic_id").in("topic_id", topicIds)
    : { data: [] };

  const topicsWithExercise = new Set((exercises ?? []).map((e) => e.topic_id));

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
    topicsWithExercise,
  };
}

export async function getReferenceTopicMeta(supabase: Client, topicId: string) {
  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, learning_objective, why, order_index")
    .eq("id", topicId)
    .single();
  return topic ?? null;
}

export async function getReferenceRepertoireItem(supabase: Client, topicId: string) {
  const { data: repertoireItems } = await supabase
    .from("repertoire_items")
    .select("id, title, content_type, youtube_url, content_html")
    .eq("topic_id", topicId)
    .order("order_index")
    .limit(1);
  return repertoireItems?.[0] ?? null;
}

export async function getReferenceExercise(supabase: Client, topicId: string) {
  const { data: exerciseRows } = await supabase
    .from("exercises")
    .select("id, title, instructions")
    .eq("topic_id", topicId)
    .order("order_index")
    .limit(1);
  const exercise = exerciseRows?.[0] ?? null;

  const { data: questionRows } = exercise
    ? await supabase
        .from("exercise_questions")
        .select("id, question_text, order_index")
        .eq("exercise_id", exercise.id)
        .order("order_index")
    : { data: [] };

  return { exercise, questions: questionRows ?? [] };
}
