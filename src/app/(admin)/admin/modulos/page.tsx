import { listModules } from "@/lib/admin/queries";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { ModulosTable } from "./_components/modulos-table";
import { NovoModuloSheet } from "./_components/novo-modulo-sheet";

export default async function ModulosPage() {
  const modules = await listModules();

  const novoModulo = <NovoModuloSheet />;

  return (
    <div>
      {/* Com a lista vazia não há toolbar para hospedar a ação, então ela volta
          para o cabeçalho — senão não haveria como criar o primeiro módulo. */}
      <PageHeader
        title="Módulos"
        description="Cada módulo tem tópicos, e cada tópico tem repertório e exercício. Módulos são independentes e podem ser reaproveitados em mais de uma formação."
        action={modules.length === 0 ? novoModulo : undefined}
      />

      {modules.length === 0 ? (
        <EmptyState>Nenhum módulo criado ainda.</EmptyState>
      ) : (
        <ModulosTable modules={modules} action={novoModulo} />
      )}
    </div>
  );
}
