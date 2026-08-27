import { redirect } from "next/navigation";

export default async function MentorTopicExercisePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  redirect(`/mentor/aprender/modulo/${module_id}#exercicio-${topic_id}`);
}
