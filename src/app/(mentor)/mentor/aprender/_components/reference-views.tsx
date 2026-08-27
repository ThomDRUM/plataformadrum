import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { getFullReferenceTrail, type ReferenceTrailType } from "@/lib/mentor/reference-trail";
import { TrailTabs } from "./trail-tabs";
import { TrailModuleNav } from "./trail-module-nav";
import { ModuleSection } from "./module-section";
import { ReadOnlyTopicSection } from "./readonly-topic-section";

const TRAIL_LABEL: Record<ReferenceTrailType, string> = {
  successor: "Sucessor",
  succeeded: "Sucedido",
};

function trailBase(trailType: ReferenceTrailType) {
  return `/mentor/aprender/trilha-${trailType === "successor" ? "sucessor" : "sucedido"}`;
}

export async function ReferenceOverviewPage({ trailType }: { trailType: ReferenceTrailType }) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const data = await getFullReferenceTrail(supabase, trailType);
  const label = TRAIL_LABEL[trailType];
  const baseHref = trailBase(trailType);

  const navItems = data
    ? [
        { id: null, href: baseHref, label: "Visão Geral" },
        ...data.modules.map((m) => ({
          id: m.id,
          href: `${baseHref}/modulo/${m.id}`,
          label: `Módulo ${m.orderIndex} — ${m.title}`,
        })),
      ]
    : [];

  return (
    <div className="max-w-5xl">
      <TrailTabs />

      {!data ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Esta formação ainda está sendo preparada.</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-10">
          <TrailModuleNav items={navItems} currentId={null} />

          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground italic mb-6">
              Você está visualizando a formação do {label} como referência
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground leading-snug">
              {data.trail.title}
            </h1>
            {data.trail.intention && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                  Intenção
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">{data.trail.intention}</p>
              </div>
            )}
            {data.trail.why && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                  Por quê?
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.trail.why}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export async function ReferenceModulePage({
  trailType,
  moduleId,
}: {
  trailType: ReferenceTrailType;
  moduleId: string;
}) {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const data = await getFullReferenceTrail(supabase, trailType);
  const baseHref = trailBase(trailType);
  if (!data) redirect(baseHref);

  const mod = data.modules.find((m) => m.id === moduleId);
  if (!mod) redirect(baseHref);

  const navItems = [
    { id: null, href: baseHref, label: "Visão Geral", children: undefined },
    ...data.modules.map((m) => {
      const href = `${baseHref}/modulo/${m.id}`;
      return {
        id: m.id,
        href,
        label: `Módulo ${m.orderIndex} — ${m.title}`,
        children:
          m.id === moduleId
            ? m.topics
                .filter((t) => t.exercise)
                .map((t) => ({ id: `exercicio-${t.id}`, href: `${href}#exercicio-${t.id}`, label: "Exercício" }))
            : undefined,
      };
    }),
  ];

  return (
    <div className="max-w-5xl">
      <TrailTabs />

      <div className="flex flex-col md:flex-row gap-10">
        <TrailModuleNav items={navItems} currentId={moduleId} />

        <div className="min-w-0 flex-1">
          <ModuleSection
            id={`modulo-${mod.id}`}
            moduleNumber={mod.orderIndex}
            title={mod.title}
            intention={mod.intention}
            why={mod.why}
          >
            {mod.topics.map((topic) => (
              <ReadOnlyTopicSection key={topic.id} moduleNumber={mod.orderIndex} topic={topic} />
            ))}
          </ModuleSection>
        </div>
      </div>
    </div>
  );
}
