import { redirect } from "next/navigation";

export default async function MentorTopicRepertoirePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  redirect(`/mentor/aprender/modulo/${module_id}#topico-${topic_id}`);
}
