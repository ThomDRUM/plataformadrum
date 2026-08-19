import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

/** TTL do cache de conteúdo, alinhado ao staleTimes.dynamic do next.config.ts. */
const TRAIL_CONTENT_TTL = 60;

export const trailContentTag = (trailId: string) => `trail-content:${trailId}`;

/**
 * Resolve o id de uma trilha pelo seu tipo (`mentor`, `successor`, ...).
 * Cacheado: o mapeamento tipo → id praticamente não muda, e antes custava um
 * round-trip extra em toda navegação das trilhas de referência do mentor.
 */
export function getCachedTrailIdByType(supabase: Client, trailType: string): Promise<string | null> {
  return unstable_cache(
    async () => {
      const res = await supabase.from("trails").select("id").eq("trail_type", trailType).maybeSingle();
      // Erro de infra lança para não gravar "não existe" no cache por 60s.
      if (res.error) throw res.error;
      return res.data?.id ?? null;
    },
    ["trail-id-by-type", trailType],
    { revalidate: TRAIL_CONTENT_TTL, tags: ["trail-id-by-type"] }
  )().catch(() => null);
}

export interface StudentModule {
  id: string;
  title: string;
  intention: string | null;
  why: string | null;
  orderIndex: number;
  unlocked: boolean;
  unlockDate: string | null;
}

export interface StudentTopic {
  id: string;
  moduleId: string;
  title: string;
  orderIndex: number;
}

export type TopicStatus = "not_started" | "repertoire_viewed" | "completed";

export interface StudentAccessData {
  trail: { id: string; title: string; intention: string | null; why: string | null } | null;
  modules: StudentModule[];
  topicsByModule: Map<string, StudentTopic[]>;
  hasExercise: (topicId: string) => boolean;
  getTopicStatus: (topicId: string) => TopicStatus;
  isModuleComplete: (moduleId: string) => boolean;
}

/** Conteúdo global da trilha — idêntico para todos os alunos da mesma trilha. */
export interface TrailContent {
  trail: { id: string; title: string; intention: string | null; why: string | null } | null;
  modules: { id: string; title: string; intention: string | null; why: string | null; order_index: number }[];
  topics: { id: string; module_id: string; title: string; order_index: number }[];
  exercises: { id: string; topic_id: string; title: string }[];
}

/** Progresso e liberação de módulos de um aluno — nunca cacheado. */
export interface UserProgress {
  access: { module_id: string; unlock_date: string | null; force_unlocked: boolean | null }[];
  progress: { topic_id: string; repertoire_viewed: boolean | null; exercise_completed: boolean | null }[];
}

const EMPTY_TRAIL_CONTENT: TrailContent = {
  trail: null,
  modules: [],
  topics: [],
  exercises: [],
};

const EMPTY_RESULT: StudentAccessData = {
  trail: null,
  modules: [],
  topicsByModule: new Map(),
  hasExercise: () => false,
  getTopicStatus: () => "not_started",
  isModuleComplete: () => false,
};

/**
 * Conteúdo da trilha, cacheado no servidor por {@link TRAIL_CONTENT_TTL}.
 *
 * O client Supabase entra por closure, nunca como argumento: argumentos fazem
 * parte da chave de cache, e `cookies()` não pode ser lido dentro do escopo
 * cacheado (aqui o client já foi construído fora, então isso é respeitado).
 *
 * Só entra em cache conteúdo global da trilha — igual para todos os alunos.
 * Progresso e liberação de módulos vêm de {@link getUserProgress}, sempre fresco.
 *
 * `fetchTrailContent` lança em erro do Supabase para que uma falha transitória
 * não seja gravada no cache como "trilha vazia" e repetida por 60s; nesse caso
 * caímos no estado vazio só para este render, e o próximo request tenta de novo.
 */
export async function getCachedTrailContent(supabase: Client, trailId: string): Promise<TrailContent> {
  try {
    return await unstable_cache(
      () => fetchTrailContent(supabase, trailId),
      ["trail-content", trailId],
      { revalidate: TRAIL_CONTENT_TTL, tags: [trailContentTag(trailId)] }
    )();
  } catch {
    return EMPTY_TRAIL_CONTENT;
  }
}

/**
 * Busca o conteúdo fixo de uma trilha em 3 níveis de round-trip em vez de 4
 * sequenciais: `trails` ‖ `trail_modules` → `topics` → `exercises`.
 *
 * Lança em erro de infraestrutura (rede, auth, RLS) para não poluir o cache;
 * trilha inexistente não é erro e retorna o conteúdo vazio.
 */
