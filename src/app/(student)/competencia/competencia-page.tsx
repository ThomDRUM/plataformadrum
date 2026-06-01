"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeliverableAccordion } from "./deliverable-accordion";
import type { ModuleData, CompetencyData } from "./page";

interface Props {
  modules: ModuleData[];
  defaultCompetencyId: string;
  userId: string;
}

export function CompetenciaPage({ modules, defaultCompetencyId, userId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Resolve selected competency/module from URL
  const competencyParam = searchParams.get("competency");
  const moduleParam = searchParams.get("module");

  const allCompetencies = modules.flatMap((m) => m.competencies);

  let selectedId = competencyParam;
  if (!selectedId && moduleParam) {
    selectedId = modules.find((m) => m.id === moduleParam)?.competencies[0]?.id ?? null;
  }
  if (!selectedId) selectedId = defaultCompetencyId;

  const selectedCompetency = allCompetencies.find((c) => c.id === selectedId) ?? allCompetencies[0] ?? null;
  const selectedModule = modules.find((m) => m.competencies.some((c) => c.id === selectedCompetency?.id)) ?? null;

  // Module showing "no content" state (clicked but empty)
  const emptyModuleId = !competencyParam && moduleParam
    && modules.find((m) => m.id === moduleParam)?.competencies.length === 0
    ? moduleParam
    : null;

  // Collapsible state — active module open by default, others closed
  const defaultOpen = modules.reduce<Record<string, boolean>>((acc, mod) => {
    const hasActive = mod.competencies.some((c) => c.status === "active");
    const isSelected = mod.competencies.some((c) => c.id === selectedId);
    const isModuleParam = mod.id === moduleParam;
    acc[mod.id] = hasActive || isSelected || isModuleParam;
    return acc;
  }, {});

  const [openModules, setOpenModules] = useState<Record<string, boolean>>(defaultOpen);

  function toggleModule(id: string) {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectCompetency(id: string) {
    router.push(`/competencia?competency=${id}`, { scroll: false });
  }

  function selectEmptyModule(id: string) {
    router.push(`/competencia?module=${id}`, { scroll: false });
  }

  return (
    <div className="-mx-10 -my-10 flex overflow-hidden" style={{ height: "100vh" }}>

      {/* ── Left nav ── */}
      <nav className="w-56 flex-shrink-0 border-r border-border overflow-y-auto py-3 px-2">
        {modules.map((mod) => {
          const isOpen = openModules[mod.id] ?? false;
          const hasActive = mod.competencies.some((c) => c.status === "active");
          const isEmpty = mod.competencies.length === 0;

          return (
            <div key={mod.id} className="mb-0.5">
              {/* Module header — clickable */}
              <button
                onClick={() => {
                  toggleModule(mod.id);
                  if (isEmpty) selectEmptyModule(mod.id);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors hover:bg-muted/50",
                )}
              >
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider leading-none",
                  hasActive ? "text-foreground/80" : "text-muted-foreground/50"
                )}>
                  {String(mod.order_index).padStart(2, "0")} · {mod.title}
                  {hasActive && (
                    <span className="ml-1.5 normal-case font-normal text-amber-600/80">· agora</span>
                  )}
                </span>
                {!isEmpty && (
                  isOpen
                    ? <ChevronDown className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                )}
              </button>

              {/* Competency list */}
              {isOpen && !isEmpty && (
                <div className="space-y-px mt-0.5 mb-1">
                  {mod.competencies.map((comp) => {
                    const isSelected = comp.id === selectedCompetency?.id;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => selectCompetency(comp.id)}
                        className={cn(
                          "w-full flex items-start gap-2 px-2.5 py-1 rounded-md text-left transition-colors",
                          isSelected ? "bg-accent" : "hover:bg-muted/50"
                        )}
                      >
                        <div className="mt-[5px] flex-shrink-0">
                          <div className={cn(
                            "w-[5px] h-[5px] rounded-full",
                            comp.status === "done" && "bg-muted-foreground/35",
                            comp.status === "active" && "bg-foreground",
                            comp.status === "future" && "border border-muted-foreground/30 bg-transparent"
                          )} />
                        </div>
                        <span className={cn(
                          "text-[11px] leading-[1.4] tracking-tight",
                          comp.status === "done" && !isSelected && "text-muted-foreground/50",
                          comp.status === "active" && !isSelected && "text-foreground/90",
                          comp.status === "future" && !isSelected && "text-muted-foreground/70",
                          isSelected && "text-foreground font-medium"
                        )}>
                          {comp.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Right content ── */}
      <div className="flex-1 overflow-y-auto py-8 px-8">
        {emptyModuleId ? (
          <EmptyModuleState module={modules.find((m) => m.id === emptyModuleId) ?? null} />
        ) : selectedCompetency ? (
          <CompetencyDetail
            competency={selectedCompetency}
            module={selectedModule}
            userId={userId}
          />
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm text-muted-foreground">Selecione uma competência.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Blocked content ────────────────────────────────────────────────

function BlockedContent() {
  return (
    <div className="rounded-lg border border-dashed border-border px-5 py-4">
      <p className="text-sm text-muted-foreground/60">Conteúdo em breve. Será compartilhado em breve.</p>
    </div>
  );
}

// ── Empty module state ──────────────────────────────────────────────

function EmptyModuleState({ module }: { module: ModuleData | null }) {
  return (
    <div className="max-w-3xl py-20 text-center">
      {module && (
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50 mb-4">
          {String(module.order_index).padStart(2, "0")} · {module.title}
        </p>
      )}
      <p className="text-base text-muted-foreground">Este módulo ainda não tem conteúdo disponível.</p>
      <p className="text-sm text-muted-foreground/60 mt-2">O conteúdo será liberado em breve.</p>
    </div>
  );
}

// ── Right column content ────────────────────────────────────────────

interface DetailProps {
  competency: CompetencyData;
  module: ModuleData | null;
  userId: string;
}

function CompetencyDetail({ competency, module, userId }: DetailProps) {
  return (
    <div className="max-w-3xl space-y-6">

      {/* Context + title */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          {module && (
            <span className="text-xs text-muted-foreground/70 tracking-wide">
              {String(module.order_index).padStart(2, "0")} · {module.title}
            </span>
          )}
          {competency.status === "active" && module && (
            <span className="text-muted-foreground/30 text-xs">·</span>
          )}
          {competency.status === "active" && (
            <span className="text-xs px-2 py-0.5 rounded border border-amber-300/60 text-amber-700 bg-amber-50">
              Competência atual
            </span>
          )}
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground leading-snug">
          {competency.title}
        </h1>
        {competency.description && (
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            {competency.description}
          </p>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Entregas */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Entregas
        </p>
        {competency.deliverables.length > 0 ? (
          <div className="space-y-2">
            {competency.deliverables.map((d, idx) => (
              <DeliverableAccordion
                key={d.id}
                deliverable={d}
                userId={userId}
                defaultOpen={idx === 0}
              />
            ))}
          </div>
        ) : (
          <BlockedContent />
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Links Repertório + Reflexões */}
      <div className="grid grid-cols-2 gap-3">
        {competency.repertoire_count > 0 ? (
          <Link
            href={`/repertorio?competency=${competency.id}`}
            className="flex items-center justify-between px-4 py-4 border border-border rounded-lg hover:bg-muted/40 transition-colors group"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Repertório
              </p>
              <p className="text-sm text-foreground">
                {competency.repertoire_count} {competency.repertoire_count === 1 ? "item" : "itens"}
              </p>
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">→</span>
          </Link>
        ) : (
          <div className="px-4 py-4 border border-border rounded-lg">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Repertório</p>
            <p className="text-xs text-muted-foreground/60">Em breve.</p>
          </div>
        )}

        {competency.reflection_count > 0 ? (
          <Link
            href={`/reflexoes?competency=${competency.id}`}
            className="flex items-center justify-between px-4 py-4 border border-border rounded-lg hover:bg-muted/40 transition-colors group"
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                Reflexões
              </p>
              <p className="text-sm text-foreground">
                {competency.reflection_count} {competency.reflection_count === 1 ? "item" : "itens"}
              </p>
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors text-base">→</span>
          </Link>
        ) : (
          <div className="px-4 py-4 border border-border rounded-lg">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Reflexões</p>
            <p className="text-xs text-muted-foreground/60">Em breve.</p>
          </div>
        )}
      </div>

    </div>
  );
}
