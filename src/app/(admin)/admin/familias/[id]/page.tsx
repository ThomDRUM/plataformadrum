import { notFound } from "next/navigation";
import { getFamilyDetail } from "@/lib/admin/queries";
import { PageHeader } from "@/components/admin/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DadosTab } from "./_components/dados-tab";
import { ProjetoTab } from "./_components/projeto-tab";
import { PessoasTab } from "./_components/pessoas-tab";
import { ExcluirFamilia } from "./_components/excluir-familia";

export default async function FamiliaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const detail = await getFamilyDetail(id);
  if (!detail) notFound();

  const { family, projects, students, mentorLinks, allProfiles } = detail;

  return (
    <div>
      <PageHeader
        title={family.name}
        description={family.business_name || undefined}
        backHref="/admin/familias"
        backLabel="Famílias"
        action={<ExcluirFamilia familyId={id} name={family.name} />}
      />

      <Tabs defaultValue="pessoas">
        <TabsList>
          <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
          <TabsTrigger value="projeto">Projeto</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="pessoas" className="pt-6">
          <PessoasTab
            projects={projects}
            students={students}
            mentorLinks={mentorLinks}
            allProfiles={allProfiles}
          />
        </TabsContent>

        <TabsContent value="projeto" className="pt-6">
          <ProjetoTab familyId={id} projects={projects} />
        </TabsContent>

        <TabsContent value="dados" className="pt-6">
          <DadosTab familyId={id} family={family} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
