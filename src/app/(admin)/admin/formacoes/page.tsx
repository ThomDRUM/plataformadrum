import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listTrails } from "@/lib/admin/queries";
import { TRAIL_TYPE_LABEL } from "@/lib/admin/types";
import { PageHeader, SectionTitle, EmptyState } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FormacaoForm } from "./_components/formacao-form";

export default async function FormacoesPage() {
  const trails = await listTrails();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Formações"
        description="Cada formação é uma sequência de módulos atribuída a mentorados e mentores."
      />

      {trails.length === 0 ? (
        <EmptyState>Nenhuma formação criada ainda.</EmptyState>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg">
          {trails.map((trail) => (
            <li key={trail.id}>
              <Link
                href={`/admin/formacoes/${trail.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{trail.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {trail.moduleCount} {trail.moduleCount === 1 ? "módulo" : "módulos"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary">
                    {TRAIL_TYPE_LABEL[trail.trailType] ?? trail.trailType}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Separator className="my-10" />

      <SectionTitle>Nova formação</SectionTitle>
      <FormacaoForm />
    </div>
  );
}
