import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  updateMentorado, setModuleStatus, createAchievement,
  deleteAchievement, updateSubmissionStatus
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteButton } from "@/components/admin/delete-button";
import Link from "next/link";

export default async function MentoradoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [profileResult, trailsResult] = await Promise.all([
    supabase.from("profiles").select("*, trails(name)").eq("id", id).single(),
    supabase.from("trails").select("id, name"),
  ]);

  if (!profileResult.data) notFound();
  const profile = profileResult.data;
  const trails = trailsResult.data ?? [];

  let modules: Array<{ id: string; title: string; order_index: number }> = [];
  let moduleStatuses: Array<{ module_id: string; status: string }> = [];

  if (profile.trail_id) {
    const [mResult, sResult] = await Promise.all([
      supabase.from("modules").select("id, title, order_index").eq("trail_id", profile.trail_id).order("order_index"),
      supabase.from("user_module_status").select("module_id, status").eq("user_id", id),
    ]);
    modules = mResult.data ?? [];
    moduleStatuses = sResult.data ?? [];
  }

  const [achievementsResult, submissionsResult, deliverablesResult, competenciesResult] = await Promise.all([
    supabase.from("achievements").select("*").eq("user_id", id).order("order_index"),
    supabase.from("deliverable_submissions").select("*, deliverables(title, competency_id)").eq("user_id", id),
    supabase.from("deliverables").select("id, title"),
    supabase.from("competencies").select("id, title"),
  ]);

  const achievements = achievementsResult.data ?? [];
  const submissions = submissionsResult.data ?? [];

  const statusMap = new Map(moduleStatuses.map((s) => [s.module_id, s.status]));

  const statusOptions = ["not_started", "in_progress", "completed"] as const;
  const statusLabels = { not_started: "Não iniciado", in_progress: "Em andamento", completed: "Concluído" };

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">
          ← Mentorados
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{profile.full_name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{(profile.trails as { name: string } | null)?.name ?? "Sem trilha"}</p>
      </div>

      {/* Edit profile */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Perfil</h2>
        <form action={updateMentorado.bind(null, id)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input name="full_name" defaultValue={profile.full_name} required />
          </div>
          <div className="space-y-1.5">
            <Label>Trilha</Label>
            <select
              name="trail_id"
              defaultValue={profile.trail_id ?? ""}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Sem trilha</option>
              {trails.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Intenção anual</Label>
            <Textarea name="yearly_intention" defaultValue={profile.yearly_intention ?? ""} rows={2} />
          </div>
          <Button type="submit" size="sm">Salvar</Button>
        </form>
      </section>

      <Separator />

      {/* Module status */}
      {modules.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status dos módulos</h2>
          <div className="space-y-2">
            {modules.map((mod) => {
              const currentStatus = statusMap.get(mod.id) ?? "not_started";
              return (
                <div key={mod.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card">
                  <span className="text-sm flex-1">{mod.title}</span>
                  <div className="flex gap-1">
                    {statusOptions.map((s) => (
                      <form key={s} action={setModuleStatus.bind(null, id, mod.id, s)}>
                        <button
                          type="submit"
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            currentStatus === s
                              ? s === "completed"
                                ? "bg-primary text-primary-foreground"
                                : s === "in_progress"
                                ? "bg-amber-500 text-white"
                                : "bg-muted text-muted-foreground"
                              : "bg-transparent text-muted-foreground hover:bg-muted border border-border"
                          }`}
                        >
                          {statusLabels[s]}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Separator />

      {/* Achievements */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conquistas</h2>
        <div className="space-y-2">
          {achievements.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card">
              <span className={`text-sm flex-1 ${a.checked ? "line-through text-muted-foreground" : ""}`}>
                {a.title}
              </span>
              <DeleteButton action={deleteAchievement.bind(null, id, a.id)} />
            </div>
          ))}
        </div>
        <form action={createAchievement.bind(null, id)} className="flex gap-2">
          <Input name="title" placeholder="Nova conquista..." className="h-9 text-sm" required />
          <Button type="submit" size="sm" variant="outline">Adicionar</Button>
        </form>
      </section>

      <Separator />

      {/* Submissions review */}
      {submissions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Entregas</h2>
          <div className="space-y-3">
            {submissions.map((sub) => {
              const deliverable = sub.deliverables as { title: string } | null;
              const statusConfig = {
                draft: { label: "Rascunho", className: "border-border text-muted-foreground" },
                submitted: { label: "Enviada", className: "border-amber-300/60 text-amber-700 bg-amber-50" },
                completed: { label: "Concluída", className: "border-primary/30 text-primary bg-primary/8" },
              };
              const config = statusConfig[sub.status as keyof typeof statusConfig] ?? statusConfig.draft;

              return (
                <div key={sub.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{deliverable?.title}</span>
                    <Badge variant="outline" className={`text-xs ${config.className}`}>{config.label}</Badge>
                  </div>

                  {sub.text_content && (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {sub.text_content}
                    </p>
                  )}
                  {sub.external_link && (
                    <a href={sub.external_link} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-primary underline underline-offset-2 block">
                      {sub.external_link}
                    </a>
                  )}

                  {sub.status !== "completed" && (
                    <form action={updateSubmissionStatus.bind(null, sub.id, "completed", id)}>
                      <Button type="submit" size="sm" variant="outline">Marcar como concluída</Button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
