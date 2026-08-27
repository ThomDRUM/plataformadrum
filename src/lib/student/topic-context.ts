import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getStudentAccessData, type StudentTopic } from "./access";

type Client = SupabaseClient<Database>;

/** Etapas que um tópico expõe, na ordem em que o aluno as percorre. */
export type TopicStepKind = "overview" | "repertorio" | "exercicio";

export interface ModuleFlowStep {
  topicId: string;
  kind: TopicStepKind;
  href: string;
}

export interface StepNav {
  href: string;
  label: string;
}

/**
 * Sequência linear de leitura do módulo: cada tópico contribui com sua
 * abertura, seu repertório e — quando existe — seu exercício, antes de o
 * fluxo passar ao tópico seguinte.
 */
export function buildModuleFlow(
  moduleId: string,
  topics: StudentTopic[],
  hasExercise: (topicId: string) => boolean,
  baseHref = "/modulo"
): ModuleFlowStep[] {
  const steps: ModuleFlowStep[] = [];

  for (const t of topics) {
    const topicHref = `${baseHref}/${moduleId}/topico/${t.id}`;
    steps.push({ topicId: t.id, kind: "overview", href: topicHref });
    steps.push({ topicId: t.id, kind: "repertorio", href: `${topicHref}/repertorio` });
    if (hasExercise(t.id)) {
      steps.push({ topicId: t.id, kind: "exercicio", href: `${topicHref}/exercicio` });
    }
  }

  return steps;
}

function stepNav(step: ModuleFlowStep | null, direction: "previous" | "next"): StepNav | null {
  if (!step) return null;
  if (step.kind === "repertorio") return { href: step.href, label: "Repertório" };
  if (step.kind === "exercicio") return { href: step.href, label: "Exercício" };
  return { href: step.href, label: direction === "next" ? "Próximo tópico" : "Tópico anterior" };
}

export async function getTopicNavContext(
  supabase: Client,
  userId: string,
  trailId: string,
  moduleId: string,
  topicId: string,
  step: TopicStepKind = "overview"
) {
  const { modules, topicsByModule, hasExercise, getTopicStatus } = await getStudentAccessData(
    supabase,
    userId,
    trailId
  );

  const mod = modules.find((m) => m.id === moduleId);
  if (!mod || !mod.unlocked) redirect("/");

  const topics = topicsByModule.get(moduleId) ?? [];
  const topicIndex = topics.findIndex((t) => t.id === topicId);
  if (topicIndex === -1) redirect(`/modulo/${moduleId}`);

  const previousTopic = topicIndex > 0 ? topics[topicIndex - 1] : null;
  const nextTopic = topicIndex < topics.length - 1 ? topics[topicIndex + 1] : null;
  const isLastTopic = topicIndex === topics.length - 1;
  const topicHasExercise = hasExercise(topicId);
  const nextTopicHref = nextTopic ? `/modulo/${moduleId}/topico/${nextTopic.id}` : "/";

  const flow = buildModuleFlow(moduleId, topics, hasExercise);
  // Um passo inexistente (exercício de tópico sem exercício) cai na abertura
  // do tópico; a própria página redireciona logo em seguida.
  const stepIndex = Math.max(
    flow.findIndex((s) => s.topicId === topicId && s.kind === step),
    flow.findIndex((s) => s.topicId === topicId && s.kind === "overview")
  );

  const previousStep = stepIndex > 0 ? flow[stepIndex - 1] : null;
  const nextStep = stepIndex < flow.length - 1 ? flow[stepIndex + 1] : null;

  return {
    modules,
    mod,
    topics,
    topicIndex,
    previousTopic,
    nextTopic,
    isLastTopic,
    hasExercise,
    topicHasExercise,
    nextTopicHref,
    getTopicStatus,
    flow,
    stepIndex,
    previousStep,
    nextStep,
    previousStepNav: stepNav(previousStep, "previous"),
    nextStepNav: stepNav(nextStep, "next"),
    /** Destino do botão "Próximo" — cai na formação quando o módulo acaba. */
    nextStepHref: nextStep?.href ?? "/",
    isLastStep: nextStep === null,
  };
}
