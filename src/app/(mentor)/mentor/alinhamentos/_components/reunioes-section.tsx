"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, Pencil } from "lucide-react";
import { Frame, FrameHeader, FrameTitle, FrameDescription, FramePanel } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveMeeting, deleteMeeting } from "@/lib/actions/mentor";
import { TIPO_OPTIONS } from "@/lib/mentor/alinhamentos";
import type { Meeting } from "@/lib/mentor/reunioes";

interface Draft {
  name: string;
  meeting_date: string;
  tipo: string;
  participantes: string;
  proposito: string;
  perguntas_principais: string;
  notas: string;
}

const EMPTY_DRAFT: Draft = {
  name: "", meeting_date: "", tipo: "", participantes: "", proposito: "", perguntas_principais: "", notas: "",
};

const SELECT_CLASS =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function formatDateBR(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function meetingToDraft(m: Meeting): Draft {
  return {
    name: m.name,
    meeting_date: m.meeting_date ?? "",
    tipo: m.tipo ?? "",
    participantes: m.participantes ?? "",
    proposito: m.proposito ?? "",
    perguntas_principais: m.perguntas_principais ?? "",
    notas: m.notes ?? "",
  };
}

function draftToMeeting(id: string, draft: Draft): Meeting {
  return {
    id,
    name: draft.name.trim(),
    meeting_date: draft.meeting_date || null,
    tipo: draft.tipo || null,
    participantes: draft.participantes || null,
    proposito: draft.proposito || null,
    perguntas_principais: draft.perguntas_principais || null,
    notes: draft.notas || null,
  };
}

function MeetingForm({
  draft, onChange, onSave, onCancel, saveDisabled, pending,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saveDisabled: boolean;
  pending: boolean;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Nome</p>
          <Input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} autoFocus />
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Data</p>
          <Input
            type="date"
            value={draft.meeting_date}
            onChange={(e) => onChange({ ...draft, meeting_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Tipo</p>
        <select
          value={draft.tipo}
          onChange={(e) => onChange({ ...draft, tipo: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">Selecione...</option>
          {TIPO_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Participantes</p>
        <Input
          value={draft.participantes}
          onChange={(e) => onChange({ ...draft, participantes: e.target.value })}
          placeholder="Opcional"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Propósito</p>
        <Textarea
          value={draft.proposito}
          onChange={(e) => onChange({ ...draft, proposito: e.target.value })}
          rows={2}
          placeholder="Opcional"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Perguntas principais</p>
        <Textarea
          value={draft.perguntas_principais}
          onChange={(e) => onChange({ ...draft, perguntas_principais: e.target.value })}
          rows={2}
          placeholder="Opcional"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Notas</p>
        <Textarea
          value={draft.notas}
          onChange={(e) => onChange({ ...draft, notas: e.target.value })}
          rows={2}
          placeholder="Opcional"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={saveDisabled || pending} onClick={onSave}>
          <Check /> Salvar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function ReunioesSection({ projectId, meetings: initialMeetings }: { projectId: string; meetings: Meeting[] }) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startCreate() {
    setCreating(true);
    setDraft({ ...EMPTY_DRAFT });
  }

  function startEdit(m: Meeting) {
    setEditingId(m.id);
    setDraft(meetingToDraft(m));
  }

  function cancelForm() {
    setCreating(false);
    setEditingId(null);
    setDraft(null);
  }

  function saveForm() {
    if (!draft || !draft.name.trim() || !draft.meeting_date || !draft.tipo) return;
    const wasEditing = editingId;
    const currentDraft = draft;
    cancelForm();

    startTransition(async () => {
      const result = await saveMeeting(projectId, wasEditing, {
        name: currentDraft.name.trim(),
        meeting_date: currentDraft.meeting_date,
        tipo: currentDraft.tipo,
        participantes: currentDraft.participantes,
        proposito: currentDraft.proposito,
        perguntas_principais: currentDraft.perguntas_principais,
        notas: currentDraft.notas,
      });
      if (!result.ok) {
        toast.error(result.error);
        if (wasEditing) setEditingId(wasEditing);
        else setCreating(true);
        setDraft(currentDraft);
        return;
      }
      if (wasEditing) {
        setMeetings((prev) =>
          prev
            .map((m) => (m.id === wasEditing ? draftToMeeting(wasEditing, currentDraft) : m))
            .sort((a, b) => (b.meeting_date ?? "").localeCompare(a.meeting_date ?? ""))
        );
      } else {
        setMeetings((prev) =>
          [...prev, draftToMeeting(result.data.id, currentDraft)].sort(
            (a, b) => (b.meeting_date ?? "").localeCompare(a.meeting_date ?? "")
          )
        );
      }
      toast.success("Reunião salva.");
    });
  }

  function confirmDelete(id: string) {
    const prev = meetings;
    setMeetings((p) => p.filter((m) => m.id !== id));
    setDeleteCandidate(null);
    if (openId === id) setOpenId(null);

    startTransition(async () => {
      const result = await deleteMeeting(id);
      if (!result.ok) {
        setMeetings(prev);
        toast.error(result.error);
        return;
      }
      toast.success("Reunião removida.");
    });
  }

  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>Reuniões de Alinhamento</FrameTitle>
        <FrameDescription>Encontros marcados com a família ao longo do processo.</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <div className="space-y-2">
          {meetings.map((m) => {
            const isOpen = openId === m.id;
            const isEditing = editingId === m.id;

            if (isEditing && draft) {
              return (
                <MeetingForm
                  key={m.id}
                  draft={draft}
                  onChange={setDraft}
                  onSave={saveForm}
                  onCancel={cancelForm}
                  saveDisabled={!draft.name.trim() || !draft.meeting_date || !draft.tipo}
                  pending={isPending}
                />
              );
            }

            return (
              <div key={m.id} className="overflow-hidden rounded-lg border border-border">
                <div className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : m.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">{m.name}</span>
                    {m.tipo && <span className="text-xs text-muted-foreground">{m.tipo}</span>}
                    <span className="text-xs text-muted-foreground tabular-nums">{formatDateBR(m.meeting_date)}</span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground/40 hover:text-muted-foreground"
                    onClick={() => startEdit(m)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground/40 hover:text-destructive"
                    onClick={() => setDeleteCandidate(m.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {isOpen && (
                  <div className="space-y-2 border-t border-border px-4 pt-1 pb-4">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/70">Participantes: </span>
                      {m.participantes || "—"}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground/70">Propósito: </span>
                      {m.proposito || "—"}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground/70">Perguntas principais: </span>
                      {m.perguntas_principais || "—"}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground/70">Notas: </span>
                      {m.notes || "—"}
                    </p>
                  </div>
                )}
                {deleteCandidate === m.id && (
                  <div className="flex items-center justify-between gap-3 border-t border-border bg-destructive/5 px-4 pt-1 pb-4">
                    <p className="text-xs text-foreground">Tem certeza que quer remover esta reunião?</p>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Button type="button" size="sm" variant="destructive" onClick={() => confirmDelete(m.id)}>
                        Remover
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteCandidate(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {creating && draft && (
            <MeetingForm
              draft={draft}
              onChange={setDraft}
              onSave={saveForm}
              onCancel={cancelForm}
              saveDisabled={!draft.name.trim() || !draft.meeting_date || !draft.tipo}
              pending={isPending}
            />
          )}

          {!creating && !editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={startCreate} className="mt-1 text-muted-foreground">
              <Plus /> Nova reunião
            </Button>
          )}
        </div>
      </FramePanel>
    </Frame>
  );
}
