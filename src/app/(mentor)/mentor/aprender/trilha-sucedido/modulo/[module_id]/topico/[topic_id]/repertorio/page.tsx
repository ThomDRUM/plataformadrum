import { ReferenceRepertoirePage } from "@/app/(mentor)/mentor/aprender/_components/reference-views";

export default async function TrilhaSucedidoRepertoirePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  return <ReferenceRepertoirePage trailType="succeeded" moduleId={module_id} topicId={topic_id} />;
}
