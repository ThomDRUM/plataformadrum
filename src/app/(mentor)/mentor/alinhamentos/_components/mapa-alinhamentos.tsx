"use client";

import { ChevronRightIcon } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Frame, FrameHeader, FrameTitle, FrameDescription, FramePanel } from "@/components/reui/frame";
import { PREMISSAS_TEXTO, FASES_ALINHAMENTO, type AlinhamentoItem } from "@/lib/mentor/mapa-alinhamentos";

function AlinhamentoCard({ item }: { item: AlinhamentoItem }) {
  return (
    <div className="space-y-2.5 rounded-lg border border-border p-4">
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
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/70">Perguntas: </span>
          {item.perguntas}
        </p>
      )}
      {item.conversa && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/70">Conversa: </span>
          {item.conversa}
        </p>
      )}
      {item.porque && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/70">Por quê: </span>
          {item.porque}
        </p>
      )}
    </div>
  );
}

function MapaCollapsible({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Collapsible className="overflow-hidden rounded-lg border border-border">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
          />
        }
      >
        <span className="text-sm font-medium text-foreground">{titulo}</span>
        <ChevronRightIcon
          aria-hidden="true"
          className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <div className="space-y-3 border-t border-border px-4 pt-3 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FaseContent({ fase }: { fase: (typeof FASES_ALINHAMENTO)[number] }) {
  return (
    <>
      {fase.alinhamentos.map((item) => (
        <AlinhamentoCard key={item.numero} item={item} />
      ))}

      {fase.blocoAdicionalTitulo && (
        <div className="space-y-2 rounded-lg bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">{fase.blocoAdicionalTitulo}</p>
          {typeof fase.blocoAdicionalTexto === "string" ? (
            <p className="text-xs leading-relaxed text-muted-foreground">{fase.blocoAdicionalTexto}</p>
          ) : (
            fase.blocoAdicionalTexto.map((bloco, i) => (
              <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                {bloco.label && (
                  <span className="font-semibold text-foreground/70">
                    {bloco.label}
                    {bloco.texto ? ": " : ""}
                  </span>
                )}
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
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>Mapa de Alinhamentos</FrameTitle>
        <FrameDescription>A sequência de conversas estruturadas da metodologia DRUM.</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <div className="space-y-2">
          <MapaCollapsible titulo="Premissas">
            {PREMISSAS_TEXTO.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </MapaCollapsible>

          {FASES_ALINHAMENTO.map((fase) => (
            <MapaCollapsible key={fase.fase} titulo={fase.titulo}>
              <FaseContent fase={fase} />
            </MapaCollapsible>
          ))}
        </div>
      </FramePanel>
    </Frame>
  );
}
