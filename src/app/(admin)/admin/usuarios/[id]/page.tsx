import { notFound } from "next/navigation";
import { getUserDetail, getUserModuleAccess, getUserEmail } from "@/lib/admin/queries";
import { ROLE_LABEL } from "@/lib/admin/types";
import { PageHeader } from "@/components/admin/page-header";
import { Separator } from "@/components/ui/separator";
import { PerfilForm } from "./_components/perfil-form";
import { VinculosSection } from "./_components/vinculos-section";
import { ModulosSection } from "./_components/modulos-section";
import { ExcluirUsuario } from "./_components/excluir-usuario";

export default async function UsuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const detail = await getUserDetail(id);
  if (!detail) notFound();

  const { profile, trails, families, mentorProjectIds } = detail;

  const [modules, email] = await Promise.all([
    getUserModuleAccess(id, profile.trail_id),
    getUserEmail(id),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={profile.full_name}
        description={ROLE_LABEL[profile.role] ?? profile.role}
        backHref="/admin/usuarios"
        backLabel="Usuários"
        action={<ExcluirUsuario userId={id} name={profile.full_name} />}
      />

      <div className="space-y-10">
        <PerfilForm
          userId={id}
          email={email}
          fullName={profile.full_name}
          role={profile.role}
          studentType={profile.student_type}
          yearlyIntention={profile.yearly_intention}
        />

        <Separator />

        <VinculosSection
          userId={id}
          role={profile.role}
          trailId={profile.trail_id}
          projectId={profile.project_id}
          trails={trails}
          families={families}
          mentorProjectIds={mentorProjectIds}
        />

        {profile.role !== "admin" && (
          <>
            <Separator />
            <ModulosSection
              userId={id}
              modules={modules}
              hasTrail={Boolean(profile.trail_id)}
            />
          </>
        )}
      </div>
    </div>
  );
}
