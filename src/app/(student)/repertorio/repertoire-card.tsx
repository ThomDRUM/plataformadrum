"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { RepertoireItemData, CompetencyOption } from "./page";

interface Props {
  item: RepertoireItemData;
  consumed: boolean;
  userId: string;
  competency?: CompetencyOption;
  onToggleConsumed: (id: string, val: boolean) => void;
}

const LEVEL_LABEL: Record<number, string> = {
  1: "Básico",
  2: "Aprofundamento",
  3: "Complementar",
};

const LEVEL_CLASS: Record<number, string> = {
  1: "border-sky-200 text-sky-700 bg-sky-50",
  2: "border-violet-200 text-violet-700 bg-violet-50",
  3: "border-border text-muted-foreground",
};

export function RepertoireCard({ item, consumed, userId, competency, onToggleConsumed }: Props) {
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const hasBody = !!(item.full_summary || item.content_html);
  const levelLabel = LEVEL_LABEL[item.level] ?? `Nível ${item.level}`;
  const levelClass = LEVEL_CLASS[item.level] ?? LEVEL_CLASS[3];

  async function toggleConsumed() {
    setToggling(true);
    const supabase = createClient();
    if (consumed) {
      await supabase
        .from("user_repertoire_consumed")
        .delete()
        .eq("user_id", userId)
        .eq("repertoire_item_id", item.id);
    } else {
      await supabase
        .from("user_repertoire_consumed")
        .insert({ user_id: userId, repertoire_item_id: item.id });
    }
    onToggleConsumed(item.id, !consumed);
    setToggling(false);
  }

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden transition-colors",
      consumed ? "border-border bg-muted/20" : "border-border bg-background"
    )}>
      {/* Row header */}
      <div className="flex items-start gap-3 px-4 py-3">

        {/* Consumed dot */}
        <button
          onClick={toggleConsumed}
          disabled={toggling}
          className="mt-[3px] flex-shrink-0 p-0.5 rounded-full transition-colors"
          title={consumed ? "Marcar como não lido" : "Marcar como lido"}
        >
          <div className={cn(
            "w-[7px] h-[7px] rounded-full transition-colors",
            consumed ? "bg-foreground" : "border border-muted-foreground/40 bg-transparent"
          )} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={cn(
              "text-sm leading-snug",
              consumed ? "text-muted-foreground/60" : "text-foreground"
            )}>
              {item.title}
            </span>
          </div>
          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded border",
              levelClass
            )}>
              {levelLabel}
            </span>
            {item.material_type && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground">
                {item.material_type}
              </span>
            )}
            {item.short_summary && (
              <span className="text-[11px] text-muted-foreground/70 ml-1 truncate max-w-xs">
                {item.short_summary}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {item.external_url && (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Abrir link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {hasBody && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {open
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {open && hasBody && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          {item.full_summary && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              {item.full_summary}
            </p>
          )}
          {item.content_html && (
            <div
              className="prose prose-sm max-w-none text-sm mt-2"
              dangerouslySetInnerHTML={{ __html: item.content_html }}
            />
          )}
        </div>
      )}
    </div>
  );
}
