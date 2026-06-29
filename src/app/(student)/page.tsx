import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentAccessData } from "@/lib/student/access";
import { ModuleAccordion, type ModuleWithTopics } from "@/components/topic/module-accordion";

export default async function StudentHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("student_type")
    .eq("id", user.id)
    .single();

  if (!profile?.student_type) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
      </div>
    );
  }

  const { trail, modules, topicsByModule, isModuleComplete } = await getStudentAccessData(
    supabase,
    user.id,
    profile.student_type
  );

  if (!trail) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
      </div>
    );
  }

  const modulesWithTopics: ModuleWithTopics[] = modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    intention: mod.intention,
    why: mod.why,
    orderIndex: mod.orderIndex,
    unlocked: mod.unlocked,
    unlockDate: mod.unlockDate,
    topics: (topicsByModule.get(mod.id) ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      orderIndex: t.orderIndex,
    })),
  }));

  const completedCount = modules.filter((m) => isModuleComplete(m.id)).length;

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-snug">
          {trail.title}
        </h1>
        {trail.intention && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
              Intenção
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{trail.intention}</p>
          </div>
        )}
        {trail.why && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
              Por quê?
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{trail.why}</p>
          </div>
        )}

        {modules.length > 0 && (
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden max-w-sm">
              <div
                className="h-full bg-foreground/60 rounded-full transition-all"
                style={{ width: `${Math.round((completedCount / modules.length) * 100)}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
              {completedCount} de {modules.length} módulos concluídos
            </span>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-border" />

      {modulesWithTopics.length > 0 ? (
        <ModuleAccordion modules={modulesWithTopics} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
        </div>
      )}
    </div>
  );
}
