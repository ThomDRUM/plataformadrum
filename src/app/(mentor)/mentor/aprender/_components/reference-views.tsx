import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getReferenceTrail,
  getReferenceTopicMeta,
  getReferenceRepertoireItem,
  getReferenceExercise,
  type ReferenceTrailType,
} from "@/lib/mentor/reference-trail";
import { LearnSidebar, type TopicViewState } from "@/components/topic/learn-sidebar";
import { TrailTabs } from "./trail-tabs";
import { TrailModuleSelector } from "./trail-module-selector";
import { ReadOnlyRepertoireBlock } from "./readonly-repertoire-block";
import { ReadOnlyExerciseBlock } from "./readonly-exercise-block";

const TRAIL_LABEL: Record<ReferenceTrailType, string> = {
  successor: "Sucessor",
  succeeded: "Sucedido",
};

function trailBase(trailType: ReferenceTrailType) {
  return `/mentor/aprender/trilha-${trailType === "successor" ? "sucessor" : "sucedido"}`;
}

export async function ReferenceOverviewPage({ trailType }: { trailType: ReferenceTrailType }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getReferenceTrail(supabase, trailType);
  const baseHref = trailBase(trailType);
  const label = TRAIL_LABEL[trailType];

  return (
    <div className="max-w-2xl">
      <TrailTabs />
      <TrailModuleSelector
        modules={data?.modules.map((m) => ({ id: m.id, title: m.title, orderIndex: m.orderIndex })) ?? []}
        currentModuleId={null}
        baseHref={`${baseHref}/modulo`}
        overviewHref={baseHref}
      />

      {!data ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">Esta trilha ainda está sendo preparada.</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground italic mb-6">
            Você está visualizando a trilha do {label} como referência
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
      )}
    </div>
  );
}

export async function ReferenceModuleRedirectPage({
  trailType, moduleId,
}: { trailType: ReferenceTrailType; moduleId: string }) {
  const supabase = await createClient();
  const baseHref = trailBase(trailType);

  const data = await getReferenceTrail(supabase, trailType);
  const mod = data?.modules.find((m) => m.id === moduleId);
  if (!mod) redirect(baseHref);

  const firstTopic = mod.topics[0];
  if (!firstTopic) redirect(baseHref);

  redirect(`${baseHref}/modulo/${moduleId}/topico/${firstTopic.id}`);
}

async function loadReferenceNav(trailType: ReferenceTrailType, moduleId: string, topicId: string) {
  const supabase = await createClient();
  const baseHref = trailBase(trailType);

  const data = await getReferenceTrail(supabase, trailType);
  if (!data) redirect(baseHref);

  const mod = data.modules.find((m) => m.id === moduleId);
  if (!mod) redirect(baseHref);

  const topicIndex = mod.topics.findIndex((t) => t.id === topicId);
  if (topicIndex === -1) redirect(`${baseHref}/modulo/${moduleId}`);

  return {
    supabase,
    baseHref,
    modules: data.modules,
    mod,
    topics: mod.topics,
    hasExercise: (tid: string) => data.topicsWithExercise.has(tid),
  };
}

function buildSidebarProps(
  mod: { title: string; orderIndex: number },
  topics: { id: string; title: string; orderIndex: number }[],
  hasExercise: (tid: string) => boolean,
  currentTopicId: string,
  activeState: TopicViewState,
  baseHref: string,
  backHref: string
) {
  return {
    moduleTitle: mod.title,
    moduleNumber: mod.orderIndex,
    topics: topics.map((t) => ({
      id: t.id,
      orderIndex: t.orderIndex,
      title: t.title,
      status: "not_started" as const,
      hasExercise: hasExercise(t.id),
    })),
    currentTopicId,
    activeState,
    baseHref,
    backHref,
    backLabel: "Voltar à Visão Geral",
    hideStatus: true,
  };
}

export async function ReferenceTopicPage({
  trailType, moduleId, topicId,
}: { trailType: ReferenceTrailType; moduleId: string; topicId: string }) {
  const { supabase, baseHref, modules, mod, topics, hasExercise } = await loadReferenceNav(trailType, moduleId, topicId);

  const topic = await getReferenceTopicMeta(supabase, topicId);
  if (!topic) redirect(`${baseHref}/modulo/${moduleId}`);

  return (
    <div className="-mx-10 -my-10 flex min-h-screen">
      <LearnSidebar
        {...buildSidebarProps(mod, topics, hasExercise, topicId, "overview", `${baseHref}/modulo`, baseHref)}
        moduleId={moduleId}
      />

      <main className="flex-1 ml-64 px-10 py-10 max-w-2xl">
        <TrailTabs />
        <TrailModuleSelector
          modules={modules.map((m) => ({ id: m.id, title: m.title, orderIndex: m.orderIndex }))}
          currentModuleId={moduleId}
          baseHref={`${baseHref}/modulo`}
          overviewHref={baseHref}
        />

        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground leading-snug">
            {mod.orderIndex}.{topic.order_index} — {topic.title}
          </h1>

          {topic.learning_objective && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                O que você vai aprender
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{topic.learning_objective}</p>
            </div>
          )}

          {topic.why && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Por quê?
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{topic.why}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export async function ReferenceRepertoirePage({
  trailType, moduleId, topicId,
}: { trailType: ReferenceTrailType; moduleId: string; topicId: string }) {
  const { supabase, baseHref, modules, mod, topics, hasExercise } = await loadReferenceNav(trailType, moduleId, topicId);
  const item = await getReferenceRepertoireItem(supabase, topicId);

  return (
    <div className="-mx-10 -my-10 flex min-h-screen">
      <LearnSidebar
        {...buildSidebarProps(mod, topics, hasExercise, topicId, "repertorio", `${baseHref}/modulo`, baseHref)}
        moduleId={moduleId}
      />

      <main className="flex-1 ml-64 px-10 py-10 max-w-2xl">
        <TrailTabs />
        <TrailModuleSelector
          modules={modules.map((m) => ({ id: m.id, title: m.title, orderIndex: m.orderIndex }))}
          currentModuleId={moduleId}
          baseHref={`${baseHref}/modulo`}
          overviewHref={baseHref}
        />

        <ReadOnlyRepertoireBlock item={item} />
      </main>
    </div>
  );
}

export async function ReferenceExercisePage({
  trailType, moduleId, topicId,
}: { trailType: ReferenceTrailType; moduleId: string; topicId: string }) {
  const { supabase, baseHref, modules, mod, topics, hasExercise } = await loadReferenceNav(trailType, moduleId, topicId);
  const { exercise, questions } = await getReferenceExercise(supabase, topicId);

  return (
    <div className="-mx-10 -my-10 flex min-h-screen">
      <LearnSidebar
        {...buildSidebarProps(mod, topics, hasExercise, topicId, "exercicio", `${baseHref}/modulo`, baseHref)}
        moduleId={moduleId}
      />

      <main className="flex-1 ml-64 px-10 py-10 max-w-2xl">
        <TrailTabs />
        <TrailModuleSelector
          modules={modules.map((m) => ({ id: m.id, title: m.title, orderIndex: m.orderIndex }))}
          currentModuleId={moduleId}
          baseHref={`${baseHref}/modulo`}
          overviewHref={baseHref}
        />

        <ReadOnlyExerciseBlock exercise={exercise} questions={questions} />
      </main>
    </div>
  );
}
