"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check, X, Plus, Trash2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  updateFamilyField,
  saveFamilyMember,
  deleteFamilyMember,
  linkSpouse,
  unlinkSpouse,
  swapMemberOrder,
  updateMemberProfileUrl,
} from "@/lib/actions/mentor";
import { GovernancaTab } from "./governanca-tab";
import { PropriedadeTab } from "./propriedade-tab";
import { TermometroSection } from "./termometro-section";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Member {
  id: string; name: string; initials: string; generation: number;
  family_role: string; business_role: string; parent_id: string | null;
  works_in_business: boolean; notes: string;
  order_index: number; spouse_id: string | null; profile_url: string | null;
}

interface FamilyData {
  id: string; name: string;
  history: string; mission: string; vision: string; values: string;
}

interface GovernanceItem {
  id: string; domain: string; item_text: string;
  order_index: number; has_today: boolean | null; wants: boolean | null;
}
interface Asset {
  id: string; name: string; asset_type: string;
  description: string | null; order_index: number;
}
interface Ownership { id: string; asset_id: string; family_member_id: string | null; member_name: string | null; percentage: number | null }
interface Successor { id: string; full_name: string; termometro_pdf_url: string | null }

interface Props {
  family: FamilyData;
  members: Member[];
  governanceItems: GovernanceItem[];
  assets: Asset[];
  ownership: Ownership[];
  successors: Successor[];
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

// ── MemberNode ─────────────────────────────────────────────────────────────────

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
        <span className="text-xs font-semibold">{member.initials || "?"}</span>
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

// ── CoupleConnector ────────────────────────────────────────────────────────────

function CoupleConnector() {
  return (
    <div className="flex flex-col items-center justify-center mx-1 self-center mb-5">
      <div className="w-6 h-px bg-foreground/50" />
      <div className="h-1" />
      <div className="w-6 h-px bg-foreground/50" />
    </div>
  );
}

// ── TreeNode ───────────────────────────────────────────────────────────────────

function TreeNode({ member, spouse, allMembers, selectedId, onSelect, onAddChild }: {
  member: Member; spouse?: Member; allMembers: Member[]; selectedId: string | null;
  onSelect: (m: Member) => void; onAddChild: (parentId: string, gen: number) => void;
}) {
  // Children = those whose parent_id matches either this member or their spouse
  const allChildren = allMembers
    .filter(m => m.parent_id === member.id || (spouse && m.parent_id === spouse.id))
    .sort((a, b) => a.order_index - b.order_index);

  // De-duplicate: don't render a child twice if they appear as both member and spouse
  const childrenToRender: Member[] = [];
  const renderedChildIds = new Set<string>();
  for (const child of allChildren) {
    if (renderedChildIds.has(child.id)) continue;
    childrenToRender.push(child);
    renderedChildIds.add(child.id);
    if (child.spouse_id) renderedChildIds.add(child.spouse_id);
  }

  return (
    <div className="inline-flex flex-col items-center">
      {/* Member row (with optional spouse) */}
      <div className="flex items-start">
        <MemberNode member={member} selected={selectedId === member.id} onSelect={() => onSelect(member)} />
        {spouse && (
          <>
            <CoupleConnector />
            <MemberNode member={spouse} selected={selectedId === spouse.id} onSelect={() => onSelect(spouse)} />
          </>
        )}
      </div>

      {/* Add child button */}
      <button
        onClick={() => onAddChild(member.id, member.generation + 1)}
        className="mt-1 w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-foreground transition-colors"
        title="Adicionar filho"
      >
        <Plus className="w-3 h-3" />
      </button>

      {/* Children */}
      {childrenToRender.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-px h-5 bg-border" />
          <div className="relative flex gap-3">
            {childrenToRender.length > 1 && (
              <div className="absolute top-0 h-px bg-border" style={{ left: 40, right: 40 }} />
            )}
            {childrenToRender.map((child) => {
              const childSpouse = child.spouse_id ? allMembers.find(m => m.id === child.spouse_id) : undefined;
              return (
                <div key={child.id} className="inline-flex flex-col items-center">
                  <div className="w-px h-5 bg-border" />
                  <TreeNode
                    member={child} spouse={childSpouse}
                    allMembers={allMembers} selectedId={selectedId}
                    onSelect={onSelect} onAddChild={onAddChild}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ProfileField ───────────────────────────────────────────────────────────────

function ProfileField({ profileUrl, onSave }: { profileUrl: string | null; onSave: (url: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profileUrl ?? "");

  function startEdit() { setDraft(profileUrl ?? ""); setEditing(true); }
  function save() {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    setEditing(false);
  }
  function cancel() { setDraft(profileUrl ?? ""); setEditing(false); }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          placeholder="https://..."
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
        />
        <div className="flex items-center gap-3">
          <button onClick={save} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
            <Check className="w-3 h-3" /> Salvar
          </button>
          <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
        </div>
      </div>
    );
  }

  if (profileUrl) {
    return (
      <div className="flex items-center gap-2">
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-foreground hover:underline">
          Ver perfil <ExternalLink className="w-3 h-3" />
        </a>
        <button onClick={startEdit} className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors" title="Editar">
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <button onClick={startEdit} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
      + Adicionar perfil
    </button>
  );
}

// ── EditPanel ──────────────────────────────────────────────────────────────────

function EditPanel({ member, allMembers, siblings, availableSpouses, onChange, onSave, onDelete, onClose, onMoveLeft, onMoveRight, onLinkSpouse, onUnlinkSpouse, onSaveProfileUrl }: {
  member: Member; allMembers: Member[];
  siblings: Member[];
  availableSpouses: Member[];
  onChange: (patch: Partial<Member>) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onLinkSpouse: (spouseId: string) => void;
  onUnlinkSpouse: () => void;
  onSaveProfileUrl: (url: string) => void;
}) {
  const hasChildren = allMembers.some(m => m.parent_id === member.id);
  const siblingsSorted = [...siblings].sort((a, b) => a.order_index - b.order_index);
  const myPosition = siblingsSorted.findIndex(s => s.id === member.id);
  const canMoveLeft  = myPosition > 0;
  const canMoveRight = myPosition < siblingsSorted.length - 1;
  const spouseMember = member.spouse_id ? allMembers.find(m => m.id === member.spouse_id) : null;

  const [selectedSpouseId, setSelectedSpouseId] = useState("");

  return (
    <div className="border border-border rounded-xl p-5 space-y-4 w-72 flex-shrink-0 h-fit">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-foreground">Editar membro</p>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fields */}
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Perfil</p>
          <ProfileField profileUrl={member.profile_url} onSave={onSaveProfileUrl} />
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Observações</p>
          <textarea value={member.notes} onChange={(e) => onChange({ notes: e.target.value })}
            rows={2} placeholder="Notas sobre este membro..."
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40" />
        </div>
      </div>

      {/* Order */}
      {siblings.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ordem entre irmãos</p>
          <div className="flex items-center gap-2">
            <button onClick={onMoveLeft} disabled={!canMoveLeft}
              className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {myPosition + 1} de {siblingsSorted.length + 1}
            </span>
            <button onClick={onMoveRight} disabled={!canMoveRight}
              className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Spouse */}
      <div className="space-y-1.5 pt-1 border-t border-border">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cônjuge</p>
        {spouseMember ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">{spouseMember.name}</span>
            <button onClick={onUnlinkSpouse} className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors">
              Desvincular
            </button>
          </div>
        ) : availableSpouses.length > 0 ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedSpouseId}
              onChange={(e) => setSelectedSpouseId(e.target.value)}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Selecionar...</option>
              {availableSpouses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={() => { if (selectedSpouseId) onLinkSpouse(selectedSpouseId); }}
              disabled={!selectedSpouseId}
              className="text-xs px-2.5 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-30"
            >
              Vincular
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic">Nenhum membro disponível da mesma geração.</p>
        )}
      </div>

      {/* Actions */}
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

export function FamiliaClient({ family, members: initialMembers, governanceItems, assets, ownership, successors }: Props) {
  const [members, setMembers]       = useState<Member[]>(initialMembers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory]       = useState(family.history);
  const [mission, setMission]       = useState(family.mission);
  const [vision, setVision]         = useState(family.vision);
  const [values, setValues]         = useState(family.values);

  const selectedMember = members.find(m => m.id === selectedId) ?? null;

  // De-duplicate root rendering: skip members already shown as a spouse
  const rootsSorted = members
    .filter(m => !m.parent_id)
    .sort((a, b) => a.order_index - b.order_index);
  const rootsToRender: Member[] = [];
  const rootRenderedIds = new Set<string>();
  for (const m of rootsSorted) {
    if (rootRenderedIds.has(m.id)) continue;
    rootsToRender.push(m);
    rootRenderedIds.add(m.id);
    if (m.spouse_id) rootRenderedIds.add(m.spouse_id);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function getSiblings(member: Member): Member[] {
    return members
      .filter(m => m.parent_id === member.parent_id && m.id !== member.id)
      .sort((a, b) => a.order_index - b.order_index);
  }

  function getAvailableSpouses(member: Member): Member[] {
    return members.filter(m =>
      m.generation === member.generation &&
      m.id !== member.id &&
      !m.spouse_id
    );
  }

  // ── Mutations ─────────────────────────────────────────────────────────────────

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
    // Compute next order_index for this parent group
    const siblings = members.filter(m => m.parent_id === parentId);
    const nextOrder = siblings.length > 0 ? Math.max(...siblings.map(m => m.order_index)) + 1 : 0;
    const tempId = `new-${Date.now()}`;
    setMembers(prev => [...prev, {
      id: tempId, name: "Novo membro", initials: "?",
      generation, family_role: "", business_role: "",
      parent_id: parentId, works_in_business: false, notes: "",
      order_index: nextOrder, spouse_id: null, profile_url: null,
    }]);
    setSelectedId(tempId);
  }

  function handleSaveProfileUrl(memberId: string, url: string) {
    updateMemberLocal(memberId, { profile_url: url });
    updateMemberProfileUrl(memberId, url);
  }

  async function handleMoveLeft(member: Member) {
    const group = members
      .filter(m => m.parent_id === member.parent_id)
      .sort((a, b) => a.order_index - b.order_index);
    const idx = group.findIndex(m => m.id === member.id);
    if (idx <= 0) return;
    const prev = group[idx - 1];
    setMembers(ms => ms.map(m => {
      if (m.id === member.id) return { ...m, order_index: prev.order_index };
      if (m.id === prev.id)   return { ...m, order_index: member.order_index };
      return m;
    }));
    await swapMemberOrder(member.id, member.order_index, prev.id, prev.order_index);
  }

  async function handleMoveRight(member: Member) {
    const group = members
      .filter(m => m.parent_id === member.parent_id)
      .sort((a, b) => a.order_index - b.order_index);
    const idx = group.findIndex(m => m.id === member.id);
    if (idx >= group.length - 1) return;
    const next = group[idx + 1];
    setMembers(ms => ms.map(m => {
      if (m.id === member.id) return { ...m, order_index: next.order_index };
      if (m.id === next.id)   return { ...m, order_index: member.order_index };
      return m;
    }));
    await swapMemberOrder(member.id, member.order_index, next.id, next.order_index);
  }

  async function handleLinkSpouse(memberId: string, spouseId: string) {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) return { ...m, spouse_id: spouseId };
      if (m.id === spouseId) return { ...m, spouse_id: memberId };
      return m;
    }));
    await linkSpouse(memberId, spouseId);
  }

  async function handleUnlinkSpouse(memberId: string) {
    const member = members.find(m => m.id === memberId);
    const spouseId = member?.spouse_id;
    setMembers(prev => prev.map(m =>
      (m.id === memberId || m.id === spouseId) ? { ...m, spouse_id: null } : m
    ));
    await unlinkSpouse(memberId);
  }

  function handleHistorySave(v: string) { setHistory(v); updateFamilyField(family.id, "history", v); }
  function handleMissionSave(v: string) { setMission(v); updateFamilyField(family.id, "mission", v); }
  function handleVisionSave(v: string)  { setVision(v);  updateFamilyField(family.id, "vision", v); }
  function handleValuesSave(v: string)  { setValues(v);  updateFamilyField(family.id, "values", v); }

  return (
    <div className="max-w-5xl space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-2">{family.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Família</h1>
      </div>

      <Tabs defaultValue="familia">
        <TabsList>
          <TabsTrigger value="familia">Família</TabsTrigger>
          <TabsTrigger value="governanca">Governança</TabsTrigger>
          <TabsTrigger value="propriedade">Propriedade</TabsTrigger>
        </TabsList>

        <TabsContent value="familia" className="space-y-12 pt-6">

      {/* ── Árvore familiar ── */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Árvore familiar</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Clique num membro para editar. Use <strong>+</strong> para adicionar filhos. Linha dupla (══) indica cônjuge.
        </p>

        <div className="flex items-start gap-8">
          <div className="flex-1 overflow-x-auto">
            <div className="inline-flex flex-col items-center py-4 min-w-full">
              <div className="flex items-start gap-0">
                {rootsToRender.map((root, i) => {
                  const rootSpouse = root.spouse_id ? members.find(m => m.id === root.spouse_id) : undefined;
                  return (
                    <div key={root.id} className="flex items-center">
                      {i > 0 && <div className="w-10 h-px bg-border" style={{ marginBottom: "60px" }} />}
                      <TreeNode
                        member={root} spouse={rootSpouse}
                        allMembers={members} selectedId={selectedId}
                        onSelect={(m) => setSelectedId(selectedId === m.id ? null : m.id)}
                        onAddChild={addMember}
                      />
                    </div>
                  );
                })}
                {/* Add root member button */}
                <div className="flex items-center ml-3" style={{ marginBottom: "60px" }}>
                  <button
                    onClick={() => addMember(null, 1)}
                    className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:border-foreground transition-colors"
                    title="Adicionar membro raiz"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-foreground border-2 border-foreground" />
                <span className="text-xs text-muted-foreground">Na empresa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-background border-2 border-border" />
                <span className="text-xs text-muted-foreground">Fora da empresa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="w-6 h-px bg-foreground/50" />
                  <div className="w-6 h-px bg-foreground/50" />
                </div>
                <span className="text-xs text-muted-foreground">Cônjuge</span>
              </div>
            </div>
          </div>

          {/* Edit panel */}
          {selectedMember && (
            <EditPanel
              member={selectedMember}
              allMembers={members}
              siblings={getSiblings(selectedMember)}
              availableSpouses={getAvailableSpouses(selectedMember)}
              onChange={(patch) => updateMemberLocal(selectedMember.id, patch)}
              onSave={handleSaveMember}
              onDelete={() => handleDeleteMember(selectedMember.id)}
              onClose={() => setSelectedId(null)}
              onMoveLeft={() => handleMoveLeft(selectedMember)}
              onMoveRight={() => handleMoveRight(selectedMember)}
              onLinkSpouse={(spouseId) => handleLinkSpouse(selectedMember.id, spouseId)}
              onUnlinkSpouse={() => handleUnlinkSpouse(selectedMember.id)}
              onSaveProfileUrl={(url) => handleSaveProfileUrl(selectedMember.id, url)}
            />
          )}
        </div>
      </section>

      {/* ── Devolutivas do Termômetro ── */}
      <TermometroSection successors={successors} />

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

        </TabsContent>

        <TabsContent value="governanca" className="pt-6">
          <GovernancaTab items={governanceItems} />
        </TabsContent>

        <TabsContent value="propriedade" className="pt-6">
          <PropriedadeTab
            familyId={family.id}
            members={members.map((m) => ({ id: m.id, name: m.name }))}
            assets={assets}
            ownership={ownership}
          />
        </TabsContent>
      </Tabs>

    </div>
  );
}
