"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Paperclip, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTermometroPdfUrl } from "@/lib/actions/mentor";

interface Successor {
  id: string;
  full_name: string;
  termometro_pdf_url: string | null;
}

function SuccessorRow({ successor }: { successor: Successor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(successor.termometro_pdf_url ?? "");
  const [savedUrl, setSavedUrl] = useState(successor.termometro_pdf_url);

  async function handleSave() {
    await saveTermometroPdfUrl(successor.id, url);
    const normalized = url.trim() || null;
    setSavedUrl(normalized);
    setUrl(normalized ?? "");
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
        <span className="flex-1 text-sm font-medium text-foreground">{successor.full_name}</span>
        {savedUrl ? (
          <span className="flex items-center gap-1 text-xs text-emerald-700">
            <Check className="w-3.5 h-3.5" /> PDF cadastrado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground/40">
            <Paperclip className="w-3.5 h-3.5" /> —
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Link do PDF</p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole o link do Google Drive ou Dropbox"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className={cn("text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors")}
            >
              Salvar
            </button>
            {savedUrl && (
              <a
                href={savedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir PDF
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TermometroSection({ successors }: { successors: Successor[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Devolutivas do Termômetro</h2>
      <p className="text-sm text-muted-foreground mb-6">PDF de devolutiva individual de cada sucessor.</p>

      {successors.length === 0 ? (
        <p className="text-sm text-muted-foreground/60">Nenhum sucessor vinculado ao projeto ainda.</p>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {successors.map((s) => (
            <SuccessorRow key={s.id} successor={s} />
          ))}
        </div>
      )}
    </section>
  );
}
