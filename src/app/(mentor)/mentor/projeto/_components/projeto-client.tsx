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

export function ProjetoClient({ projectId, familyName, overview, outcomes: initialOutcomes, rules, roles: initialRoles }: Props) {
  const [intention, setIntention] = useState(overview.intention);
  const [mwta, setMwta]           = useState(overview.mwta);
  const [pointA, setPointA]       = useState(overview.point_a);
  const [pointB, setPointB]       = useState(overview.point_b);

  const [outcomes, setOutcomes]           = useState(initialOutcomes);
  const [editingOutcomes, setEditingOutcomes] = useState(false);
  const [outcomeDrafts, setOutcomeDrafts] = useState(initialOutcomes);

  const [roles, setRoles]     = useState(initialRoles);
  const [savingRoles, setSavingRoles] = useState(false);
  const [openRuleId, setOpenRuleId]   = useState<string | null>(null);
  const [openRoleId, setOpenRoleId]   = useState<string | null>(null);

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
    setRoles([...roles, { id: "", person_name: "", description: "" }]);
  }
  function removeRole(id: string) {
    setRoles(roles.filter(r => r.id !== id || r.id === ""));
  }
  function updateRole(idx: number, field: "person_name" | "description", v: string) {
    setRoles(roles.map((r, i) => i === idx ? { ...r, [field]: v } : r));
  }
  async function handleSaveRoles() {
    setSavingRoles(true);
    await saveRoles(projectId, roles.map(r => ({ person_name: r.person_name, description: r.description })));
    setSavingRoles(false);
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
          <p className="font-medium text-foreground/80">Descreva a situação atual como se fosse a fotografia da realidade hoje. Tente responder às seguintes perguntas:</p>
          <div className="space-y-2 mt-2">
            <div><span className="font-medium text-foreground/80">Individual:</span> qual é o entendimento dos membros sobre seus papéis, relação com a família e impacto em sua vida?</div>
            <div><span className="font-medium text-foreground/80">Relacional:</span> como acontecem as relações a partir do entendimento das dimensões envolvidas: a família, no negócio e na sociedade?</div>
            <div><span className="font-medium text-foreground/80">Empreendedora:</span> existe clareza e alinhamento sobre o futuro e planejamento estratégico do empreendimento?</div>
            <div><span className="font-medium text-foreground/80">Estrutural:</span> os entendimentos sobre como será a sucessão estão formalizados com instrumentos e políticas conhecidas por todos?</div>
          </div>
        </CollapsibleInstructions>
        <EditableText value={pointA} onChange={handlePointASave} rows={8} />
      </section>

      {/* ── Ponto B ── */}
      <section>
        <SectionTitle title="Ponto B" help="A fotografia do estado desejado para a família ao final do projeto." italic />
        <CollapsibleInstructions>
          <p className="font-medium text-foreground/80">Descreva o estado desejado ao final do processo. Considere as mesmas quatro dimensões:</p>
          <div className="space-y-2 mt-2">
            <div><span className="font-medium text-foreground/80">Individual:</span> como cada membro se vê em relação à família empreendedora?</div>
            <div><span className="font-medium text-foreground/80">Relacional:</span> como são as relações entre os membros?</div>
            <div><span className="font-medium text-foreground/80">Empreendedora:</span> a visão e estratégia do negócio estão claras e alinhadas entre as gerações?</div>
            <div><span className="font-medium text-foreground/80">Estrutural:</span> todos os instrumentos, acordos e políticas estão implementados e conhecidos?</div>
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
            const isOpen = openRoleId === (role.id || String(idx));
            const key = role.id || String(idx);
            return (
              <div key={key} className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <button onClick={() => setOpenRoleId(isOpen ? null : key)} className="flex-shrink-0">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                  {isOpen ? (
                    <input
                      value={role.person_name}
                      onChange={(e) => updateRole(idx, "person_name", e.target.value)}
                      className="flex-1 text-sm font-medium bg-transparent border-b border-border focus:outline-none py-0.5 placeholder:text-muted-foreground/40"
                      placeholder="Nome da pessoa..."
                    />
                  ) : (
                    <div className="flex-1 flex items-baseline gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground flex-shrink-0">{role.person_name || "Novo papel"}</span>
                      {role.description && (
                        <span className="text-xs text-muted-foreground/60 truncate">— {role.description.slice(0, 70)}…</span>
                      )}
                    </div>
                  )}
                  <button onClick={() => removeRole(role.id)} className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-border">
                    <textarea
                      value={role.description}
                      onChange={(e) => updateRole(idx, "description", e.target.value)}
                      rows={3}
                      placeholder="Descrição do papel..."
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                    />
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-4 mt-2">
            <button onClick={addRole} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="w-3.5 h-3.5" /> Novo papel
            </button>
            <button
              onClick={handleSaveRoles}
              disabled={savingRoles}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> {savingRoles ? "Salvando…" : "Salvar papeis"}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
