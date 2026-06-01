import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function MomentoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Profile + trail
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, yearly_intention, trail_id")
    .eq("id", user.id)
    .single();

  if (!profile?.trail_id) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
      </div>
    );
  }

  // Trail name + description
  const { data: trail } = await supabase
    .from("trails")
    .select("name, description")
    .eq("id", profile.trail_id)
    .single();

  // All modules in trail, ordered
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, order_index")
    .eq("trail_id", profile.trail_id)
    .order("order_index");

  const allModules = modules ?? [];

  // Module statuses for this user
  const { data: moduleStatuses } = await supabase
    .from("user_module_status")
    .select("module_id, status")
    .eq("user_id", user.id);

  const statusMap = Object.fromEntries(
    (moduleStatuses ?? []).map((s) => [s.module_id, s.status])
  );

  // Derive active module (in_progress first, then first not_started)
  const activeModule =
    allModules.find((m) => statusMap[m.id] === "in_progress") ??
    allModules.find((m) => statusMap[m.id] === "not_started" || !statusMap[m.id]) ??
    null;

  // Progress: completed modules / total
  const completedCount = allModules.filter((m) => statusMap[m.id] === "completed").length;
  const progressPct = allModules.length > 0
    ? Math.round((completedCount / allModules.length) * 100)
    : 0;

  // Competencies for active module
  const { data: competencies } = activeModule
    ? await supabase
        .from("competencies")
        .select("id, title, description, order_index")
        .eq("module_id", activeModule.id)
        .order("order_index")
    : { data: [] };

  const activeCompetencies = competencies ?? [];

  // Deliverable submissions to derive competency status
  const { data: submissions } = await supabase
    .from("deliverable_submissions")
    .select("deliverable_id, status, deliverables(competency_id)")
    .eq("user_id", user.id)
    .in("status", ["submitted", "completed"]);

  const doneCompetencyIds = new Set(
    (submissions ?? [])
      .map((s) => (s.deliverables as { competency_id: string } | null)?.competency_id)
      .filter(Boolean) as string[]
  );

  // First non-done competency in active module = current
  const currentCompetencyId =
    activeCompetencies.find((c) => !doneCompetencyIds.has(c.id))?.id ?? null;

  function competencyStatus(id: string): "done" | "active" | "future" {
    if (doneCompetencyIds.has(id)) return "done";
    if (id === currentCompetencyId) return "active";
    return "future";
  }

  return (
    <div className="space-y-10 max-w-2xl">

      {/* Header */}
      <div>
        {profile.full_name && (
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-3">
            {profile.full_name}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-snug">
          {trail?.name ?? "Minha Trilha"}
        </h1>
        {trail?.description && (
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl">
            {trail.description}
          </p>
        )}
        {profile.yearly_intention && (
          <p className="mt-3 text-base text-foreground/80 leading-relaxed max-w-xl italic">
            "{profile.yearly_intention}"
          </p>
        )}
        {/* Progress bar */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden max-w-sm">
            <div
              className="h-full bg-foreground/60 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">{progressPct}%</span>
        </div>
      </div>

      <div className="w-full h-px bg-border" />

      {/* Module spine */}
      {allModules.length > 0 && (
        <div className="space-y-0">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
            módulos
          </p>

          {allModules.map((mod, idx) => {
            const status = statusMap[mod.id] ?? "not_started";
            const isActive = mod.id === activeModule?.id;
            const isDone = status === "completed";
            const isFuture = !isDone && !isActive;
            const isLast = idx === allModules.length - 1;

            return (
              <div key={mod.id}>
                {/* Module row */}
                <div className="flex items-center gap-3">
                  {/* Dot */}
                  <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 18 }}>
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      isDone && "bg-muted-foreground/50",
                      isActive && "bg-foreground",
                      isFuture && "border-2 border-border bg-transparent"
                    )} />
                  </div>

                  {/* Module name */}
                  {isFuture ? (
                    <Link
                      href={`/competencia?module=${mod.id}`}
                      className="flex-1 flex items-center justify-between py-1 group"
                    >
                      <span className="text-base text-muted-foreground hover:text-foreground transition-colors">
                        {String(mod.order_index).padStart(2, "0")} · {mod.title}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex-1 flex items-center justify-between py-1">
                      <span className={cn(
                        "text-base",
                        isDone && "text-muted-foreground/60",
                        isActive && "text-foreground font-medium",
                      )}>
                        {String(mod.order_index).padStart(2, "0")} · {mod.title}
                      </span>
                      {isDone && (
                        <span className="text-xs px-2.5 py-1 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 ml-3 flex-shrink-0">
                          Concluído
                        </span>
                      )}
                      {isActive && (
                        <span className="text-xs px-2.5 py-1 rounded-full border border-amber-300 text-amber-700 bg-amber-50 ml-3 flex-shrink-0">
                          Agora
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Connector line + active card */}
                {!isLast && (
                  <div className="flex gap-0" style={{ paddingLeft: 8 }}>
                    {/* Vertical line */}
                    <div className="w-px bg-border" style={{ minHeight: isActive && activeCompetencies.length > 0 ? undefined : 16 }} />

                    {/* Active module card — empty */}
                    {isActive && activeCompetencies.length === 0 && (
                      <div className="flex-1 ml-4 my-3 border border-border rounded-lg px-5 py-4">
                        <p className="text-sm text-muted-foreground/60">Conteúdo em breve.</p>
                      </div>
                    )}

                    {/* Active module card — competencies */}
                    {isActive && activeCompetencies.length > 0 && (
                      <div className="flex-1 ml-4 my-3 border border-border rounded-lg overflow-hidden">
                        {activeCompetencies.map((comp, ci) => {
                          const cStatus = competencyStatus(comp.id);
                          const isLastComp = ci === activeCompetencies.length - 1;
                          return (
                            <Link
                              key={comp.id}
                              href={`/competencia?competency=${comp.id}`}
                              className={cn(
                                "flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/50",
                                !isLastComp && "border-b border-border"
                              )}
                            >
                              {/* Hline + dot */}
                              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                                <div className="w-3 h-px bg-border" />
                                <div className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  cStatus === "done" && "bg-muted-foreground/40",
                                  cStatus === "active" && "bg-foreground",
                                  cStatus === "future" && "border-2 border-border bg-transparent"
                                )} />
                              </div>
                              {/* Body */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={cn(
                                    "text-sm font-medium leading-snug",
                                    cStatus === "done" && "text-muted-foreground/60",
                                    cStatus === "active" && "text-foreground",
                                    cStatus === "future" && "text-muted-foreground"
                                  )}>
                                    {comp.title}
                                  </p>
                                  {cStatus === "active" && (
                                    <span className="text-xs px-2 py-0.5 rounded border border-amber-300 text-amber-700 bg-amber-50 flex-shrink-0 ml-2">
                                      Atual
                                    </span>
                                  )}
                                </div>
                                {comp.description && (
                                  <p className={cn(
                                    "text-sm mt-1 leading-relaxed",
                                    cStatus === "done" && "text-muted-foreground/40",
                                    cStatus === "active" && "text-muted-foreground",
                                    cStatus === "future" && "text-muted-foreground/60"
                                  )}>
                                    {comp.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {allModules.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
        </div>
      )}
    </div>
  );
}
