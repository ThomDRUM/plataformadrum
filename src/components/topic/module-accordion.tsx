"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Lock, CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/reui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

export interface ModuleWithTopics {
  id: string;
  title: string;
  intention: string | null;
  why: string | null;
  orderIndex: number;
  unlocked: boolean;
  unlockDate: string | null;
  completed: boolean;
  topics: { id: string; title: string; orderIndex: number }[];
}

interface Props {
  modules: ModuleWithTopics[];
  baseHref?: string;
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function ModuleAccordion({ modules, baseHref = "/modulo" }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
        módulos
      </p>

      <div className="space-y-3">
        {modules.map((mod) => {
          const isExpanded = mod.id === expandedId;
          const status = !mod.unlocked
            ? { label: "Bloqueado", variant: "outline" as const, Icon: Lock }
            : mod.completed
              ? { label: "Concluído", variant: "success-light" as const, Icon: CheckCircle2 }
              : { label: "Em andamento", variant: "warning-light" as const, Icon: null };

          return (
            <div key={mod.id} className="rounded-lg border border-border overflow-hidden">
              <Collapsible
                open={isExpanded}
                onOpenChange={(open) => setExpandedId(open ? mod.id : null)}
              >
                <CollapsibleTrigger
                  render={
                    <button
                      type="button"
                      className="group w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                    />
                  }
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-base font-medium text-foreground truncate">
                      Módulo {mod.orderIndex} — {mod.title}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={status.variant}>
                      {status.Icon && <status.Icon />}
                      {status.label}
                    </Badge>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 group-data-[panel-open]:rotate-180" />
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
                  <div className="px-4 pb-5 pt-1 border-t border-border space-y-4">
                    {mod.intention && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                          Intenção
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{mod.intention}</p>
                      </div>
                    )}

                    {mod.why && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
                          Por quê?
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{mod.why}</p>
                      </div>
                    )}

                    {mod.topics.length > 0 && (
                      <ul className="space-y-1.5">
                        {mod.topics.map((topic) => (
                          <li key={topic.id}>
                            {mod.unlocked ? (
                              <Link
                                href={`${baseHref}/${mod.id}/topico/${topic.id}`}
                                className="block text-sm text-foreground/80 hover:text-foreground transition-colors py-1"
                              >
                                {mod.orderIndex}.{topic.orderIndex} — {topic.title}
                              </Link>
                            ) : (
                              <span className="block text-sm text-muted-foreground/60 cursor-default py-1">
                                {mod.orderIndex}.{topic.orderIndex} — {topic.title}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {mod.unlocked ? (
                      <LinkButton href={`${baseHref}/${mod.id}`} size="sm">
                        Entrar no módulo
                      </LinkButton>
                    ) : (
                      <p className="text-sm text-muted-foreground/60 italic">
                        {mod.unlockDate
                          ? `Será liberado em ${formatDate(mod.unlockDate)}`
                          : "Este módulo ainda não foi liberado pelo seu mentor"}
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </div>
  );
}
