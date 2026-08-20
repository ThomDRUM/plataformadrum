import { listUserFormOptions, listUsers } from "@/lib/admin/queries";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { NovoUsuarioSheet } from "./_components/novo-usuario-sheet";
import { UsuariosTable } from "./_components/usuarios-table";

const ROLE_ORDER = ["student", "mentor", "admin"];

export default async function UsuariosPage() {
  const [users, formOptions] = await Promise.all([listUsers(), listUserFormOptions()]);

  const sorted = [...users].sort((a, b) => {
    const byRole = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    return byRole !== 0 ? byRole : a.fullName.localeCompare(b.fullName, "pt-BR");
  });

  const novoUsuario = (
    <NovoUsuarioSheet trails={formOptions.trails} families={formOptions.families} />
  );

  return (
    <div>
      {/* Com a lista vazia não há toolbar para hospedar a ação, então ela volta
          para o cabeçalho — senão não haveria como criar o primeiro usuário. */}
      <PageHeader
        title="Usuários"
        description="Mentorados, mentores e administradores da plataforma."
        action={sorted.length === 0 ? novoUsuario : undefined}
      />

      {sorted.length === 0 ? (
        <EmptyState>Nenhum usuário cadastrado ainda.</EmptyState>
      ) : (
        <UsuariosTable users={sorted} action={novoUsuario} />
      )}
    </div>
  );
}
