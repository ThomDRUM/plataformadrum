"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Pencil, Check, Plus, Trash2, ChevronRightIcon } from "lucide-react";
import { Frame, FrameHeader, FrameTitle, FrameDescription, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { updateOverviewField, saveOutcomes, saveRules, saveRoles } from "@/lib/actions/mentor";
import type { ProjetoOverviewData } from "@/lib/mentor/projeto";
import type { ActionResult } from "@/lib/mentor/types";

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = ProjetoOverviewData;
type Outcome = ProjetoOverviewData["outcomes"][number];

// ── Shared components ──────────────────────────────────────────────────────────

function CollapsibleHelp({ children }: { children: React.ReactNode }) {
  return (
    <Collapsible className="mt-2 mb-4">
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="group flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          />
        }
      >
        <ChevronRightIcon
          aria-hidden="true"
          className="size-3 shrink-0 transition-transform group-data-[panel-open]:rotate-90"
        />
        Ver instruções
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
        <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function EditableText({
  value,
  onSave,
  rows = 5,
  placeholder = "—",
  pending,
}: {
  value: string;
  onSave: (v: string) => void;
  rows?: number;
  placeholder?: string;
  pending?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() {
    setDraft(value);
    setEditing(true);
  }
  function save() {
    onSave(draft);
    setEditing(false);
  }
  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={rows}
          autoFocus
          className="text-sm leading-relaxed"
        />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" disabled={pending} onClick={save}>
            <Check /> Salvar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <p className={cn("pr-8 text-sm leading-relaxed", value ? "text-foreground" : "text-muted-foreground/40")}>
        {value || placeholder}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-0 right-0 text-muted-foreground/40 hover:text-muted-foreground"
        onClick={startEdit}
      >
        <Pencil />
      </Button>
    </div>
  );
}

function OutcomesSection({
  initialOutcomes,
  onSave,
}: {
  initialOutcomes: Outcome[];
  onSave: (texts: string[]) => Promise<ActionResult>;
}) {
  const [outcomes, setOutcomes] = useState(initialOutcomes);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState(initialOutcomes);
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setDrafts(outcomes);
    setEditing(true);
  }
  function cancel() {
    setDrafts(outcomes);
    setEditing(false);
  }
  function addDraft() {
    setDrafts([...drafts, { id: "", text: "" }]);
  }
  function removeDraft(i: number) {
    setDrafts(drafts.filter((_, idx) => idx !== i));
  }
  function updateDraft(i: number, text: string) {
    setDrafts(drafts.map((o, idx) => (idx === i ? { ...o, text } : o)));
  }
  function save() {
    const prev = outcomes;
    const next = drafts;
    setOutcomes(next.map((o, i) => ({ ...o, id: o.id || String(i) })));
    setEditing(false);
    startTransition(async () => {
      const result = await onSave(next.map((o) => o.text));
      if (!result.ok) {
        setOutcomes(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }

  if (!editing) {
    return (
      <div className="group relative">
        <div className="space-y-2 pr-8">
          {outcomes.length === 0 && <p className="text-sm text-muted-foreground/40">—</p>}
          {outcomes.map((o, i) => (
            <div key={o.id || i} className="flex gap-3 text-sm leading-relaxed text-foreground">
              <span className="flex-shrink-0 text-muted-foreground/40 tabular-nums">{i + 1}.</span>
              <span>{o.text}</span>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-0 right-0 text-muted-foreground/40 hover:text-muted-foreground"
          onClick={startEdit}
        >
          <Pencil />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {drafts.map((o, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 w-4 flex-shrink-0 text-sm text-muted-foreground/40 tabular-nums">{i + 1}.</span>
          <Textarea
            value={o.text}
            onChange={(e) => updateDraft(i, e.target.value)}
            rows={2}
            placeholder="Resultado esperado..."
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mt-1 text-muted-foreground/40 hover:text-muted-foreground"
            onClick={() => removeDraft(i)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={addDraft} className="text-muted-foreground">
        <Plus /> Adicionar resultado
      </Button>
      <div className="flex items-center gap-2 pt-1">
        <Button type="button" size="sm" disabled={isPending} onClick={save}>
          <Check /> Salvar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={cancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

interface ListItem {
  id: string;
  primary: string;
  secondary: string;
}

function EditableItemList({
  initialItems,
  onSave,
  primaryLabel,
  primaryPlaceholder,
  secondaryLabel,
  secondaryPlaceholder,
  addLabel,
  emptyPrimaryLabel,
}: {
  initialItems: ListItem[];
  onSave: (items: { primary: string; secondary: string }[]) => Promise<ActionResult>;
  primaryLabel: string;
  primaryPlaceholder: string;
  secondaryLabel: string;
  secondaryPlaceholder: string;
  addLabel: string;
  emptyPrimaryLabel: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ primary: string; secondary: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function persist(prev: ListItem[], next: ListItem[]) {
    startTransition(async () => {
      const result = await onSave(next.map((i) => ({ primary: i.primary, secondary: i.secondary })));
      if (!result.ok) {
        setItems(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }

  function addItem() {
    const next = [...items, { id: "", primary: "", secondary: "" }];
    setItems(next);
    setEditingIdx(next.length - 1);
    setDraft({ primary: "", secondary: "" });
  }
  function removeItem(idx: number) {
    const prev = items;
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    setEditingIdx(null);
    setDraft(null);
    persist(prev, next);
  }
  function startEditItem(idx: number) {
    setEditingIdx(idx);
    setDraft({ primary: items[idx].primary, secondary: items[idx].secondary });
  }
  function cancelEditItem() {
    if (editingIdx !== null && items[editingIdx]?.id === "") {
      setItems(items.filter((_, i) => i !== editingIdx));
    }
    setEditingIdx(null);
    setDraft(null);
  }
  function saveItem(idx: number) {
    if (!draft) return;
    const prev = items;
    const next = items.map((item, i) => (i === idx ? { ...item, ...draft } : item));
    setItems(next);
    setEditingIdx(null);
    setDraft(null);
    persist(prev, next);
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const key = item.id || `new-${idx}`;
        const isEditing = editingIdx === idx;

        if (isEditing && draft) {
          return (
            <div key={key} className="space-y-3 rounded-lg border border-border p-4">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {primaryLabel}
                </p>
                <Input
                  value={draft.primary}
                  onChange={(e) => setDraft({ ...draft, primary: e.target.value })}
                  autoFocus
                  placeholder={primaryPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {secondaryLabel}
                </p>
                <Textarea
                  value={draft.secondary}
                  onChange={(e) => setDraft({ ...draft, secondary: e.target.value })}
                  rows={3}
                  placeholder={secondaryPlaceholder}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" disabled={isPending} onClick={() => saveItem(idx)}>
                  <Check /> Salvar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelEditItem}>
                  Cancelar
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="group relative rounded-lg border border-border px-4 py-3">
            <div className="pr-14">
              <p className="text-sm font-medium text-foreground">{item.primary || emptyPrimaryLabel}</p>
              {item.secondary && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.secondary}</p>
              )}
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground/40 hover:text-muted-foreground"
                onClick={() => startEditItem(idx)}
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground/40 hover:text-muted-foreground"
                onClick={() => removeItem(idx)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        );
      })}
      <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-muted-foreground">
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProjetoClient({ projectId, familyName, overview, outcomes, rules, roles }: Props) {
  const [intention, setIntention] = useState(overview.intention);
  const [mwta, setMwta] = useState(overview.mwta);
  const [pointA, setPointA] = useState(overview.point_a);
  const [pointB, setPointB] = useState(overview.point_b);
  const [overviewPending, startOverviewTransition] = useTransition();

  function handleIntentionSave(v: string) {
    const prev = intention;
    setIntention(v);
    startOverviewTransition(async () => {
      const result = await updateOverviewField(projectId, "intention", v);
      if (!result.ok) {
        setIntention(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }
  function handleMwtaSave(v: string) {
    const prev = mwta;
    setMwta(v);
    startOverviewTransition(async () => {
      const result = await updateOverviewField(projectId, "mwta", v);
      if (!result.ok) {
        setMwta(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }
  function handlePointASave(v: string) {
    const prev = pointA;
    setPointA(v);
    startOverviewTransition(async () => {
      const result = await updateOverviewField(projectId, "point_a", v);
      if (!result.ok) {
        setPointA(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }
  function handlePointBSave(v: string) {
    const prev = pointB;
    setPointB(v);
    startOverviewTransition(async () => {
      const result = await updateOverviewField(projectId, "point_b", v);
      if (!result.ok) {
        setPointB(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground/60 uppercase">
          {familyName}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Projeto</h1>
      </div>

      {/* ── Intenção ── */}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Intenção</FrameTitle>
          <FrameDescription>A intenção principal do projeto como um todo.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <EditableText value={intention} onSave={handleIntentionSave} rows={5} pending={overviewPending} />
        </FramePanel>
      </Frame>

      {/* ── Desired Outcome ── */}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Desired Outcome</FrameTitle>
          <FrameDescription>Os resultados concretos esperados ao final do processo.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <OutcomesSection initialOutcomes={outcomes} onSave={(texts) => saveOutcomes(projectId, texts)} />
        </FramePanel>
      </Frame>

      {/* ── MWTA ── */}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>MWTA · Meet Where They Are</FrameTitle>
          <FrameDescription>
            Permite acessarmos com precisão a realidade da família hoje. Nos ajudará a definir o escopo do projeto.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <CollapsibleHelp>
            <p className="font-medium text-foreground/80">Preencha a partir das seguintes perguntas:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Quem é o público e como estão se sentindo?</li>
              <li>O que precisam hoje?</li>
              <li>Quais as suas necessidades agora?</li>
              <li>O que esperam da experiência?</li>
              <li>Algo os preocupa e gera tensão?</li>
            </ul>
          </CollapsibleHelp>
          <EditableText
            value={mwta}
            onSave={handleMwtaSave}
            rows={5}
            placeholder="Descreva onde a família está hoje..."
            pending={overviewPending}
          />
        </FramePanel>
      </Frame>

      {/* ── Ponto A ── */}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Ponto A</FrameTitle>
          <FrameDescription className="italic">A fotografia do estado atual da família.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <CollapsibleHelp>
            <p className="font-medium text-foreground/80">
              Descreva a situação atual como se fosse a fotografia da realidade hoje. Considere os seguintes tópicos
              para construir esse cenário:
            </p>
            <div className="mt-2 space-y-3">
              <div>
                <span className="font-medium text-foreground/80">Individual:</span> os membros da família possuem
                individualmente um bom entendimento sobre o seu contexto sendo parte de uma família empreendedora?
                Conseguem entender o seu papel no sistema empresarial-familiar no curto, médio e longo prazo? Cada
                um consegue ter clareza das definições sobre o futuro dos negócios e como isso impacta a sua
                trajetória pessoal e profissional?
                <ul className="mt-1.5 ml-2 list-inside list-disc space-y-1">
                  <li>
                    <span className="font-medium text-foreground/80">Geração atual:</span> tem visão de futuro da
                    família empreendedora (visão de portfólio), alinhamento sobre como vai ser a sucessão da
                    propriedade, da gestão do negócio? A partir destas definições, entende a necessidade de
                    desenvolver a próxima geração, de fazer a transição de poder para ela e qual papel vai
                    desempenhar no futuro?
                  </li>
                  <li>
                    <span className="font-medium text-foreground/80">Próxima geração:</span> a partir da orientação
                    e visão da geração atual, entende se e como gostaria de se relacionar com a família
                    empreendedora? A partir desta definição, está em uma trajetória de desenvolvimento para
                    conseguir agregar valor ao contexto da família empreendedora em harmonia com a sua trajetória
                    pessoal e profissional?
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-medium text-foreground/80">Relacional:</span> as relações em cada uma das
                esferas, na família, no negócio e na sociedade, estão funcionais? Existem conflitos que causam
                rupturas ou uma incapacidade de convivência? Todos se respeitam e entendem os seus direitos e
                deveres a depender do papel que ocupam no sistema e se comunicam e alinham de forma recorrente?
              </div>
              <div>
                <span className="font-medium text-foreground/80">Empreendedora:</span> existe uma clareza para os
                líderes do negócio sobre o futuro e planejamento estratégico do empreendimento, que fase ele está e
                do que precisa para prosperar? Isso é transmitido para a próxima geração que consegue entender
                quais são as suas oportunidades e necessidades de desenvolvimento?
              </div>
              <div>
                <span className="font-medium text-foreground/80">Estrutural:</span> os entendimentos sobre como será
                a sucessão, passagem da propriedade, gestão do negócio, direitos e deveres de sócios, familiares e
                executivos estão formalizados com instrumentos e políticas conhecidas por todos? Existem fóruns que
                dão recorrência e consistência para a tomada de decisão, alinhamento e compartilhamento de
                informações entre toda a família e empresa?
              </div>
            </div>
          </CollapsibleHelp>
          <EditableText value={pointA} onSave={handlePointASave} rows={8} pending={overviewPending} />
        </FramePanel>
      </Frame>

      {/* ── Ponto B ── */}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Ponto B</FrameTitle>
          <FrameDescription className="italic">
            A fotografia do estado desejado para a família ao final do projeto.
          </FrameDescription>
        </FrameHeader>
        <FramePanel>
          <CollapsibleHelp>
            <p className="font-medium text-foreground/80">
              Descreva o estado desejado ao final do processo. Considere as quatro dimensões:
            </p>
            <div className="mt-2 space-y-3">
              <div>
                <span className="font-medium text-foreground/80">Individual:</span> os membros da família possuem
                individualmente um bom entendimento sobre o seu contexto sendo parte de uma família empreendedora?
                Conseguem entender o seu papel no sistema empresarial-familiar no curto, médio e longo prazo? Cada
                um consegue ter clareza das definições sobre o futuro dos negócios e como isso impacta a sua
                trajetória pessoal e profissional?
                <ul className="mt-1.5 ml-2 list-inside list-disc space-y-1">
                  <li>
                    <span className="font-medium text-foreground/80">Geração atual:</span> tem visão de futuro da
                    família empreendedora (visão de portfólio), alinhamento sobre como vai ser a sucessão da
                    propriedade, da gestão do negócio? A partir destas definições, entende a necessidade de
                    desenvolver a próxima geração, de fazer a transição de poder para ela e qual papel vai
                    desempenhar no futuro?
                  </li>
                  <li>
                    <span className="font-medium text-foreground/80">Próxima geração:</span> a partir da orientação
                    e visão da geração atual, entende se e como gostaria de se relacionar com a família
                    empreendedora? A partir desta definição, está em uma trajetória de desenvolvimento para
                    conseguir agregar valor ao contexto da família empreendedora em harmonia com a sua trajetória
                    pessoal e profissional?
                  </li>
                </ul>
              </div>
              <div>
                <span className="font-medium text-foreground/80">Relacional:</span> as relações em cada uma das
                esferas, na família, no negócio e na sociedade, estão funcionais? Existem conflitos que causam
                rupturas ou uma incapacidade de convivência? Todos se respeitam e entendem os seus direitos e
                deveres a depender do papel que ocupam no sistema e se comunicam e alinham de forma recorrente?
              </div>
              <div>
                <span className="font-medium text-foreground/80">Empreendedora:</span> existe uma clareza para os
                líderes do negócio sobre o futuro e planejamento estratégico do empreendimento, que fase ele está e
                do que precisa para prosperar? Isso é transmitido para a próxima geração que consegue entender
                quais são as suas oportunidades e necessidades de desenvolvimento?
              </div>
              <div>
                <span className="font-medium text-foreground/80">Estrutural:</span> os entendimentos sobre como será
                a sucessão, passagem da propriedade, gestão do negócio, direitos e deveres de sócios, familiares e
                executivos estão formalizados com instrumentos e políticas conhecidas por todos? Existem fóruns que
                dão recorrência e consistência para a tomada de decisão, alinhamento e compartilhamento de
                informações entre toda a família e empresa?
              </div>
            </div>
          </CollapsibleHelp>
          <EditableText value={pointB} onSave={handlePointBSave} rows={8} pending={overviewPending} />
        </FramePanel>
      </Frame>

      {/* ── Regras ── */}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Regras</FrameTitle>
          <FrameDescription>Acordos de postura e convivência durante o processo.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <EditableItemList
            initialItems={rules.map((r) => ({ id: r.id, primary: r.title, secondary: r.description }))}
            onSave={(items) =>
              saveRules(
                projectId,
                items.map((i) => ({ title: i.primary, description: i.secondary }))
              )
            }
            primaryLabel="Título"
            primaryPlaceholder="Título da regra..."
            secondaryLabel="Descrição"
            secondaryPlaceholder="Descrição da regra..."
            addLabel="Nova regra"
            emptyPrimaryLabel="Nova regra"
          />
        </FramePanel>
      </Frame>

      {/* ── Papeis ── */}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle>Papeis</FrameTitle>
          <FrameDescription>Quem faz o quê neste projeto.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <EditableItemList
            initialItems={roles.map((r) => ({ id: r.id, primary: r.person_name, secondary: r.description }))}
            onSave={(items) =>
              saveRoles(
                projectId,
                items.map((i) => ({ person_name: i.primary, description: i.secondary }))
              )
            }
            primaryLabel="Nome"
            primaryPlaceholder="Nome da pessoa..."
            secondaryLabel="Papel"
            secondaryPlaceholder="Descrição do papel..."
            addLabel="Novo papel"
            emptyPrimaryLabel="Novo papel"
          />
        </FramePanel>
      </Frame>
    </div>
  );
}
