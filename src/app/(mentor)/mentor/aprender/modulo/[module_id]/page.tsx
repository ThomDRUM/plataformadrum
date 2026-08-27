import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth/session";
import { getMentorTrailFullContent } from "@/lib/mentor/mentor-trail-content";
import { TrailTabs } from "../../_components/trail-tabs";
import { TrailModuleNav } from "../../_components/trail-module-nav";
import { ModuleSection } from "../../_components/module-section";
import { InteractiveTopicSection, type NextTopicTarget } from "../../_components/interactive-topic-section";

export default async function MentorTrailModulePage({
  params,
}: {
  params: Promise<{ module_id: string }>;
}) {
  const { module_id } = await params;
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const data = await getMentorTrailFullContent(supabase, user.id);
  if (!data.trail) redirect("/mentor/aprender");

  const moduleIndex = data.modules.findIndex((m) => m.id === module_id);
  if (moduleIndex === -1) redirect("/mentor/aprender");

  const mod = data.modules[moduleIndex];
  const nextModule = data.modules[moduleIndex + 1] ?? null;

  const navItems = [
    { id: null, href: "/mentor/aprender", label: "Visão Geral", children: undefined },
    ...data.modules.map((m) => {
      const href = `/mentor/aprender/modulo/${m.id}`;
      return {
        id: m.id,
        href,
        label: `Módulo ${m.orderIndex} — ${m.title}`,
        children:
          m.id === module_id
            ? m.topics
                .filter((t) => t.exercise)
                .map((t) => ({ id: `exercicio-${t.id}`, href: `${href}#exercicio-${t.id}`, label: "Exercício" }))
            : undefined,
      };
    }),
  ];

  function nextFor(topicIndex: number): NextTopicTarget {
    if (topicIndex < mod.topics.length - 1) {
      return { type: "anchor", id: `topico-${mod.topics[topicIndex + 1].id}` };
    }
    if (nextModule) {
      return { type: "page", href: `/mentor/aprender/modulo/${nextModule.id}` };
    }
    return null;
  }

  return (
    <div className="max-w-5xl">
      <TrailTabs />

      <div className="flex flex-col md:flex-row gap-10">
        <TrailModuleNav items={navItems} currentId={module_id} />

        <div className="min-w-0 flex-1">
          <ModuleSection
            id={`modulo-${mod.id}`}
            moduleNumber={mod.orderIndex}
            title={mod.title}
            intention={mod.intention}
            why={mod.why}
          >
            {mod.topics.map((topic, ti) => (
              <InteractiveTopicSection
                key={topic.id}
                userId={user.id}
                moduleNumber={mod.orderIndex}
                topic={topic}
                next={nextFor(ti)}
              />
            ))}
          </ModuleSection>
        </div>
      </div>
    </div>
  );
}
