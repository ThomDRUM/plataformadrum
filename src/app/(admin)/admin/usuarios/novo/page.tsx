import { listUserFormOptions } from "@/lib/admin/queries";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { NovoUsuarioForm } from "../_components/novo-usuario-form";

export default async function NovoUsuarioPage() {
  const { trails, families } = await listUserFormOptions();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Novo usuário"
        description="Cria o login e o perfil de uma só vez. A pessoa já consegue entrar com o e-mail e a senha definidos aqui."
        backHref="/admin/usuarios"
        backLabel="Usuários"
      />

      <NovoUsuarioForm
        trails={trails}
        families={families}
        className="max-w-lg"
        cancel={
          <LinkButton href="/admin/usuarios" variant="ghost" size="lg">
            Cancelar
          </LinkButton>
        }
      />
    </div>
  );
}
