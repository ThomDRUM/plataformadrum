import { requireAdmin } from "@/lib/auth/admin";
import { listAdmins } from "@/lib/admin/queries";
import { PageHeader, SectionTitle } from "@/components/admin/page-header";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdicionarAdminForm } from "./_components/adicionar-admin-form";

export default async function AdministradoresPage() {
  const [profile, admins] = await Promise.all([requireAdmin(), listAdmins()]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Administradores"
        description="Só contas com o papel de admin entram nesta área."
      />

      <AdicionarAdminForm />

      <div className="mt-10">
        <SectionTitle>Com acesso ({admins.length})</SectionTitle>

        <Frame spacing="xs">
          <FramePanel className="p-0!">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {admin.fullName}
                        {admin.id === profile.id && (
                          <Badge variant="secondary" size="sm">
                            Você
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {admin.email ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </FramePanel>
        </Frame>

        <p className="mt-3 text-xs text-muted-foreground">
          Para tirar o acesso de alguém, troque o papel da pessoa em Usuários.
        </p>
      </div>
    </div>
  );
}
