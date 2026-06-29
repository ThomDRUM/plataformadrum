"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  updateOverviewField,
  saveOutcomes,
  saveRoles,
} from "@/lib/actions/mentor";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Overview {
  intention: string;
  mwta: string;
  point_a: string;
  point_b: string;
}

interface Outcome { id: string; text: string }
interface Rule    { id: string; title: string; description: string }
interface Role    { id: string; person_name: string; description: string }

interface Props {
  projectId: string;
  familyName: string;
  overview: Overview;
  outcomes: Outcome[];
  rules: Rule[];
  roles: Role[];
}

// ── Shared components ──────────────────────────────────────────────────────────

function SectionTitle({ title, help, italic }: { title: string; help?: string; italic?: boolean }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {help && (
        <p className={cn("text-sm text-muted-foreground mt-1", italic && "italic")}>{help}</p>
      )}
    </div>
  );
}

function CollapsibleInstructions({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Ver instruções
      </button>
      {open && (
        <div className="mt-2 p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

function EditableText({
  value, onChange, rows = 5, placeholder = "—",
}: {
  value: string; onChange: (v: string) => void; rows?: number; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() { setDraft(value); setEditing(true); }
  function save() { onChange(draft); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }

  if (editing) {
    return (
      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={rows}
          autoFocus
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-center gap-3 mt-2">
          <button onClick={save} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
            <Check className="w-3 h-3" /> Salvar
          </button>
          <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <p className={cn("text-sm leading-relaxed pr-8", value ? "text-foreground" : "text-muted-foreground/40")}>
        {value || placeholder}
      </p>
      <button
        onClick={startEdit}
        className="absolute top-0 right-0 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        title="Editar"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProjetoClient({
  projectId, familyName, overview, outcomes: initialOutcomes, rules, roles: initialRoles,
}: Props) {
  const [intention, setIntention] = useState(overview.intention);
  const [mwta, setMwta]           = useState(overview.mwta);
  const [pointA, setPointA]       = useState(overview.point_a);
  const [pointB, setPointB]       = useState(overview.point_b);

  const [outcomes, setOutcomes]           = useState(initialOutcomes);
  const [editingOutcomes, setEditingOutcomes] = useState(false);
  const [outcomeDrafts, setOutcomeDrafts] = useState(initialOutcomes);

  const [roles, setRoles]         = useState(initialRoles);
  const [editingRoleIdx, setEditingRoleIdx] = useState<number | null>(null);
  const [roleDraft, setRoleDraft] = useState<{ person_name: string; description: string } | null>(null);
  const [openRuleId, setOpenRuleId] = useState<string | null>(null);

  // ── Overview field saves ───────────────────────────────────────────────────

  function handleIntentionSave(v: string) {
    setIntention(v);
    updateOverviewField(projectId, "intention", v);
  }
  function handleMwtaSave(v: string) {
    setMwta(v);
    updateOverviewField(projectId, "mwta", v);
  }
  function handlePointASave(v: string) {
    setPointA(v);
    updateOverviewField(projectId, "point_a", v);
  }
  function handlePointBSave(v: string) {
    setPointB(v);
    updateOverviewField(projectId, "point_b", v);
  }

  // ── Outcomes ───────────────────────────────────────────────────────────────

  async function handleSaveOutcomes() {
    await saveOutcomes(projectId, outcomeDrafts.map(o => o.text));
    setOutcomes(outcomeDrafts.map((o, i) => ({ ...o, id: o.id ?? String(i) })));
    setEditingOutcomes(false);
  }
  function cancelOutcomes() { setOutcomeDrafts(outcomes); setEditingOutcomes(false); }
  function addOutcome() { setOutcomeDrafts([...outcomeDrafts, { id: "", text: "" }]); }
  function removeOutcome(i: number) { setOutcomeDrafts(outcomeDrafts.filter((_, idx) => idx !== i)); }
  function updateOutcome(i: number, text: string) {
    setOutcomeDrafts(outcomeDrafts.map((o, idx) => idx === i ? { ...o, text } : o));
  }

  // ── Roles ──────────────────────────────────────────────────────────────────

  function addRole() {
    const newRoles = [...roles, { id: "", person_name: "", description: "" }];
    setRoles(newRoles);
    setEditingRoleIdx(newRoles.length - 1);
    setRoleDraft({ person_name: "", description: "" });
  }
  function removeRole(idx: number) {
    const updated = roles.filter((_, i) => i !== idx);
    setRoles(updated);
    setEditingRoleIdx(null);
    setRoleDraft(null);
    saveRoles(projectId, updated.map(r => ({ person_name: r.person_name, description: r.description })));
  }
  function startEditRole(idx: number) {
    setEditingRoleIdx(idx);
    setRoleDraft({ person_name: roles[idx].person_name, description: roles[idx].description });
  }
  function cancelEditRole() {
    // Remove if it was a brand-new unsaved role
    if (editingRoleIdx !== null && roles[editingRoleIdx]?.id === "") {
      setRoles(roles.filter((_, i) => i !== editingRoleIdx));
    }
    setEditingRoleIdx(null);
    setRoleDraft(null);
  }
  async function saveRole(idx: number) {
    if (!roleDraft) return;
    const updated = roles.map((r, i) => i === idx ? { ...r, ...roleDraft } : r);
    setRoles(updated);
    setEditingRoleIdx(null);
    setRoleDraft(null);
    await saveRoles(projectId, updated.map(r => ({ person_name: r.person_name, description: r.description })));
  }

  return (
    <div className="max-w-3xl space-y-12">

      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-2">
          {familyName}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Projeto</h1>
      </div>

      {/* ── Intenção ── */}
      <section>
        <SectionTitle title="Intenção" help="A intenção principal do projeto como um todo." />
        <EditableText value={intention} onChange={handleIntentionSave} rows={5} />
      </section>

      {/* ── Desired Outcome ── */}
      <section>
        <SectionTitle title="Desired Outcome" help="Os resultados concretos esperados ao final do processo." />

        {!editingOutcomes ? (
          <div className="group relative">
            <div className="space-y-2 pr-8">
              {outcomes.map((o, i) => (
                <div key={o.id || i} className="flex gap-3 text-sm text-foreground leading-relaxed">
                  <span className="text-muted-foreground/40 tabular-nums flex-shrink-0">{i + 1}.</span>
                  <span>{o.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setOutcomeDrafts(outcomes); setEditingOutcomes(true); }}
              className="absolute top-0 right-0 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {outcomeDrafts.map((o, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-muted-foreground/40 text-sm mt-2.5 tabular-nums flex-shrink-0 w-4">{i + 1}.</span>
                <textarea
                  value={o.text}
                  onChange={(e) => updateOutcome(i, e.target.value)}
                  rows={2}
                  placeholder="Resultado esperado..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                />
                <button onClick={() => removeOutcome(i)} className="mt-2 p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={addOutcome} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
              <Plus className="w-3.5 h-3.5" /> Adicionar resultado
            </button>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={handleSaveOutcomes} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                <Check className="w-3 h-3" /> Salvar
              </button>
              <button onClick={cancelOutcomes} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            </div>
          </div>
        )}
      </section>

      {/* ── MWTA ── */}
      <section>
        <SectionTitle
          title="MWTA · Meet Where They Are"
          help="Permite acessarmos com precisão a realidade da família hoje. Nos ajudará a definir o escopo do projeto."
        />
        <CollapsibleInstructions>
          <p className="font-medium text-foreground/80">Preencha a partir das seguintes perguntas:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Quem é o público e como estão se sentindo?</li>
            <li>O que precisam hoje?</li>
            <li>Quais as suas necessidades agora?</li>
            <li>O que esperam da experiência?</li>
            <li>Algo os preocupa e gera tensão?</li>
          </ul>
        </CollapsibleInstructions>
        <EditableText value={mwta} onChange={handleMwtaSave} rows={5} placeholder="Descreva onde a família está hoje..." />
      </section>

      {/* ── Ponto A ── */}
      <section>
        <SectionTitle title="Ponto A" help="A fotografia do estado atual da família." italic />
        <CollapsibleInstructions>
          <p className="font-medium text-foreground/80">Descreva a situação atual como se fosse a fotografia da realidade hoje. Considere os seguintes tópicos para construir esse cenário:</p>
          <div className="space-y-3 mt-2">
            <div>
              <span className="font-medium text-foreground/80">Individual:</span> os membros da família possuem individualmente um bom entendimento sobre o seu contexto sendo parte de uma família empreendedora? Conseguem entender o seu papel no sistema empresarial-familiar no curto, médio e longo prazo? Cada um consegue ter clareza das definições sobre o futuro dos negócios e como isso impacta a sua trajetória pessoal e profissional?
              <ul className="mt-1.5 space-y-1 list-disc list-inside ml-2">
                <li><span className="font-medium text-foreground/80">Geração atual:</span> tem visão de futuro da família empreendedora (visão de portfólio), alinhamento sobre como vai ser a sucessão da propriedade, da gestão do negócio? A partir destas definições, entende a necessidade de desenvolver a próxima geração, de fazer a transição de poder para ela e qual papel vai desempenhar no futuro?</li>
                <li><span className="font-medium text-foreground/80">Próxima geração:</span> a partir da orientação e visão da geração atual, entende se e como gostaria de se relacionar com a família empreendedora? A partir desta definição, está em uma trajetória de desenvolvimento para conseguir agregar valor ao contexto da família empreendedora em harmonia com a sua trajetória pessoal e profissional?</li>
              </ul>
            </div>
            <div><span className="font-medium text-foreground/80">Relacional:</span> as relações em cada uma das esferas, na família, no negócio e na sociedade, estão funcionais? Existem conflitos que causam rupturas ou uma incapacidade de convivência? Todos se respeitam e entendem os seus direitos e deveres a depender do papel que ocupam no sistema e se comunicam e alinham de forma recorrente?</div>
            <div><span className="font-medium text-foreground/80">Empreendedora:</span> existe uma clareza para os líderes do negócio sobre o futuro e planejamento estratégico do empreendimento, que fase ele está e do que precisa para prosperar? Isso é transmitido para a próxima geração que consegue entender quais são as suas oportunidades e necessidades de desenvolvimento?</div>
            <div><span className="font-medium text-foreground/80">Estrutural:</span> os entendimentos sobre como será a sucessão, passagem da propriedade, gestão do negócio, direitos e deveres de sócios, familiares e executivos estão formalizados com instrumentos e políticas conhecidas por todos? Existem fóruns que dão recorrência e consistência para a tomada de decisão, alinhamento e compartilhamento de informações entre toda a família e empresa?</div>
          </div>
        </CollapsibleInstructions>
        <EditableText value={pointA} onChange={handlePointASave} rows={8} />
      </section>

      {/* ── Ponto B ── */}
      <section>
        <SectionTitle title="Ponto B" help="A fotografia do estado desejado para a família ao final do projeto." italic />
        <CollapsibleInstructions>
          <p className="font-medium text-foreground/80">Descreva o estado desejado ao final do processo. Considere as quatro dimensões:</p>
          <div className="space-y-3 mt-2">
            <div>
              <span className="font-medium text-foreground/80">Individual:</span> os membros da família possuem individualmente um bom entendimento sobre o seu contexto sendo parte de uma família empreendedora? Conseguem entender o seu papel no sistema empresarial-familiar no curto, médio e longo prazo? Cada um consegue ter clareza das definições sobre o futuro dos negócios e como isso impacta a sua trajetória pessoal e profissional?
              <ul className="mt-1.5 space-y-1 list-disc list-inside ml-2">
                <li><span className="font-medium text-foreground/80">Geração atual:</span> tem visão de futuro da família empreendedora (visão de portfólio), alinhamento sobre como vai ser a sucessão da propriedade, da gestão do negócio? A partir destas definições, entende a necessidade de desenvolver a próxima geração, de fazer a transição de poder para ela e qual papel vai desempenhar no futuro?</li>
                <li><span className="font-medium text-foreground/80">Próxima geração:</span> a partir da orientação e visão da geração atual, entende se e como gostaria de se relacionar com a família empreendedora? A partir desta definição, está em uma trajetória de desenvolvimento para conseguir agregar valor ao contexto da família empreendedora em harmonia com a sua trajetória pessoal e profissional?</li>
              </ul>
            </div>
            <div><span className="font-medium text-foreground/80">Relacional:</span> as relações em cada uma das esferas, na família, no negócio e na sociedade, estão funcionais? Existem conflitos que causam rupturas ou uma incapacidade de convivência? Todos se respeitam e entendem os seus direitos e deveres a depender do papel que ocupam no sistema e se comunicam e alinham de forma recorrente?</div>
            <div><span className="font-medium text-foreground/80">Empreendedora:</span> existe uma clareza para os líderes do negócio sobre o futuro e planejamento estratégico do empreendimento, que fase ele está e do que precisa para prosperar? Isso é transmitido para a próxima geração que consegue entender quais são as suas oportunidades e necessidades de desenvolvimento?</div>
            <div><span className="font-medium text-foreground/80">Estrutural:</span> os entendimentos sobre como será a sucessão, passagem da propriedade, gestão do negócio, direitos e deveres de sócios, familiares e executivos estão formalizados com instrumentos e políticas conhecidas por todos? Existem fóruns que dão recorrência e consistência para a tomada de decisão, alinhamento e compartilhamento de informações entre toda a família e empresa?</div>
          </div>
        </CollapsibleInstructions>
        <EditableText value={pointB} onChange={handlePointBSave} rows={8} />
      </section>

      {/* ── Regras ── */}
      <section>
        <SectionTitle title="Regras" help="Acordos de postura e convivência durante o processo." />
        <div className="space-y-2">
          {rules.map((rule) => {
            const isOpen = openRuleId === rule.id;
            return (
              <div key={rule.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenRuleId(isOpen ? null : rule.id)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                >
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  <span className="text-sm font-medium text-foreground">{rule.title}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed">{rule.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Papeis ── */}
      <section>
        <SectionTitle title="Papeis" help="Quem faz o quê neste projeto." />
        <div className="space-y-2">
          {roles.map((role, idx) => {
            const key = role.id || String(idx);
            const isEditing = editingRoleIdx === idx;

            if (isEditing && roleDraft) {
              return (
                <div key={key} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</p>
                    <input
                      value={roleDraft.person_name}
                      onChange={(e) => setRoleDraft({ ...roleDraft, person_name: e.target.value })}
                      autoFocus
                      placeholder="Nome da pessoa..."
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Papel</p>
                    <textarea
                      value={roleDraft.description}
                      onChange={(e) => setRoleDraft({ ...roleDraft, description: e.target.value })}
                      rows={3}
                      placeholder="Descrição do papel..."
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => saveRole(idx)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                      <Check className="w-3 h-3" /> Salvar
                    </button>
                    <button onClick={cancelEditRole} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className="group relative border border-border rounded-lg px-4 py-3">
                <div className="pr-14">
                  <p className="text-sm font-medium text-foreground">{role.person_name || "Novo papel"}</p>
                  {role.description && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{role.description}</p>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <button onClick={() => startEditRole(idx)} className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors" title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeRole(idx)} className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors" title="Remover">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          <button onClick={addRole} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
            <Plus className="w-3.5 h-3.5" /> Novo papel
          </button>
        </div>
      </section>

    </div>
  );
}
