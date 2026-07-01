import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

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

const EMPTY_RESULT: StudentAccessData = {
  trail: null,
  modules: [],
  topicsByModule: new Map(),
  hasExercise: () => false,
  getTopicStatus: () => "not_started",
  isModuleComplete: () => false,
};

export async function getStudentAccessData(
  supabase: Client,
  userId: string,
  trailId: string
): Promise<StudentAccessData> {
  const { data: trail } = await supabase
    .from("trails")
    .select("id, title, intention, why")
    .eq("id", trailId)
    .single();

  if (!trail) return EMPTY_RESULT;

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

  const allTopics = topics ?? [];
  const topicIds = allTopics.map((t) => t.id);

  const { data: access } = moduleIds.length
    ? await supabase
        .from("user_module_access")
        .select("module_id, unlock_date, force_unlocked")
        .eq("user_id", userId)
        .in("module_id", moduleIds)
    : { data: [] };

  const { data: exercises } = topicIds.length
    ? await supabase.from("exercises").select("topic_id").in("topic_id", topicIds)
    : { data: [] };

  const { data: progress } = topicIds.length
    ? await supabase
        .from("user_topic_progress")
        .select("topic_id, repertoire_viewed, exercise_completed")
        .eq("user_id", userId)
        .in("topic_id", topicIds)
    : { data: [] };

  const topicsWithExercise = new Set((exercises ?? []).map((e) => e.topic_id));
  const progressMap = new Map((progress ?? []).map((p) => [p.topic_id, p]));
  const accessMap = new Map((access ?? []).map((a) => [a.module_id, a]));

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
