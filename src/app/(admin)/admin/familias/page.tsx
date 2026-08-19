import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { listFamilies } from "@/lib/admin/queries";
import { PROJECT_STATUS_LABEL } from "@/lib/admin/types";
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

export default async function FamiliasPage() {
  const families = await listFamilies();

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Famílias"
        description="Cada família tem um projeto — é por ele que mentorados e mentores se ligam a ela."
        action={
          <LinkButton href="/admin/familias/nova" size="lg">
            <Plus />
            Nova família
          </LinkButton>
        }
      />

      {families.length === 0 ? (
        <EmptyState>Nenhuma família cadastrada ainda.</EmptyState>
      ) : (
        <div className="border border-border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Família</TableHead>
                <TableHead>Negócio</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {families.map((family) => {
                const project = family.projects[0];
                return (
                  <TableRow key={family.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/familias/${family.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {family.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {family.businessName || "—"}
                    </TableCell>
                    <TableCell>
                      {project ? (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{project.name}</span>
                          <Badge variant="secondary">
                            {PROJECT_STATUS_LABEL[project.status] ?? project.status}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-destructive text-xs">Sem projeto</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {family.memberCount}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/familias/${family.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`Abrir ${family.name}`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
