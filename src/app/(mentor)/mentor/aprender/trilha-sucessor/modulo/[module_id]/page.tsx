import { ReferenceModulePage } from "@/app/(mentor)/mentor/aprender/_components/reference-views";

export default async function TrilhaSucessorModulePage({
  params,
}: {
  params: Promise<{ module_id: string }>;
}) {
  const { module_id } = await params;
  return <ReferenceModulePage trailType="successor" moduleId={module_id} />;
}
