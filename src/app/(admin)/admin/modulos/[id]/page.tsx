import { notFound } from "next/navigation";
import { getModuleDetail } from "@/lib/admin/queries";
import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={mod.title}
        description={mod.internal_name !== mod.title ? mod.internal_name : undefined}
        backHref="/admin/modulos"
        backLabel="Módulos"
        action={<ExcluirModulo moduleId={id} name={mod.title} />}
      />

      <Tabs defaultValue="topicos">
        <TabsList>
          <TabsTrigger value="topicos">
            Tópicos
            {topics.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">{topics.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="dados">Dados do módulo</TabsTrigger>
        </TabsList>

        <TabsContent value="topicos" className="pt-6">
          <TopicosSection moduleId={id} topics={topics} />
        </TabsContent>

        <TabsContent value="dados" keepMounted className="pt-6">
          <ModuloForm
            moduleId={id}
            initial={{
              title: mod.title,
              internalName: mod.internal_name,
              intention: mod.intention,
              why: mod.why,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
