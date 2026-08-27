"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Pencil, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Frame, FrameHeader, FrameTitle, FrameDescription, FramePanel } from "@/components/reui/frame";
import {
  updateFamilyField,
  saveFamilyMember,
  deleteFamilyMember,
  linkSpouse,
  unlinkSpouse,
  swapMemberOrder,
  updateMemberProfileUrl,
} from "@/lib/actions/mentor";
import type { FamiliaOverviewData, FamilyMember } from "@/lib/mentor/familia";
import { FamiliaTree } from "./familia-tree";
import { MembroSheet } from "./membro-sheet";
import { GovernancaTab } from "./governanca-tab";
import { PropriedadeTab } from "./propriedade-tab";
import { TermometroSection } from "./termometro-section";

type Props = FamiliaOverviewData;

function EditableText({
  value, onSave, rows = 4, placeholder = "—", pending,
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

export function FamiliaClient({ family, members: initialMembers, governanceItems, assets, ownership, successors }: Props) {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState(family.history);
  const [mission, setMission] = useState(family.mission);
  const [vision, setVision] = useState(family.vision);
  const [values, setValues] = useState(family.values);
  const [isPending, startTransition] = useTransition();

  const selectedMember = members.find((m) => m.id === selectedId) ?? null;

  // ── Overview fields ───────────────────────────────────────────────────────

  function handleHistorySave(v: string) {
    const prev = history;
    setHistory(v);
    startTransition(async () => {
      const result = await updateFamilyField(family.id, "history", v);
      if (!result.ok) {
        setHistory(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }
  function handleMissionSave(v: string) {
    const prev = mission;
    setMission(v);
    startTransition(async () => {
      const result = await updateFamilyField(family.id, "mission", v);
      if (!result.ok) {
        setMission(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }
  function handleVisionSave(v: string) {
    const prev = vision;
    setVision(v);
    startTransition(async () => {
      const result = await updateFamilyField(family.id, "vision", v);
      if (!result.ok) {
        setVision(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }
  function handleValuesSave(v: string) {
    const prev = values;
    setValues(v);
    startTransition(async () => {
      const result = await updateFamilyField(family.id, "values", v);
      if (!result.ok) {
        setValues(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Salvo.");
    });
  }

  // ── Tree mutations ────────────────────────────────────────────────────────

  function handleSelect(m: FamilyMember) {
    setSelectedId((prev) => (prev === m.id ? null : m.id));
  }

  function updateMemberLocal(id: string, patch: Partial<FamilyMember>) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function handleSaveMember() {
    if (!selectedMember) return;
    const isNew = selectedMember.id.startsWith("new-");
    const memberToSave = selectedMember;
    startTransition(async () => {
      const result = await saveFamilyMember(family.id, { ...memberToSave, id: isNew ? null : memberToSave.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (isNew) {
        setMembers((prev) => prev.map((m) => (m.id === memberToSave.id ? { ...m, id: result.data.id } : m)));
      }
      setSelectedId(null);
      toast.success("Membro salvo.");
    });
  }

  function handleDeleteMember(id: string) {
    const isNew = id.startsWith("new-");
    const prev = members;
    setMembers((p) => p.filter((m) => m.id !== id));
    setSelectedId(null);
    if (isNew) return;

    startTransition(async () => {
      const result = await deleteFamilyMember(id);
      if (!result.ok) {
        setMembers(prev);
        setSelectedId(id);
        toast.error(result.error);
        return;
      }
      toast.success("Membro removido.");
    });
  }

  function addMember(parentId: string | null, generation: number) {
    const siblings = members.filter((m) => m.parent_id === parentId);
    const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((m) => m.order_index)) + 1 : 0;
    const tempId = `new-${Date.now()}`;
    setMembers((prev) => [
      ...prev,
      {
        id: tempId,
        name: "Novo membro",
        initials: "?",
        generation,
        family_role: "",
        business_role: "",
        parent_id: parentId,
        works_in_business: false,
        notes: "",
        order_index: nextOrder,
        spouse_id: null,
        profile_url: null,
      },
    ]);
    setSelectedId(tempId);
  }

  function handleSaveProfileUrl(memberId: string, url: string) {
    const prev = members;
    updateMemberLocal(memberId, { profile_url: url });
    startTransition(async () => {
      const result = await updateMemberProfileUrl(memberId, url);
      if (!result.ok) {
        setMembers(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Perfil salvo.");
    });
  }

  function swapOrder(member: FamilyMember, direction: "left" | "right") {
    const group = members
      .filter((m) => m.parent_id === member.parent_id)
      .sort((a, b) => a.order_index - b.order_index);
    const idx = group.findIndex((m) => m.id === member.id);
    const neighborIdx = direction === "left" ? idx - 1 : idx + 1;
    if (neighborIdx < 0 || neighborIdx >= group.length) return;
    const neighbor = group[neighborIdx];

    const prev = members;
    setMembers((ms) =>
      ms.map((m) => {
        if (m.id === member.id) return { ...m, order_index: neighbor.order_index };
        if (m.id === neighbor.id) return { ...m, order_index: member.order_index };
        return m;
      })
    );
    startTransition(async () => {
      const result = await swapMemberOrder(member.id, member.order_index, neighbor.id, neighbor.order_index);
      if (!result.ok) {
        setMembers(prev);
        toast.error(result.error);
      }
    });
  }

  function handleLinkSpouse(memberId: string, spouseId: string) {
    const prev = members;
    setMembers((p) =>
      p.map((m) => {
        if (m.id === memberId) return { ...m, spouse_id: spouseId };
        if (m.id === spouseId) return { ...m, spouse_id: memberId };
        return m;
      })
    );
    startTransition(async () => {
      const result = await linkSpouse(memberId, spouseId);
      if (!result.ok) {
        setMembers(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Cônjuge vinculado.");
    });
  }

  function handleUnlinkSpouse(memberId: string) {
    const member = members.find((m) => m.id === memberId);
    const spouseId = member?.spouse_id;
    const prev = members;
    setMembers((p) => p.map((m) => (m.id === memberId || m.id === spouseId ? { ...m, spouse_id: null } : m)));
    startTransition(async () => {
      const result = await unlinkSpouse(memberId);
      if (!result.ok) {
        setMembers(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Cônjuge desvinculado.");
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground/60 uppercase">{family.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Família</h1>
      </div>

      <Tabs defaultValue="familia">
        <TabsList>
          <TabsTrigger value="familia">Família</TabsTrigger>
          <TabsTrigger value="governanca">Governança</TabsTrigger>
          <TabsTrigger value="propriedade">Propriedade</TabsTrigger>
        </TabsList>

        <TabsContent value="familia" className="space-y-6 pt-6">
          <Frame spacing="sm">
            <FrameHeader>
              <FrameTitle>Árvore familiar</FrameTitle>
              <FrameDescription>
                Clique num membro para editar. Use <strong>+</strong> para adicionar filhos. Linha dupla (══) indica cônjuge.
              </FrameDescription>
            </FrameHeader>
            <FramePanel>
              <FamiliaTree
                members={members}
                selectedId={selectedId}
                onSelect={handleSelect}
                onAddChild={addMember}
                onAddRoot={() => addMember(null, 1)}
              />
            </FramePanel>
          </Frame>

          <TermometroSection successors={successors} />

          <Frame spacing="sm">
            <FrameHeader>
              <FrameTitle>Breve história da família</FrameTitle>
              <FrameDescription>Contexto histórico e trajetória da família empresária.</FrameDescription>
            </FrameHeader>
            <FramePanel>
              <EditableText
                value={history}
                onSave={handleHistorySave}
                rows={5}
                placeholder="Descreva a história da família..."
                pending={isPending}
              />
            </FramePanel>
          </Frame>

          <Frame spacing="sm">
            <FrameHeader>
              <FrameTitle>Missão</FrameTitle>
              <FrameDescription>O propósito central da família empresária.</FrameDescription>
            </FrameHeader>
            <FramePanel>
              <EditableText
                value={mission}
                onSave={handleMissionSave}
                rows={3}
                placeholder="A missão da família..."
                pending={isPending}
              />
            </FramePanel>
          </Frame>

          <Frame spacing="sm">
            <FrameHeader>
              <FrameTitle>Visão</FrameTitle>
              <FrameDescription>Onde a família quer chegar.</FrameDescription>
            </FrameHeader>
            <FramePanel>
              <EditableText
                value={vision}
                onSave={handleVisionSave}
                rows={3}
                placeholder="A visão de futuro da família..."
                pending={isPending}
              />
            </FramePanel>
          </Frame>

          <Frame spacing="sm">
            <FrameHeader>
              <FrameTitle>Valores</FrameTitle>
              <FrameDescription>Os princípios que guiam as decisões e comportamentos.</FrameDescription>
            </FrameHeader>
            <FramePanel>
              <EditableText
                value={values}
                onSave={handleValuesSave}
                rows={3}
                placeholder="Os valores da família..."
                pending={isPending}
              />
            </FramePanel>
          </Frame>
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

      <MembroSheet
        member={selectedMember}
        allMembers={members}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onChange={(patch) => selectedMember && updateMemberLocal(selectedMember.id, patch)}
        onSave={handleSaveMember}
        onDelete={() => selectedMember && handleDeleteMember(selectedMember.id)}
        onMoveLeft={() => selectedMember && swapOrder(selectedMember, "left")}
        onMoveRight={() => selectedMember && swapOrder(selectedMember, "right")}
        onLinkSpouse={(spouseId) => selectedMember && handleLinkSpouse(selectedMember.id, spouseId)}
        onUnlinkSpouse={() => selectedMember && handleUnlinkSpouse(selectedMember.id)}
        onSaveProfileUrl={(url) => selectedMember && handleSaveProfileUrl(selectedMember.id, url)}
        pending={isPending}
      />
    </div>
  );
}
