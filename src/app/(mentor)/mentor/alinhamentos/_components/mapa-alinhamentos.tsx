"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PREMISSAS_TEXTO, FASES_ALINHAMENTO, type AlinhamentoItem } from "@/lib/mentor/mapa-alinhamentos";

function AlinhamentoCard({ item }: { item: AlinhamentoItem }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-2.5">
      <p className="text-sm font-medium text-foreground">
        {item.numero}. {item.titulo}
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/70">Quem: </span>
        {item.quem}
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/70">Quando: </span>
        {item.quando}
      </p>
      {item.perguntas && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/70">Perguntas: </span>
          {item.perguntas}
        </p>
      )}
      {item.conversa && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/70">Conversa: </span>
          {item.conversa}
        </p>
      )}
      {item.porque && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/70">Por quê: </span>
          {item.porque}
        </p>
      )}
    </div>
  );
}

function AccordionItem({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{titulo}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function FaseAccordionContent({ fase }: { fase: (typeof FASES_ALINHAMENTO)[number] }) {
  return (
    <>
      {fase.alinhamentos.map((item) => (
        <AlinhamentoCard key={item.numero} item={item} />
      ))}

      {fase.blocoAdicionalTitulo && (
        <div className="rounded-lg bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">{fase.blocoAdicionalTitulo}</p>
          {typeof fase.blocoAdicionalTexto === "string" ? (
            <p className="text-xs text-muted-foreground leading-relaxed">{fase.blocoAdicionalTexto}</p>
          ) : (
            fase.blocoAdicionalTexto.map((bloco, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                {bloco.label && <span className="font-semibold text-foreground/70">{bloco.label}{bloco.texto ? ": " : ""}</span>}
                {bloco.texto}
              </p>
            ))
          )}
        </div>
      )}
    </>
  );
}

export function MapaAlinhamentos() {
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Mapa de Alinhamentos</h2>

      <div className="space-y-2">
        <AccordionItem titulo="Premissas">
          {PREMISSAS_TEXTO.map((p, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </AccordionItem>

        {FASES_ALINHAMENTO.map((fase) => (
          <AccordionItem key={fase.fase} titulo={fase.titulo}>
            <FaseAccordionContent fase={fase} />
          </AccordionItem>
        ))}
      </div>
    </section>
  );
}