export async function fetchTrailContent(supabase: Client, trailId: string): Promise<TrailContent> {
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
  if (!trail) return EMPTY_TRAIL_CONTENT;

  const modules = (trailModulesRes.data ?? [])
    .filter((tm) => tm.modules !== null)
    .map((tm) => ({
      id: tm.modules!.id,
      title: tm.modules!.title,
      intention: tm.modules!.intention,
      why: tm.modules!.why,
      order_index: tm.order_index,
    }));

  const moduleIds = modules.map((m) => m.id);
  if (moduleIds.length === 0) return { trail, modules, topics: [], exercises: [] };

  const topicsRes = await supabase
    .from("topics")
    .select("id, module_id, title, order_index")
    .in("module_id", moduleIds)
    .order("order_index");

  if (topicsRes.error) throw topicsRes.error;

  const topics = topicsRes.data ?? [];
  const topicIds = topics.map((t) => t.id);
  if (topicIds.length === 0) return { trail, modules, topics, exercises: [] };

  const exercisesRes = await supabase
    .from("exercises")
    .select("id, topic_id, title")
    .in("topic_id", topicIds);

  if (exercisesRes.error) throw exercisesRes.error;
  const exercisesData = exercisesRes.data;

  return { trail, modules, topics, exercises: exercisesData ?? [] };
}

/** As duas queries por usuário, em paralelo. */
export async function getUserProgress(
  supabase: Client,
  userId: string,
  moduleIds: string[],
  topicIds: string[]
): Promise<UserProgress> {
  const [accessRes, progressRes] = await Promise.all([
    moduleIds.length
      ? supabase
          .from("user_module_access")
          .select("module_id, unlock_date, force_unlocked")
          .eq("user_id", userId)
          .in("module_id", moduleIds)
      : Promise.resolve({ data: [] }),
    topicIds.length
      ? supabase
          .from("user_topic_progress")
          .select("topic_id, repertoire_viewed, exercise_completed")
          .eq("user_id", userId)
          .in("topic_id", topicIds)
      : Promise.resolve({ data: [] }),
  ]);

  return { access: accessRes.data ?? [], progress: progressRes.data ?? [] };
}

/**
 * Monta o resultado final a partir do conteúdo da trilha + progresso do aluno.
 * Toda a regra de desbloqueio vive aqui, sem tocar no banco.
 */
export function buildStudentAccessData(
  content: TrailContent,
  { access, progress }: UserProgress
): StudentAccessData {
  const { trail, modules: allModules, topics: allTopics, exercises } = content;
  if (!trail) return EMPTY_RESULT;

  const topicsWithExercise = new Set(exercises.map((e) => e.topic_id));
  const progressMap = new Map(progress.map((p) => [p.topic_id, p]));
  const accessMap = new Map(access.map((a) => [a.module_id, a]));

  const topicsByModule = new Map<string, StudentTopic[]>();
  for (const t of allTopics) {
    const list = topicsByModule.get(t.module_id) ?? [];
    list.push({ id: t.id, moduleId: t.module_id, title: t.title, orderIndex: t.order_index });
    topicsByModule.set(t.module_id, list);
  }

  function hasExercise(topicId: string): boolean {
    return topicsWithExercise.has(topicId);
  }

  function getTopicStatus(topicId: string): TopicStatus {
    const p = progressMap.get(topicId);
    if (topicsWithExercise.has(topicId)) {
      if (p?.exercise_completed === true) return "completed";
      if (p?.repertoire_viewed === true) return "repertoire_viewed";
      return "not_started";
    }
    return p?.repertoire_viewed === true ? "completed" : "not_started";
  }

  function isModuleComplete(moduleId: string): boolean {
    const list = topicsByModule.get(moduleId) ?? [];
    if (list.length === 0) return false;
    return list.every((t) => getTopicStatus(t.id) === "completed");
  }

  const today = new Date().toISOString().slice(0, 10);

  const modulesResult: StudentModule[] = allModules.map((mod, idx) => {
    const moduleAccess = accessMap.get(mod.id);
    const previousModule = idx > 0 ? allModules[idx - 1] : null;
    const previousComplete = previousModule ? isModuleComplete(previousModule.id) : true;

    const unlocked = Boolean(
      moduleAccess && (
        moduleAccess.force_unlocked === true ||
        (moduleAccess.unlock_date !== null &&
          moduleAccess.unlock_date <= today &&
          previousComplete)
      )
    );

    return {
      id: mod.id,
      title: mod.title,
      intention: mod.intention,
      why: mod.why,
      orderIndex: mod.order_index,
      unlocked,
      unlockDate: moduleAccess?.unlock_date ?? null,
    };
  });

  return {
    trail,
    modules: modulesResult,
    topicsByModule,
    hasExercise,
    getTopicStatus,
    isModuleComplete,
  };
}

export async function getStudentAccessData(
  supabase: Client,
  userId: string,
  trailId: string
): Promise<StudentAccessData> {
  const content = await getCachedTrailContent(supabase, trailId);
  if (!content.trail) return EMPTY_RESULT;

  const userProgress = await getUserProgress(
    supabase,
    userId,
    content.modules.map((m) => m.id),
    content.topics.map((t) => t.id)
  );

  return buildStudentAccessData(content, userProgress);
}
