import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getStudentAccessData } from "./access";

type Client = SupabaseClient<Database>;

export async function getTopicNavContext(
  supabase: Client,
  userId: string,
  trailId: string,
  moduleId: string,
  topicId: string
) {
  const { modules, topicsByModule, hasExercise, getTopicStatus } = await getStudentAccessData(
    supabase,
    userId,
    trailId
  );

  const mod = modules.find((m) => m.id === moduleId);
  if (!mod || !mod.unlocked) redirect("/");

  const topics = topicsByModule.get(moduleId) ?? [];
  const topicIndex = topics.findIndex((t) => t.id === topicId);
  if (topicIndex === -1) redirect(`/modulo/${moduleId}`);

  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : null;
  const nextTopic = topicIndex < topics.length - 1 ? topics[topicIndex + 1] : null;
  const isLastTopic = topicIndex === topics.length - 1;
  const topicHasExercise = hasExercise(topicId);
  const nextTopicHref = nextTopic ? `/modulo/${moduleId}/topico/${nextTopic.id}` : "/";

  return {
    modules,
    mod,
    topics,
    topicIndex,
    previousTopic,
    nextTopic,
    isLastTopic,
    hasExercise,
    topicHasExercise,
    nextTopicHref,
    getTopicStatus,
  };
}
