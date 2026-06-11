import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo", completed: "Concluído", paused: "Pausado",
};
const STATUS_CLASS: Record<string, string> = {
  active:    "border-emerald-300/60 text-emerald-700 bg-emerald-50",
  completed: "border-primary/30 text-primary bg-primary/8",
  paused:    "border-amber-300/60 text-amber-700 bg-amber-50",
};

export default async function ProjetosPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, start_date, end_date, families(name), mentor_projects(profiles(full_name))")
    .order("name");

  type Project = {
    id: string; name: string; status: string;
    start_date: string | null; end_date: string | null;
    families: { name: string } | null;
    mentor_projects: { profiles: { full_name: string } | null }[];
  };

  const rows = (projects ?? []) as Project[];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Projetos</h1>
        <LinkButton href="/admin/projetos/novo" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Novo projeto
        </LinkButton>
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground mb-3">Nenhum projeto ainda.</p>
          <LinkButton href="/admin/projetos/novo" size="sm" variant="outline">
            Criar primeiro projeto
          </LinkButton>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((project) => {
            const mentors = project.mentor_projects
              .map(mp => mp.profiles?.full_name)
              .filter(Boolean)
              .join(", ");

            return (
              <Link
                key={project.id}
                href={`/admin/projetos/${project.id}`}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:border-primary/25 hover:bg-accent/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {project.families?.name ?? "—"}
                    {mentors && ` · ${mentors}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className={`text-xs ${STATUS_CLASS[project.status] ?? ""}`}>
                    {STATUS_LABEL[project.status] ?? project.status}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
