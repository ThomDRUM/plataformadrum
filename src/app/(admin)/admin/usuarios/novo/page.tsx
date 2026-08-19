import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { NovoUsuarioForm } from "./novo-usuario-form";

export default async function NovoUsuarioPage() {
  const supabase = await createClient();

  const [{ data: trails }, { data: families }] = await Promise.all([
    supabase.from("trails").select("id, title, trail_type").order("title"),
    supabase.from("families").select("id, name, projects(id)").order("name"),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Novo usuário"
        description="Cria o login e o perfil de uma só vez. A pessoa já consegue entrar com o e-mail e a senha definidos aqui."
        backHref="/admin/usuarios"
        backLabel="Usuários"
      />

      <NovoUsuarioForm
        trails={trails ?? []}
        families={(families ?? []).map((f) => ({
          id: f.id,
          name: f.name,
          projectId: (f.projects as { id: string }[] | null)?.[0]?.id ?? null,
        }))}
      />
    </div>
  );
}
