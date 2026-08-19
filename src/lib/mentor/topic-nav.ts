import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getCachedTrailIdByType, getStudentAccessData } from "@/lib/student/access";

type Client = SupabaseClient<Database>;

/**
 * Like getTopicNavContext, but for the mentor's own trail: every module is
 * treated as unlocked (no lock redirect) since mentors have no unlock gating.
 */
export async function getMentorTopicNavContext(
  supabase: Client,
  userId: string,
  moduleId: string,
  topicId: string,
  notFoundHref: string
) {
  const mentorTrailId = await getCachedTrailIdByType(supabase, "mentor");

  if (!mentorTrailId) redirect(notFoundHref);

  const { modules, topicsByModule, hasExercise, getTopicStatus } = await getStudentAccessData(
    supabase,
    userId,
    mentorTrailId
  );

  const mod = modules.find((m) => m.id === moduleId);
  if (!mod) redirect(notFoundHref);

  const topics = topicsByModule.get(moduleId) ?? [];
  const topicIndex = topics.findIndex((t) => t.id === topicId);
  if (topicIndex === -1) redirect(notFoundHref);

  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : null;
  const nextTopic = topicIndex < topics.length - 1 ? topics[topicIndex + 1] : null;
  const isLastTopic = topicIndex === topics.length - 1;
  const topicHasExercise = hasExercise(topicId);

  return {
    modules: modules.map((m) => ({ ...m, unlocked: true })),
    mod,
    topics,
    topicIndex,
    previousTopic,
    nextTopic,
    isLastTopic,
    hasExercise,
    topicHasExercise,
    getTopicStatus,
  };
}
