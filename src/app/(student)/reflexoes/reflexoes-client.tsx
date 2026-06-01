"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReflectionData, QuestionData, CompetencyOption, ModuleOption } from "./page";
import { ReflectionCard } from "./reflection-card";

interface Props {
  modules: ModuleOption[];
  competencies: CompetencyOption[];
  reflections: ReflectionData[];
  questions: QuestionData[];
  answersMap: Record<string, string>;
  userId: string;
  currentCompetencyId: string | null;
}

export function ReflexoesClient({ modules, competencies, reflections, questions, answersMap, userId, currentCompetencyId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Default to current competency if no URL param
  const rawParam = searchParams.get("competency");
  const competencyParam = rawParam ?? currentCompetencyId ?? "all";

  function selectCompetency(id: string) {
    router.push(`/reflexoes${id === "all" ? "" : `?competency=${id}`}`, { scroll: false });
  }

  const filteredReflections = competencyParam === "all"
    ? reflections
    : reflections.filter((r) => r.competency_id === competencyParam);

  const selectedCompetency = competencies.find((c) => c.id === competencyParam) ?? null;
  const selectedModule = selectedCompetency
    ? modules.find((m) => m.id === selectedCompetency.module_id) ?? null
    : null;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reflexões</h1>
        {selectedCompetency ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedModule && (
              <span className="mr-1.5">{String(selectedModule.order_index).padStart(2, "0")} · {selectedModule.title} ·</span>
            )}
            {selectedCompetency.title}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Todas as reflexões</p>
        )}
      </div>

      {/* Competency filter — grouped select */}
      <div>
        <select
          value={competencyParam}
          onChange={(e) => selectCompetency(e.target.value)}
          className={cn(
            "text-sm border border-border rounded-md px-3 py-1.5 bg-background text-foreground",
            "focus:outline-none focus:ring-1 focus:ring-ring max-w-sm w-full"
          )}
        >
          <option value="all">Todas as competências</option>
          {modules.map((mod) => {
            const modComps = competencies.filter((c) => c.module_id === mod.id);
            if (modComps.length === 0) return null;
            return (
              <optgroup key={mod.id} label={`${String(mod.order_index).padStart(2, "0")} · ${mod.title}`}>
                {modComps.map((comp) => (
                  <option key={comp.id} value={comp.id}>{comp.title}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      <div className="h-px bg-border" />

      {/* Count */}
      <p className="text-xs text-muted-foreground -mt-2">
        {filteredReflections.length} {filteredReflections.length === 1 ? "reflexão" : "reflexões"}
      </p>

      {/* List */}
      {filteredReflections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-5 py-6">
          <p className="text-sm text-muted-foreground/60">Conteúdo em breve. Será compartilhado em breve.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReflections.map((reflection) => {
            const reflectionQuestions = questions.filter((q) => q.reflection_id === reflection.id);
            const competency = competencies.find((c) => c.id === reflection.competency_id);
            return (
              <ReflectionCard
                key={reflection.id}
                reflection={reflection}
                questions={reflectionQuestions}
                answersMap={answersMap}
                userId={userId}
                competency={competency}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
