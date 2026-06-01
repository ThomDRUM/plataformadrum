"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { DeliverableData } from "./page";

interface Props {
  deliverable: DeliverableData;
  userId: string;
  defaultOpen?: boolean;
}

export function DeliverableAccordion({ deliverable, userId, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [text, setText] = useState(deliverable.submission?.text_content ?? "");
  const [status, setStatus] = useState(deliverable.submission?.status ?? "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "submitted" | null>(null);

  const submissionStatus = status || deliverable.submission?.status;

  async function save(newStatus: "draft" | "submitted") {
    setSaving(true);
    setFeedback(null);
    const supabase = createClient();
    await supabase.from("deliverable_submissions").upsert(
      {
        user_id: userId,
        deliverable_id: deliverable.id,
        text_content: text,
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,deliverable_id" }
    );
    setStatus(newStatus);
    setFeedback(newStatus === "draft" ? "saved" : "submitted");
    setSaving(false);
    setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {deliverable.title}
          </span>
          {submissionStatus === "submitted" || submissionStatus === "completed" ? (
            <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50 flex-shrink-0">
              Enviada
            </span>
          ) : submissionStatus === "draft" ? (
            <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-muted/50 flex-shrink-0">
              Rascunho
            </span>
          ) : null}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-3" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-3" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border space-y-4">
          {deliverable.instructions_html && (
            <div
              className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: deliverable.instructions_html }}
            />
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva sua resposta aqui..."
            rows={5}
            className={cn(
              "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm",
              "placeholder:text-muted-foreground/50 resize-y",
              "focus:outline-none focus:ring-1 focus:ring-ring"
            )}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => save("draft")}
              disabled={saving}
              className="px-4 py-2 text-sm border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              Salvar rascunho
            </button>
            <button
              onClick={() => save("submitted")}
              disabled={saving}
              className="px-4 py-2 text-sm border border-emerald-300 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              Enviar entrega
            </button>
            {feedback === "saved" && (
              <span className="text-xs text-muted-foreground">Rascunho salvo.</span>
            )}
            {feedback === "submitted" && (
              <span className="text-xs text-emerald-700">Entrega enviada.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
