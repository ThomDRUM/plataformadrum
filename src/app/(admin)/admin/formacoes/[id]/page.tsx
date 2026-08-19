import { notFound } from "next/navigation";
import { getTrailDetail } from "@/lib/admin/queries";
import { TRAIL_TYPE_LABEL } from "@/lib/admin/types";
import { PageHeader, SectionTitle } from "@/components/admin/page-header";
import { Separator } from "@/components/ui/separator";
import { FormacaoForm } from "../_components/formacao-form";
import { ModulosDaFormacao } from "./_components/modulos-da-formacao";
import { ExcluirFormacao } from "./_components/excluir-formacao";

export default async function FormacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const detail = await getTrailDetail(id);
  if (!detail) notFound();

  const { trail, modules, allModules } = detail;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={trail.title}
        description={TRAIL_TYPE_LABEL[trail.trail_type] ?? trail.trail_type}
        backHref="/admin/formacoes"
        backLabel="Formações"
        action={<ExcluirFormacao trailId={id} name={trail.title} />}
      />

      <ModulosDaFormacao trailId={id} modules={modules} allModules={allModules} />

      <Separator className="my-10" />

      <SectionTitle>Dados da formação</SectionTitle>
      <FormacaoForm trailId={id} initial={trail} />
    </div>
  );
}
