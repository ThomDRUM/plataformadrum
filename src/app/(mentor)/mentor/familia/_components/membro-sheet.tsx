"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { FamilyMember } from "@/lib/mentor/familia";

const SELECT_CLASS =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function ProfileField({ profileUrl, onSave }: { profileUrl: string | null; onSave: (url: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profileUrl ?? "");

  function startEdit() {
    setDraft(profileUrl ?? "");
    setEditing(true);
  }
  function save() {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    setEditing(false);
  }
  function cancel() {
    setDraft(profileUrl ?? "");
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus placeholder="https://..." />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={save}>
            <Check /> Salvar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (profileUrl) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-foreground hover:underline"
        >
          Ver perfil <ExternalLink className="h-3 w-3" />
        </a>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground/40 hover:text-muted-foreground"
          onClick={startEdit}
        >
          <Pencil />
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" variant="ghost" size="sm" className="px-0 text-muted-foreground hover:text-foreground" onClick={startEdit}>
      + Adicionar perfil
    </Button>
  );
}

interface FormProps {
  member: FamilyMember;
  allMembers: FamilyMember[];
  onChange: (patch: Partial<FamilyMember>) => void;
  onSave: () => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onLinkSpouse: (spouseId: string) => void;
  onUnlinkSpouse: () => void;
  onSaveProfileUrl: (url: string) => void;
  pending: boolean;
}

function MembroForm({
  member, allMembers, onChange, onSave, onDelete,
  onMoveLeft, onMoveRight, onLinkSpouse, onUnlinkSpouse, onSaveProfileUrl, pending,
}: FormProps) {
  const [selectedSpouseId, setSelectedSpouseId] = useState("");

  const hasChildren = allMembers.some((m) => m.parent_id === member.id);
  const siblings = allMembers
    .filter((m) => m.parent_id === member.parent_id && m.id !== member.id)
    .sort((a, b) => a.order_index - b.order_index);
  const myPosition = siblings.findIndex((s) => s.order_index > member.order_index);
  const position = myPosition === -1 ? siblings.length : myPosition;
  const canMoveLeft = position > 0;
  const canMoveRight = position < siblings.length;
  const spouseMember = member.spouse_id ? allMembers.find((m) => m.id === member.spouse_id) : null;
  const availableSpouses = allMembers.filter(
    (m) => m.generation === member.generation && m.id !== member.id && !m.spouse_id
  );

  function handleDelete() {
    if (hasChildren) {
      toast.error("Remova os filhos deste membro antes de excluí-lo.");
      return;
    }
    onDelete();
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Editar membro</SheetTitle>
        <SheetDescription>Dados deste membro da árvore familiar.</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome</p>
          <Input value={member.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Nome completo" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Iniciais</p>
          <Input value={member.initials} onChange={(e) => onChange({ initials: e.target.value })} placeholder="AR" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Papel na família</p>
          <Input
            value={member.family_role}
            onChange={(e) => onChange({ family_role: e.target.value })}
            placeholder="Filho, Fundador..."
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Papel na empresa</p>
          <Input
            value={member.business_role}
            onChange={(e) => onChange({ business_role: e.target.value })}
            placeholder="CEO, Diretora... (opcional)"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Geração</p>
          <Input
            type="number"
            min={1}
            value={member.generation}
            onChange={(e) => onChange({ generation: parseInt(e.target.value, 10) || 1 })}
            className="w-20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id={`works-${member.id}`}
            checked={member.works_in_business}
            onCheckedChange={(checked) => onChange({ works_in_business: checked === true })}
          />
          <label htmlFor={`works-${member.id}`} className="cursor-pointer text-sm text-foreground">
            Trabalha na empresa
          </label>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Perfil</p>
          <ProfileField profileUrl={member.profile_url} onSave={onSaveProfileUrl} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Observações</p>
          <Textarea
            value={member.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={2}
            placeholder="Notas sobre este membro..."
          />
        </div>

        {siblings.length > 0 && (
          <div className="space-y-1.5 border-t border-border pt-3">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Ordem entre irmãos</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon-sm" disabled={!canMoveLeft} onClick={onMoveLeft}>
                <ChevronLeft />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {position + 1} de {siblings.length + 1}
              </span>
              <Button type="button" variant="outline" size="icon-sm" disabled={!canMoveRight} onClick={onMoveRight}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Cônjuge</p>
          {spouseMember ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{spouseMember.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground/50 hover:text-destructive"
                onClick={onUnlinkSpouse}
              >
                Desvincular
              </Button>
            </div>
          ) : availableSpouses.length > 0 ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedSpouseId}
                onChange={(e) => setSelectedSpouseId(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Selecionar...</option>
                {availableSpouses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                disabled={!selectedSpouseId}
                onClick={() => selectedSpouseId && onLinkSpouse(selectedSpouseId)}
              >
                Vincular
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">Nenhum membro disponível da mesma geração.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border p-4">
        <Button type="button" size="sm" disabled={pending} onClick={onSave}>
          <Check /> Salvar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground/50 hover:text-destructive"
          onClick={handleDelete}
          title={hasChildren ? "Remova os filhos primeiro" : "Excluir membro"}
        >
          <Trash2 />
          {hasChildren ? "Tem filhos" : "Excluir"}
        </Button>
      </div>
    </>
  );
}

interface Props {
  member: FamilyMember | null;
  allMembers: FamilyMember[];
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<FamilyMember>) => void;
  onSave: () => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onLinkSpouse: (spouseId: string) => void;
  onUnlinkSpouse: () => void;
  onSaveProfileUrl: (url: string) => void;
  pending: boolean;
}

export function MembroSheet({ member, allMembers, onOpenChange, ...handlers }: Props) {
  return (
    <Sheet open={member !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {member && <MembroForm key={member.id} member={member} allMembers={allMembers} {...handlers} />}
      </SheetContent>
    </Sheet>
  );
}
