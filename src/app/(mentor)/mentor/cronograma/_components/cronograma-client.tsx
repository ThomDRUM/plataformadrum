"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, Pencil } from "lucide-react";
import {
  updateScheduleItem,
  addScheduleItem,
  deleteScheduleItem,
  saveEvent,
  deleteEvent,
} from "@/lib/actions/mentor";

// ── Types ──────────────────────────────────────────────────────────────────────

type Status = "a_comecar" | "em_andamento" | "concluido";

interface ScheduleEvent { id: string; title: string; date: string | null }
interface ScheduleItem {
  id: string; title: string;
  start_date: string | null; end_date: string | null;
  status: Status; mentor_notes: string;
  has_events: boolean;
  project_events: ScheduleEvent[];
}

interface Props {
  projectId: string;
  familyName: string;
  projectStart: string;
  projectEnd: string;
  items: ScheduleItem[];
}

// ── Timeline helpers ───────────────────────────────────────────────────────────

const MIN_MONTH_W = 130;

function buildTimeline(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end   = new Date(endStr);
  const totalMs = end.getTime() - start.getTime();
  const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  function pct(d: Date) {
    return Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / totalMs) * 100));
  }

  const segments: { label: string; left: number; width: number }[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    const segStart = cur < start ? start : cur;
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const segEnd = next > end ? end : next;
    segments.push({ label: MONTHS_PT[cur.getMonth()], left: pct(segStart), width: pct(segEnd) - pct(segStart) });
    cur = next;
  }
  return { pct, segments, numMonths: segments.length };
}

const STATUS_LABEL: Record<Status, string> = {
  a_comecar: "A começar", em_andamento: "Em andamento", concluido: "Concluído",
};
const STATUS_CLASS: Record<Status, string> = {
  a_comecar:    "border-border text-muted-foreground",
  em_andamento: "border-amber-300 text-amber-700 bg-amber-50",
  concluido:    "border-emerald-300 text-emerald-700 bg-emerald-50",
};

const TITLE_COL = 200;

// ── Gantt bar ──────────────────────────────────────────────────────────────────

