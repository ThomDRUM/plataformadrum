import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Plus, ChevronRight } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();

  const [profilesResult, trailsResult, statusResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, trail_id, yearly_intention, trails(name)")
      .eq("role", "student")
      .order("full_name"),
    supabase.from("trails").select("id, name"),
    supabase.from("user_module_status").select("user_id, status"),
  ]);

  const profiles = profilesResult.data ?? [];
  const trails = trailsResult.data ?? [];
  const statuses = statusResult.data ?? [];

  function getProgress(userId: string) {
    const userStatuses = statuses.filter((s) => s.user_id === userId);
    const completed = userStatuses.filter((s) => s.status === "completed").length;
    const inProgress = userStatuses.filter((s) => s.status === "in_progress").length;
    return { completed, inProgress, total: userStatuses.length };
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Mentorados</h1>
        <LinkButton href="/admin/mentorados/novo" size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Novo mentorado
        </LinkButton>
      </div>

      {profiles.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground mb-3">Nenhum mentorado ainda.</p>
          <LinkButton href="/admin/mentorados/novo" size="sm" variant="outline">
            Criar primeiro mentorado
          </LinkButton>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => {
            const progress = getProgress(profile.id);
            const trail = profile.trails as { name: string } | null;

            return (
              <Link
                key={profile.id}
                href={`/admin/mentorados/${profile.id}`}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card hover:border-primary/25 hover:bg-accent/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {trail ? trail.name : "Sem trilha"}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {progress.inProgress > 0 && (
                    <Badge variant="outline" className="text-xs border-amber-300/60 text-amber-700 bg-amber-50">
                      {progress.inProgress} em andamento
                    </Badge>
                  )}
                  {progress.completed > 0 && (
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/8">
                      {progress.completed} concluídos
                    </Badge>
                  )}
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
