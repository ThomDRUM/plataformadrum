"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinkButton } from "@/components/ui/link-button";

export interface ModuleWithTopics {
  id: string;
  title: string;
  intention: string | null;
  why: string | null;
  orderIndex: number;
  unlocked: boolean;
  unlockDate: string | null;
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
    <div className="space-y-0">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-5">
        módulos
      </p>

      {modules.map((mod) => {
        const isExpanded = mod.id === expandedId;

        return (
          <div key={mod.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : mod.id)}
              className="w-full flex items-center justify-between gap-3 py-4 text-left group"
            >
              <span className="flex items-center gap-3">
                {mod.unlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className="text-base font-medium text-foreground">
                  Módulo {mod.orderIndex} — {mod.title}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {isExpanded && (
              <div className="pb-6 pl-7 space-y-4">
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
            )}
          </div>
        );
      })}
    </div>
  );
}
