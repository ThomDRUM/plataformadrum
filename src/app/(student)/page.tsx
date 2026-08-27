import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth/session";
import { getStudentAccessData } from "@/lib/student/access";
import { ModuleAccordion, type ModuleWithTopics } from "@/components/topic/module-accordion";
import { Frame, FrameHeader, FrameTitle, FramePanel } from "@/components/reui/frame";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default async function StudentHomePage() {
  const supabase = await createClient();
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  if (!profile.trailId) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground text-sm">Sua jornada ainda está sendo preparada.</p>
      </div>
    );
  }

  const { trail, modules, topicsByModule, isModuleComplete } = await getStudentAccessData(
    supabase,
    profile.id,
    profile.trailId
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
    completed: isModuleComplete(mod.id),
    topics: (topicsByModule.get(mod.id) ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      orderIndex: t.orderIndex,
    })),
  }));

  const completedCount = modules.filter((m) => isModuleComplete(m.id)).length;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-snug">
          {trail.title}
        </h1>

        {(trail.intention || trail.why) && (
          <Frame spacing="sm">
            <FrameHeader>
              <FrameTitle>Sobre a sua trilha</FrameTitle>
            </FrameHeader>
            <FramePanel className="space-y-4">
              {trail.intention && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                    Intenção
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{trail.intention}</p>
                </div>
              )}
              {trail.why && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                    Por quê?
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{trail.why}</p>
                </div>
              )}
            </FramePanel>
          </Frame>
        )}

        {modules.length > 0 && (
          <Card>
            <CardHeader>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Progresso
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground tabular-nums">
                {completedCount} de {modules.length}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  módulos concluídos
                </span>
              </p>
              <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden max-w-sm">
                <div
                  className="h-full bg-foreground/60 rounded-full transition-all"
                  style={{ width: `${Math.round((completedCount / modules.length) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
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
