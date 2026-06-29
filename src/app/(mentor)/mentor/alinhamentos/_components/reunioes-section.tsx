"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, Pencil } from "lucide-react";
import { saveMeeting, deleteMeeting } from "@/lib/actions/mentor";
import { TIPO_OPTIONS } from "@/lib/mentor/alinhamentos";

interface Meeting {
  id: string;
  name: string;
  meeting_date: string | null;
  tipo: string | null;
  participantes: string | null;
  proposito: string | null;
  perguntas_principais: string | null;
  notes: string | null;
}

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

function MeetingForm({ draft, onChange, onSave, onCancel, saveDisabled }: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saveDisabled: boolean;
}) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</p>
          <input
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            autoFocus
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data</p>
          <input
            type="date"
            value={draft.meeting_date}
            onChange={(e) => onChange({ ...draft, meeting_date: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</p>
        <select
          value={draft.tipo}
          onChange={(e) => onChange({ ...draft, tipo: e.target.value })}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Selecione...</option>
          {TIPO_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Participantes</p>
        <input
          value={draft.participantes}
          onChange={(e) => onChange({ ...draft, participantes: e.target.value })}
          placeholder="Opcional"
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Propósito</p>
        <textarea
          value={draft.proposito}
          onChange={(e) => onChange({ ...draft, proposito: e.target.value })}
          rows={2}
          placeholder="Opcional"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Perguntas principais</p>
        <textarea
          value={draft.perguntas_principais}
          onChange={(e) => onChange({ ...draft, perguntas_principais: e.target.value })}
          rows={2}
          placeholder="Opcional"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notas</p>
        <textarea
          value={draft.notas}
          onChange={(e) => onChange({ ...draft, notas: e.target.value })}
          rows={2}
          placeholder="Opcional"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saveDisabled}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          <Check className="w-3 h-3" /> Salvar
        </button>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
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

  async function saveForm() {
    if (!draft || !draft.name.trim() || !draft.meeting_date || !draft.tipo) return;
    const result = await saveMeeting(projectId, editingId, {
      name: draft.name.trim(),
      meeting_date: draft.meeting_date,
      tipo: draft.tipo,
      participantes: draft.participantes,
      proposito: draft.proposito,
      perguntas_principais: draft.perguntas_principais,
      notas: draft.notas,
    });
    if (editingId) {
      setMeetings((prev) =>
        prev
          .map((m) => (m.id === editingId ? draftToMeeting(editingId, draft) : m))
          .sort((a, b) => (b.meeting_date ?? "").localeCompare(a.meeting_date ?? ""))
      );
    } else if (result) {
      setMeetings((prev) =>
        [...prev, draftToMeeting(result.id, draft)].sort((a, b) => (b.meeting_date ?? "").localeCompare(a.meeting_date ?? ""))
      );
    }
    cancelForm();
  }

  async function confirmDelete(id: string) {
    await deleteMeeting(id);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    setDeleteCandidate(null);
    if (openId === id) setOpenId(null);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Reuniões de Alinhamento</h2>

      <div className="space-y-2 max-w-2xl">
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
              />
            );
          }

          return (
            <div key={m.id} className="border border-border rounded-lg overflow-hidden">
              <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <button onClick={() => setOpenId(isOpen ? null : m.id)} className="flex-1 flex items-center gap-3 text-left">
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  {m.tipo && <span className="text-xs text-muted-foreground">{m.tipo}</span>}
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDateBR(m.meeting_date)}</span>
                </button>
                <button onClick={() => startEdit(m)} className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors" title="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteCandidate(m.id)} className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors" title="Remover">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-border space-y-2">
                  <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground/70">Participantes: </span>{m.participantes || "—"}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-semibold text-foreground/70">Propósito: </span>{m.proposito || "—"}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-semibold text-foreground/70">Perguntas principais: </span>{m.perguntas_principais || "—"}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-semibold text-foreground/70">Notas: </span>{m.notes || "—"}</p>
                </div>
              )}
              {deleteCandidate === m.id && (
                <div className="px-4 pb-4 pt-1 border-t border-border bg-destructive/5 flex items-center justify-between gap-3">
                  <p className="text-xs text-foreground">Tem certeza que quer remover esta reunião?</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => confirmDelete(m.id)} className="text-xs px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
                      Remover
                    </button>
                    <button onClick={() => setDeleteCandidate(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Cancelar
                    </button>
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
          />
        )}

        {!creating && !editingId && (
          <button onClick={startCreate} className={cn("flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1")}>
            <Plus className="w-3.5 h-3.5" /> Nova reunião
          </button>
        )}
      </div>
    </section>
  );
}
