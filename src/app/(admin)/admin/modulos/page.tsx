import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listModules } from "@/lib/admin/queries";
import { PageHeader, SectionTitle, EmptyState } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ModuloForm } from "./_components/modulo-form";

export default async function ModulosPage() {
  const modules = await listModules();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Módulos"
        description="Cada módulo tem tópicos, e cada tópico tem repertório e exercício. Módulos são independentes e podem ser reaproveitados em mais de uma formação."
      />

      {modules.length === 0 ? (
        <EmptyState>Nenhum módulo criado ainda.</EmptyState>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg">
          {modules.map((mod) => (
            <li key={mod.id}>
              <Link
                href={`/admin/modulos/${mod.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{mod.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {mod.topicCount} {mod.topicCount === 1 ? "tópico" : "tópicos"}
                    {mod.trailTitles.length > 0 && ` · ${mod.trailTitles.join(", ")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {mod.trailTitles.length === 0 && (
                    <Badge variant="outline">Fora de formações</Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Separator className="my-10" />

      <SectionTitle>Novo módulo</SectionTitle>
      <ModuloForm />
    </div>
  );
}