function GanttBar({ startDate, endDate, pct }: { startDate: string | null; endDate: string | null; pct: (d: Date) => number }) {
  if (!startDate || !endDate) {
    return (
      <div className="absolute inset-y-[5px] left-[5%] right-[5%] rounded border border-dashed border-border/60 flex items-center justify-center">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40">A definir</span>
      </div>
    );
  }
  const left  = pct(new Date(startDate));
  const right = 100 - pct(new Date(endDate));
  return (
    <div
      className="absolute inset-y-[6px] rounded-sm bg-foreground/12 border border-foreground/15"
      style={{ left: `${left}%`, right: `${right}%` }}
    />
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CronogramaClient({ projectId, familyName, projectStart, projectEnd, items: initialItems }: Props) {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState<{ title: string; date: string | null } | null>(null);

  const { pct, segments, numMonths } = buildTimeline(projectStart, projectEnd);
  const TIMELINE_MIN_W = numMonths * MIN_MONTH_W;

  // ── Schedule mutations ─────────────────────────────────────────────────────

  function patchLocal(id: string, patch: Partial<ScheduleItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  async function handleSaveItem(item: ScheduleItem) {
    await updateScheduleItem(item.id, {
      title: item.title,
      start_date: item.start_date,
      end_date: item.end_date,
      status: item.status,
      mentor_notes: item.mentor_notes,
    });
  }

  async function handleAddItem() {
    const result = await addScheduleItem(projectId, items.length);
    if (result) {
      setItems(prev => [...prev, {
        id: result.id, title: "Nova etapa",
        start_date: null, end_date: null,
        status: "a_comecar", mentor_notes: "",
        has_events: false, project_events: [],
      }]);
      setOpenId(result.id);
    }
  }

  async function handleRemoveItem(id: string) {
    await deleteScheduleItem(id);
    setItems(prev => prev.filter(it => it.id !== id));
    if (openId === id) setOpenId(null);
  }

  // ── Event mutations ────────────────────────────────────────────────────────

  async function handleAddEvent(itemId: string) {
    const result = await saveEvent(itemId, null, "", null);
    if (result) {
      const newEv = { id: result.id, title: "", date: null };
      setItems(prev => prev.map(it =>
        it.id === itemId ? { ...it, project_events: [...it.project_events, newEv] } : it
      ));
      setEditingEventId(result.id);
      setEventDraft({ title: "", date: null });
    }
  }

  function startEditEvent(ev: ScheduleEvent) {
    setEditingEventId(ev.id);
    setEventDraft({ title: ev.title, date: ev.date });
  }

  function cancelEditEvent() {
    setEditingEventId(null);
    setEventDraft(null);
  }

  async function saveEventEdit(itemId: string, evId: string) {
    if (!eventDraft) return;
    await saveEvent(itemId, evId, eventDraft.title, eventDraft.date);
    setItems(prev => prev.map(it =>
      it.id === itemId
        ? { ...it, project_events: it.project_events.map(e => e.id === evId ? { ...e, ...eventDraft } : e) }
        : it
    ));
    setEditingEventId(null);
    setEventDraft(null);
  }

  async function handleDeleteEvent(itemId: string, evId: string) {
    await deleteEvent(evId);
    setItems(prev => prev.map(it =>
      it.id === itemId
        ? { ...it, project_events: it.project_events.filter(e => e.id !== evId) }
        : it
    ));
    if (editingEventId === evId) { setEditingEventId(null); setEventDraft(null); }
  }

  const eventableItems = items.filter(it => it.has_events);

  return (
    <div className="-mx-10 -my-10 flex flex-col" style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div className="px-10 pt-10 pb-8">
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-2">{familyName}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Cronograma</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {numMonths} meses · {new Date(projectStart).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })} – {new Date(projectEnd).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
        </p>
      </div>

      {/* Gantt */}
      <div className="px-10 pb-6 overflow-x-auto">
        <div style={{ minWidth: TITLE_COL + TIMELINE_MIN_W }}>

          {/* Month header */}
          <div className="flex mb-0" style={{ marginLeft: TITLE_COL }}>
            <div className="flex-1 relative h-7">
              {segments.map((m) => (
                <div key={m.label} className="absolute top-0 h-7 flex items-center justify-center" style={{ left: `${m.left}%`, width: `${m.width}%` }}>
                  <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex mb-1" style={{ marginLeft: TITLE_COL }}>
            <div className="flex-1 relative h-2">
              <div className="absolute inset-x-0 top-0 h-px bg-border/60" />
              {segments.slice(1).map((m) => (
                <div key={`tick-${m.label}`} className="absolute top-0 w-px h-2 bg-border/50" style={{ left: `${m.left}%` }} />
              ))}
            </div>
          </div>

          {/* Schedule rows */}
          <div className="space-y-px">
            {items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="flex items-stretch cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                  >
                    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-3 border-r border-border" style={{ width: TITLE_COL }}>
                      {isOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />}
                      <span className="text-xs text-foreground leading-tight">{item.title}</span>
                    </div>
                    <div className="flex-1 relative h-10">
                      <GanttBar startDate={item.start_date} endDate={item.end_date} pct={pct} />
                    </div>
                    <div className="flex-shrink-0 flex items-center px-3" onClick={e => e.stopPropagation()}>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded border whitespace-nowrap", STATUS_CLASS[item.status])}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Título</label>
                        <input
                          value={item.title}
                          onChange={(e) => patchLocal(item.id, { title: e.target.value })}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Planejamento</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Início</p>
                            <input type="date" value={item.start_date ?? ""} onChange={(e) => patchLocal(item.id, { start_date: e.target.value || null })}
                              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Fim</p>
                            <input type="date" value={item.end_date ?? ""} onChange={(e) => patchLocal(item.id, { end_date: e.target.value || null })}
                              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                        <select value={item.status} onChange={(e) => patchLocal(item.id, { status: e.target.value as Status })}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                          <option value="a_comecar">A começar</option>
                          <option value="em_andamento">Em andamento</option>
                          <option value="concluido">Concluído</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notas</label>
                        <textarea value={item.mentor_notes} onChange={(e) => patchLocal(item.id, { mentor_notes: e.target.value })}
                          rows={2} placeholder="Observações sobre esta etapa..."
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40" />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button onClick={() => handleSaveItem(item)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                          <Check className="w-3 h-3" /> Salvar alterações
                        </button>
                        <button onClick={() => handleRemoveItem(item.id)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" /> Remover etapa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={handleAddItem} className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nova etapa
          </button>
        </div>
      </div>

      {/* ── Eventos ── */}
      <div className="px-10 pt-4 pb-12 space-y-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Eventos</h2>
          <p className="text-sm text-muted-foreground">Datas específicas de encontros e marcos do projeto.</p>
        </div>

        <div className="space-y-8 max-w-2xl">
          {eventableItems.map((item) => (
            <div key={item.id}>
              <p className="text-sm font-medium text-foreground mb-3">{item.title}</p>
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {item.project_events.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 italic">Nenhum evento ainda.</p>
                )}
                {item.project_events.map((ev) => {
                  const isEditing = editingEventId === ev.id;

                  if (isEditing && eventDraft) {
                    return (
                      <div key={ev.id} className="border border-border rounded-lg p-3 space-y-2.5 bg-background">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Data</p>
                            <input
                              type="date"
                              value={eventDraft.date ?? ""}
                              onChange={(e) => setEventDraft({ ...eventDraft, date: e.target.value || null })}
                              autoFocus
                              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nome</p>
                            <input
                              value={eventDraft.title}
                              onChange={(e) => setEventDraft({ ...eventDraft, title: e.target.value })}
                              placeholder="Nome do evento..."
                              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => saveEventEdit(item.id, ev.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                            <Check className="w-3 h-3" /> Salvar
                          </button>
                          <button onClick={cancelEditEvent} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                          <button onClick={() => handleDeleteEvent(item.id, ev.id)} className="ml-auto text-xs text-muted-foreground/40 hover:text-destructive transition-colors flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Remover
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={ev.id} className="group flex items-center gap-3 py-1.5">
                      <span className="text-xs text-muted-foreground tabular-nums w-24 flex-shrink-0">
                        {ev.date ? new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Sem data"}
                      </span>
                      <span className={`flex-1 text-sm ${ev.title ? "text-foreground" : "text-muted-foreground/40 italic"}`}>
                        {ev.title || "Sem nome"}
                      </span>
                      <button onClick={() => startEditEvent(ev)} className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                <button onClick={() => handleAddEvent(item.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
                  <Plus className="w-3 h-3" /> Adicionar evento
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
