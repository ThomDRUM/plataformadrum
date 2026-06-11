"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import {
  updateFamilyField,
  saveFamilyMember,
  deleteFamilyMember,
} from "@/lib/actions/mentor";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Member {
  id: string; name: string; initials: string; generation: number;
  family_role: string; business_role: string; parent_id: string | null;
  works_in_business: boolean; notes: string;
}

interface FamilyData {
  id: string; name: string;
  history: string; mission: string; vision: string; values: string;
}

interface Props {
  family: FamilyData;
  members: Member[];
}

// ── EditableText ───────────────────────────────────────────────────────────────

function EditableText({ value, onChange, rows = 4, placeholder = "—" }: {
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
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={rows} autoFocus
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-center gap-3 mt-2">
          <button onClick={save} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
            <Check className="w-3 h-3" /> Salvar
          </button>
          <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <p className={cn("text-sm leading-relaxed pr-8", value ? "text-foreground" : "text-muted-foreground/40")}>{value || placeholder}</p>
      <button onClick={startEdit} className="absolute top-0 right-0 p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors">
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Member node ────────────────────────────────────────────────────────────────

function MemberNode({ member, selected, onSelect }: {
  member: Member; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn("flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors w-20", selected ? "bg-accent" : "hover:bg-muted/50")}
    >
      <div className={cn(
        "w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0",
        member.works_in_business ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground"
      )}>
        <span className="text-xs font-semibold">{member.initials}</span>
      </div>
      <div className="text-center w-full">
        <p className="text-[11px] font-medium text-foreground leading-tight truncate">{member.name}</p>
        <p className="text-[10px] text-muted-foreground leading-tight truncate">{member.family_role}</p>
        {member.business_role && (
          <p className="text-[10px] text-muted-foreground/60 leading-tight truncate">{member.business_role}</p>
        )}
      </div>
    </button>
  );
}

// ── Recursive tree node ────────────────────────────────────────────────────────

function TreeNode({ member, allMembers, selectedId, onSelect, onAddChild }: {
  member: Member; allMembers: Member[]; selectedId: string | null;
  onSelect: (m: Member) => void; onAddChild: (parentId: string, gen: number) => void;
}) {
  const children = allMembers.filter(m => m.parent_id === member.id);

  return (
    <div className="inline-flex flex-col items-center">
      <MemberNode member={member} selected={selectedId === member.id} onSelect={() => onSelect(member)} />
      <button
        onClick={() => onAddChild(member.id, member.generation + 1)}
        className="mt-1 w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-foreground transition-colors"
        title={`Adicionar filho de ${member.name}`}
      >
        <Plus className="w-3 h-3" />
      </button>
      {children.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-px h-5 bg-border" />
          <div className="relative flex gap-3">
            {children.length > 1 && (
              <div className="absolute top-0 h-px bg-border" style={{ left: 40, right: 40 }} />
            )}
            {children.map((child) => (
              <div key={child.id} className="inline-flex flex-col items-center">
                <div className="w-px h-5 bg-border" />
                <TreeNode member={child} allMembers={allMembers} selectedId={selectedId} onSelect={onSelect} onAddChild={onAddChild} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit panel ─────────────────────────────────────────────────────────────────

function EditPanel({ member, allMembers, onChange, onSave, onDelete, onClose }: {
  member: Member; allMembers: Member[];
  onChange: (patch: Partial<Member>) => void;
  onSave: () => void;
  onDelete: () => void; onClose: () => void;
}) {
  const hasChildren = allMembers.some(m => m.parent_id === member.id);

  return (
    <div className="border border-border rounded-xl p-5 space-y-4 w-72 flex-shrink-0 h-fit">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-foreground">Editar membro</p>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {[
          { label: "Nome", field: "name" as const, placeholder: "Nome completo" },
          { label: "Iniciais", field: "initials" as const, placeholder: "AR" },
          { label: "Papel na família", field: "family_role" as const, placeholder: "Filho, Fundador..." },
          { label: "Papel na empresa", field: "business_role" as const, placeholder: "CEO, Diretora... (opcional)" },
        ].map(({ label, field, placeholder }) => (
          <div key={field} className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <input
              value={member[field] as string}
              onChange={(e) => onChange({ [field]: e.target.value })}
              placeholder={placeholder}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
            />
          </div>
        ))}

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Geração</p>
          <input type="number" min={1} value={member.generation}
            onChange={(e) => onChange({ generation: parseInt(e.target.value) || 1 })}
            className="w-20 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id={`works-${member.id}`} checked={member.works_in_business}
            onChange={(e) => onChange({ works_in_business: e.target.checked })}
            className="h-4 w-4 rounded border-border" />
          <label htmlFor={`works-${member.id}`} className="text-sm text-foreground cursor-pointer">Trabalha na empresa</label>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</p>
          <textarea value={member.notes} onChange={(e) => onChange({ notes: e.target.value })}
            rows={2} placeholder="Notas sobre este membro..."
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <button onClick={onSave}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
          <Check className="w-3 h-3" /> Salvar
        </button>
        <button
          onClick={() => {
            if (hasChildren) { alert("Remova os filhos deste membro antes de excluí-lo."); return; }
            onDelete();
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
          title={hasChildren ? "Remova os filhos primeiro" : "Excluir membro"}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {hasChildren ? "Tem filhos" : "Excluir"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FamiliaClient({ family, members: initialMembers }: Props) {
  const [members, setMembers]   = useState<Member[]>(initialMembers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory]   = useState(family.history);
  const [mission, setMission]   = useState(family.mission);
  const [vision, setVision]     = useState(family.vision);
  const [values, setValues]     = useState(family.values);

  const selectedMember = members.find(m => m.id === selectedId) ?? null;
  const roots = members.filter(m => !m.parent_id);

  function updateMemberLocal(id: string, patch: Partial<Member>) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  }

  async function handleSaveMember() {
    if (!selectedMember) return;
    const result = await saveFamilyMember(family.id, {
      ...selectedMember,
      id: selectedMember.id.startsWith("new-") ? null : selectedMember.id,
    });
    if (result && selectedMember.id.startsWith("new-")) {
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, id: result.id } : m));
    }
    setSelectedId(null);
  }

  async function handleDeleteMember(id: string) {
    if (!id.startsWith("new-")) await deleteFamilyMember(id);
    setMembers(prev => prev.filter(m => m.id !== id));
    setSelectedId(null);
  }

  function addMember(parentId: string | null, generation: number) {
    const tempId = `new-${Date.now()}`;
    setMembers(prev => [...prev, {
      id: tempId, name: "Novo membro", initials: "?",
      generation, family_role: "", business_role: "",
      parent_id: parentId, works_in_business: false, notes: "",
    }]);
    setSelectedId(tempId);
  }

  function handleHistorySave(v: string) { setHistory(v); updateFamilyField(family.id, "history", v); }
  function handleMissionSave(v: string) { setMission(v); updateFamilyField(family.id, "mission", v); }
  function handleVisionSave(v: string)  { setVision(v);  updateFamilyField(family.id, "vision", v); }
  function handleValuesSave(v: string)  { setValues(v);  updateFamilyField(family.id, "values", v); }

  return (
    <div className="max-w-5xl space-y-12">

      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-2">{family.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Família</h1>
      </div>

      {/* ── Árvore familiar ── */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Árvore familiar</h2>
        <p className="text-sm text-muted-foreground mb-6">Clique num membro para editar. Use o <strong>+</strong> para adicionar filhos.</p>

        <div className="flex items-start gap-8">
          <div className="flex-1 overflow-x-auto">
            <div className="inline-flex flex-col items-center py-4 min-w-full">
              <div className="flex items-start gap-0">
                {roots.map((root, i) => (
                  <div key={root.id} className="flex items-center">
                    {i > 0 && <div className="w-10 h-px bg-border" style={{ marginBottom: "60px" }} />}
                    <TreeNode
                      member={root} allMembers={members} selectedId={selectedId}
                      onSelect={(m) => setSelectedId(selectedId === m.id ? null : m.id)}
                      onAddChild={addMember}
                    />
                  </div>
                ))}
                <div className="flex items-center ml-2" style={{ marginBottom: "60px" }}>
                  <button onClick={() => addMember(null, 1)}
                    className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-foreground transition-colors"
                    title="Adicionar membro raiz">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-foreground border-2 border-foreground" />
                <span className="text-xs text-muted-foreground">Na empresa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-background border-2 border-border" />
                <span className="text-xs text-muted-foreground">Fora da empresa</span>
              </div>
            </div>
          </div>

          {selectedMember && (
            <EditPanel
              member={selectedMember} allMembers={members}
              onChange={(patch) => updateMemberLocal(selectedMember.id, patch)}
              onSave={handleSaveMember}
              onDelete={() => handleDeleteMember(selectedMember.id)}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </section>

      {/* ── Breve história da família ── */}
      <section className="max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Breve história da família</h2>
        <p className="text-sm text-muted-foreground mb-4">Contexto histórico e trajetória da família empresária.</p>
        <EditableText value={history} onChange={handleHistorySave} rows={5} placeholder="Descreva a história da família..." />
      </section>

      {/* ── Missão ── */}
      <section className="max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Missão</h2>
        <p className="text-sm text-muted-foreground mb-4">O propósito central da família empresária.</p>
        <EditableText value={mission} onChange={handleMissionSave} rows={3} placeholder="A missão da família..." />
      </section>

      {/* ── Visão ── */}
      <section className="max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Visão</h2>
        <p className="text-sm text-muted-foreground mb-4">Onde a família quer chegar.</p>
        <EditableText value={vision} onChange={handleVisionSave} rows={3} placeholder="A visão de futuro da família..." />
      </section>

      {/* ── Valores ── */}
      <section className="max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Valores</h2>
        <p className="text-sm text-muted-foreground mb-4">Os princípios que guiam as decisões e comportamentos.</p>
        <EditableText value={values} onChange={handleValuesSave} rows={3} placeholder="Os valores da família..." />
      </section>

    </div>
  );
}
