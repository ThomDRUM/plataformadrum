"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronRightIcon, Paperclip, ExternalLink, Check } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Frame, FrameHeader, FrameTitle, FrameDescription, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveTermometroPdfUrl } from "@/lib/actions/mentor";

interface Successor {
  id: string;
  full_name: string;
  termometro_pdf_url: string | null;
}

function SuccessorRow({ successor }: { successor: Successor }) {
  const [url, setUrl] = useState(successor.termometro_pdf_url ?? "");
  const [savedUrl, setSavedUrl] = useState(successor.termometro_pdf_url);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const normalized = url.trim() || null;
    startTransition(async () => {
      const result = await saveTermometroPdfUrl(successor.id, url);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSavedUrl(normalized);
      setUrl(normalized ?? "");
      toast.success("Salvo.");
    });
  }

  return (
    <Collapsible className="overflow-hidden rounded-lg border border-border">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
          />
        }
      >
        <ChevronRightIcon
          aria-hidden="true"
          className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90"
        />
        <span className="flex-1 text-sm font-medium text-foreground">{successor.full_name}</span>
        {savedUrl ? (
          <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" /> PDF cadastrado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground/40">
            <Paperclip className="h-3.5 w-3.5" /> —
          </span>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <div className="space-y-3 border-t border-border px-4 pt-3 pb-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Link do PDF</p>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole o link do Google Drive ou Dropbox"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
              Salvar
            </Button>
            {savedUrl && (
              <a
                href={savedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir PDF
              </a>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TermometroSection({ successors }: { successors: Successor[] }) {
  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>Devolutivas do Termômetro</FrameTitle>
        <FrameDescription>PDF de devolutiva individual de cada sucessor.</FrameDescription>
      </FrameHeader>
      <FramePanel>
        {successors.length === 0 ? (
          <p className="text-sm text-muted-foreground/60">Nenhum sucessor vinculado ao projeto ainda.</p>
        ) : (
          <div className="space-y-2">
            {successors.map((s) => (
              <SuccessorRow key={s.id} successor={s} />
            ))}
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
