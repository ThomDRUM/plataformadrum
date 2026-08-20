import { listTrails } from "@/lib/admin/queries";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { FormacoesTable } from "./_components/formacoes-table";
import { NovaFormacaoSheet } from "./_components/nova-formacao-sheet";

export default async function FormacoesPage() {
  const trails = await listTrails();

  const novaFormacao = <NovaFormacaoSheet />;

  return (
    <div>
      {/* Com a lista vazia não há toolbar para hospedar a ação, então ela volta
          para o cabeçalho — senão não haveria como criar a primeira formação. */}
      <PageHeader
        title="Formações"
        description="Cada formação é uma sequência de módulos atribuída a mentorados e mentores."
        action={trails.length === 0 ? novaFormacao : undefined}
      />

      {trails.length === 0 ? (
        <EmptyState>Nenhuma formação criada ainda.</EmptyState>
      ) : (
        <FormacoesTable trails={trails} action={novaFormacao} />
      )}
    </div>
  );
}
