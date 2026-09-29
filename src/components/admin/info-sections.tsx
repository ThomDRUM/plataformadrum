"use client";

import { ChevronRightIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Peças dos dialogs de informações do admin (família, formação, …).
 *
 * Vivem num arquivo comum porque os dialogs têm o mesmo esqueleto — blocos
 * rotulados, pares rótulo/valor e textos longos recolhidos — e as três telas
 * precisam ler igual.
 */

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      {children}
    </section>
  );
}

export function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * Texto longo recolhido por padrão.
 *
 * História e missão costumam ter vários parágrafos; com todos abertos, o dialog
 * vira uma rolagem longa que esconde o resto do conteúdo.
 */
export function CollapsibleText({
  title,
  text,
}: {
  title: string;
  text: string | null;
}) {
  const content = text?.trim() ?? "";

  // Campo vazio não precisa de um clique para revelar que está vazio.
  if (!content) {
    return (
      <section className="flex items-baseline justify-between gap-2">
        <SectionLabel>{title}</SectionLabel>
        <span className="text-sm text-muted-foreground">Não preenchido</span>
      </section>
    );
  }

  return (
    <Collapsible render={<section />}>
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group flex w-full items-center gap-1.5 text-left transition-colors hover:text-foreground"
          />
        }
      >
        <ChevronRightIcon
          aria-hidden="true"
          className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90"
        />
        <SectionLabel>{title}</SectionLabel>
      </CollapsibleTrigger>

      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <p className="whitespace-pre-wrap pt-2 pl-5">{content}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}
