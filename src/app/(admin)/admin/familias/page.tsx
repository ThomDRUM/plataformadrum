import { listFamilies } from "@/lib/admin/queries";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { FamiliasTable } from "./_components/familias-table";
import { NovaFamiliaSheet } from "./_components/nova-familia-sheet";

export default async function FamiliasPage() {
  const families = await listFamilies();

  const novaFamilia = <NovaFamiliaSheet />;

  return (
    <div>
      {/* Com a lista vazia não há toolbar para hospedar a ação, então ela volta
          para o cabeçalho — senão não haveria como criar a primeira família. */}
      <PageHeader
        title="Famílias"
        description="Cada família tem um projeto — é por ele que mentorados e mentores se ligam a ela."
        action={families.length === 0 ? novaFamilia : undefined}
      />

      {families.length === 0 ? (
        <EmptyState>Nenhuma família cadastrada ainda.</EmptyState>
      ) : (
        <FamiliasTable families={families} action={novaFamilia} />
      )}
    </div>
  );
}
