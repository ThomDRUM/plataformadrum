import { notFound } from "next/navigation";
import { getModuleDetail } from "@/lib/admin/queries";
import { PageHeader, SectionTitle } from "@/components/admin/page-header";
import { Separator } from "@/components/ui/separator";
import { ModuloForm } from "../_components/modulo-form";
import { TopicosSection } from "./_components/topicos-section";
import { ExcluirModulo } from "./_components/excluir-modulo";

export default async function ModuloDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const detail = await getModuleDetail(id);
  if (!detail) notFound();

  const { module: mod, topics } = detail;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={mod.title}
        description={mod.internal_name !== mod.title ? mod.internal_name : undefined}
        backHref="/admin/modulos"
        backLabel="Módulos"
        action={<ExcluirModulo moduleId={id} name={mod.title} />}
      />

      <TopicosSection moduleId={id} topics={topics} />

      <Separator className="my-10" />

      <SectionTitle>Dados do módulo</SectionTitle>
      <ModuloForm moduleId={id} initial={mod} />
    </div>
  );
}
