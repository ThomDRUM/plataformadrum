import { ReferenceExercisePage } from "@/app/(mentor)/mentor/aprender/_components/reference-views";

export default async function TrilhaSucessorExercisePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  return <ReferenceExercisePage trailType="successor" moduleId={module_id} topicId={topic_id} />;
}
