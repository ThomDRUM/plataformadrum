import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { NovaFamiliaForm } from "../_components/nova-familia-form";

export default function NovaFamiliaPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Nova família"
        description="A família e o projeto são criados juntos. Os demais dados (história, missão, árvore genealógica) são preenchidos pelo mentor."
        backHref="/admin/familias"
        backLabel="Famílias"
      />

      <NovaFamiliaForm
        className="max-w-lg"
        cancel={
          <LinkButton href="/admin/familias" variant="ghost" size="lg">
            Cancelar
          </LinkButton>
        }
      />
    </div>
  );
}
