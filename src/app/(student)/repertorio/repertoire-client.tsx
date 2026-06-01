"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { RepertoireItemData, CompetencyOption, ModuleOption } from "./page";
import { RepertoireCard } from "./repertoire-card";

interface Props {
  modules: ModuleOption[];
  competencies: CompetencyOption[];
  items: RepertoireItemData[];
  consumedIds: string[];
  userId: string;
  currentCompetencyId: string | null;
}

export function RepertoireClient({ modules, competencies, items, consumedIds, userId, currentCompetencyId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [consumed, setConsumed] = useState<Set<string>>(new Set(consumedIds));

  // Default to current competency if no URL param
  const rawParam = searchParams.get("competency");
  const competencyParam = rawParam ?? currentCompetencyId ?? "all";

  function selectCompetency(id: string) {
    router.push(`/repertorio${id === "all" ? "" : `?competency=${id}`}`, { scroll: false });
  }

  const filteredItems = competencyParam === "all"
    ? items
    : items.filter((i) => i.competency_id === competencyParam);

  const selectedCompetency = competencies.find((c) => c.id === competencyParam) ?? null;
  const selectedModule = selectedCompetency
    ? modules.find((m) => m.id === selectedCompetency.module_id) ?? null
    : null;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Repertório</h1>
        {selectedCompetency ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedModule && (
              <span className="mr-1.5">{String(selectedModule.order_index).padStart(2, "0")} · {selectedModule.title} ·</span>
            )}
            {selectedCompetency.title}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Todos os itens</p>
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
        {filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}
      </p>

      {/* Items list */}
      {filteredItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-5 py-6">
          <p className="text-sm text-muted-foreground/60">Conteúdo em breve. Será compartilhado em breve.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <RepertoireCard
              key={item.id}
              item={item}
              consumed={consumed.has(item.id)}
              userId={userId}
              competency={competencies.find((c) => c.id === item.competency_id)}
              onToggleConsumed={(id, val) => {
                setConsumed((prev) => {
                  const next = new Set(prev);
                  if (val) next.add(id); else next.delete(id);
                  return next;
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
