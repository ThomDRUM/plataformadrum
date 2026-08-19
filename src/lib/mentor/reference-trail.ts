import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export type ReferenceTrailType = "successor" | "succeeded";

/** Trilhas de referência são conteúdo fixo — TTL alinhado ao staleTimes.dynamic. */
const REFERENCE_TTL = 60;

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

/** Forma serializável do resultado — `Set` não sobrevive ao cache, só arrays. */
interface RawReferenceTrail {
  trail: { id: string; title: string; intention: string | null; why: string | null };
  modules: ReferenceModule[];
  topicIdsWithExercise: string[];
}

async function fetchReferenceTrail(
  supabase: Client,
  trailType: ReferenceTrailType
): Promise<RawReferenceTrail | null> {
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
    topicIdsWithExercise: (exercises ?? []).map((e) => e.topic_id),
  };
}

export async function getReferenceTrail(
  supabase: Client,
  trailType: ReferenceTrailType
): Promise<ReferenceTrailData | null> {
  // Um erro de infra não deve ficar gravado no cache por 60s: em falha,
  // devolvemos null só para este render e o próximo request tenta de novo.
  const raw = await unstable_cache(
    () => fetchReferenceTrail(supabase, trailType),
    ["reference-trail", trailType],
    { revalidate: REFERENCE_TTL, tags: [`reference-trail:${trailType}`] }
  )().catch(() => null);

  if (!raw) return null;

  return {
    trail: raw.trail,
    modules: raw.modules,
    topicsWithExercise: new Set(raw.topicIdsWithExercise),
  };
}

export function getReferenceTopicMeta(supabase: Client, topicId: string) {
  return unstable_cache(
    async () => {
      const { data: topic } = await supabase
        .from("topics")
        .select("id, title, learning_objective, why, order_index")
        .eq("id", topicId)
        .single();
      return topic ?? null;
    },
    ["reference-topic-meta", topicId],
    { revalidate: REFERENCE_TTL, tags: [`topic:${topicId}`] }
  )();
}

export function getReferenceRepertoireItem(supabase: Client, topicId: string) {
  return unstable_cache(
    async () => {
      const { data: repertoireItems } = await supabase
        .from("repertoire_items")
        .select("id, title, content_type, youtube_url, content_html")
        .eq("topic_id", topicId)
        .order("order_index")
        .limit(1);
      return repertoireItems?.[0] ?? null;
    },
    ["reference-repertoire", topicId],
    { revalidate: REFERENCE_TTL, tags: [`topic:${topicId}`] }
  )();
}

export function getReferenceExercise(supabase: Client, topicId: string) {
  return unstable_cache(
    async () => {
      // Exercício + questões num único round-trip, em vez de duas queries em cadeia.
      const { data: exerciseRows } = await supabase
        .from("exercises")
        .select("id, title, instructions, exercise_questions(id, question_text, order_index)")
        .eq("topic_id", topicId)
        .order("order_index")
        .limit(1);

      const row = exerciseRows?.[0] ?? null;
      if (!row) return { exercise: null, questions: [] };

      const { exercise_questions, ...exercise } = row;
      const questions = [...(exercise_questions ?? [])].sort((a, b) => a.order_index - b.order_index);

      return { exercise, questions };
    },
    ["reference-exercise", topicId],
    { revalidate: REFERENCE_TTL, tags: [`topic:${topicId}`] }
  )();
}
