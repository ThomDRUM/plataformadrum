import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { listUsers } from "@/lib/admin/queries";
import { ROLE_LABEL, STUDENT_TYPE_LABEL } from "@/lib/admin/types";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_ORDER = ["student", "mentor", "admin"];

export default async function UsuariosPage() {
  const users = await listUsers();

  const sorted = [...users].sort((a, b) => {
    const byRole = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    return byRole !== 0 ? byRole : a.fullName.localeCompare(b.fullName, "pt-BR");
  });

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Usuários"
        description="Mentorados, mentores e administradores da plataforma."
        action={
          <LinkButton href="/admin/usuarios/novo" size="lg">
            <Plus />
            Novo usuário
          </LinkButton>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState>Nenhum usuário cadastrado ainda.</EmptyState>
      ) : (
        <div className="border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Formação</TableHead>
                <TableHead>Família</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/usuarios/${user.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {user.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary">{ROLE_LABEL[user.role] ?? user.role}</Badge>
                      {user.studentType && (
                        <span className="text-xs text-muted-foreground">
                          {STUDENT_TYPE_LABEL[user.studentType] ?? user.studentType}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.trailTitle ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.familyName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/usuarios/${user.id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Abrir ${user.fullName}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
