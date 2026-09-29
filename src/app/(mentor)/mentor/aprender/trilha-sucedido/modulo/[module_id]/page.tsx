import { ReferenceModulePage } from "@/app/(mentor)/mentor/aprender/_components/reference-views";

export default async function TrilhaSucedidoModulePage({
  params,
}: {
  params: Promise<{ module_id: string }>;
}) {
  const { module_id } = await params;
  return <ReferenceModulePage trailType="succeeded" moduleId={module_id} />;
}
