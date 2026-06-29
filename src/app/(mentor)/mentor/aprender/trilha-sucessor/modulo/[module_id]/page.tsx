import { ReferenceModuleRedirectPage } from "@/app/(mentor)/mentor/aprender/_components/reference-views";

export default async function TrilhaSucessorModulePage({
  params,
}: {
  params: Promise<{ module_id: string }>;
}) {
  const { module_id } = await params;
  await ReferenceModuleRedirectPage({ trailType: "successor", moduleId: module_id });
}
