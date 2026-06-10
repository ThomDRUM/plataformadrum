"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Status = "a_comecar" | "em_andamento" | "concluido";

interface ScheduleEvent { id: string; title: string; date: string; }
interface ScheduleItem {
  id: string; title: string;
  startDate: string | null; endDate: string | null;
  status: Status; notes: string; events: ScheduleEvent[];
  has_events?: boolean;
}

// ── Timeline helpers ───────────────────────────────────────────────────────────

const PROJECT_START = new Date("2026-06-15");
const PROJECT_END   = new Date("2026-12-15");
const TOTAL_MS      = PROJECT_END.getTime() - PROJECT_START.getTime();
const MIN_MONTH_W   = 130; // px minimum per month segment

function pct(d: Date): number {
  return Math.max(0, Math.min(100, ((d.getTime() - PROJECT_START.getTime()) / TOTAL_MS) * 100));
}

function buildMonthSegments(start: Date, end: Date) {
  const segments: { label: string; left: number; width: number }[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  while (cur <= end) {
    const segStart = cur < start ? start : cur;
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const segEnd = next > end ? end : next;
    segments.push({
      label: MONTHS_PT[cur.getMonth()],
      left: pct(segStart),
      width: pct(segEnd) - pct(segStart),
    });
    cur = next;
  }
  return segments;
}

const MONTH_SEGMENTS = buildMonthSegments(PROJECT_START, PROJECT_END);
const NUM_MONTHS = MONTH_SEGMENTS.length;
const TITLE_COL = 200;
const TIMELINE_MIN_W = NUM_MONTHS * MIN_MONTH_W;

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_ITEMS: ScheduleItem[] = [
  { id: "1", title: "Termômetro", startDate: "2026-06-15", endDate: "2026-06-26", status: "a_comecar", notes: "", events: [] },
  { id: "2", title: "Trilha de formação do facilitador", startDate: "2026-06-15", endDate: "2026-07-10", status: "a_comecar", notes: "", events: [] },
  { id: "3", title: "Trilhas de desenvolvimento", startDate: "2026-06-29", endDate: "2026-09-28", status: "a_comecar", notes: "", events: [] },
  { id: "4", title: "Trilha de transição", startDate: "2026-06-29", endDate: "2026-09-28", status: "a_comecar", notes: "", events: [] },
  {
    id: "5", title: "Reuniões de alinhamento",
    startDate: "2026-08-17", endDate: "2026-12-15",
    status: "a_comecar",
    notes: "Definir datas após todos terem tido a Formação Família Empreendedora.",
    events: [], has_events: true,
  },
  {
    id: "6", title: "Execução dos instrumentos, acordos, políticas e fóruns",
    startDate: null, endDate: null,
    status: "a_comecar",
    notes: "Definir datas conforme o planejamento do facilitador.",
    events: [], has_events: true,
  },
];

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<Status, string> = {
  a_comecar:    "A começar",
  em_andamento: "Em andamento",
  concluido:    "Concluído",
};
const STATUS_CLASS: Record<Status, string> = {
  a_comecar:    "border-border text-muted-foreground",
  em_andamento: "border-amber-300 text-amber-700 bg-amber-50",
  concluido:    "border-emerald-300 text-emerald-700 bg-emerald-50",
};

// ── Gantt bar ──────────────────────────────────────────────────────────────────

function GanttBar({ startDate, endDate }: { startDate: string | null; endDate: string | null }) {
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

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CronogramaPage() {
  const [items, setItems] = useState<ScheduleItem[]>(MOCK_ITEMS);
  const [openId, setOpenId] = useState<string | null>(null);

  function updateItem(id: string, patch: Partial<ScheduleItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }
  function addItem() {
    setItems(prev => [...prev, {
      id: Date.now().toString(), title: "Nova etapa",
      startDate: null, endDate: null, status: "a_comecar", notes: "", events: [],
    }]);
  }
  function removeItem(id: string) { setItems(prev => prev.filter(it => it.id !== id)); }

  function addEvent(itemId: string) {
    setItems(prev => prev.map(it =>
      it.id === itemId ? { ...it, events: [...it.events, { id: Date.now().toString(), title: "", date: "" }] } : it
    ));
  }
  function updateEvent(itemId: string, eventId: string, patch: Partial<ScheduleEvent>) {
    setItems(prev => prev.map(it =>
      it.id === itemId ? { ...it, events: it.events.map(e => e.id === eventId ? { ...e, ...patch } : e) } : it
    ));
  }
  function removeEvent(itemId: string, eventId: string) {
    setItems(prev => prev.map(it =>
      it.id === itemId ? { ...it, events: it.events.filter(e => e.id !== eventId) } : it
    ));
  }

  const eventableItems = items.filter(it => it.has_events);

  return (
    <div className="-mx-10 -my-10 flex flex-col" style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div className="px-10 pt-10 pb-8">
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-2">Família Rodrigues</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Cronograma</h1>
        <p className="text-sm text-muted-foreground mt-1">6 meses · Jun 2026 – Dez 2026</p>
      </div>

      {/* Gantt — scrollable */}
      <div className="px-10 pb-6 overflow-x-auto">
        <div style={{ minWidth: TITLE_COL + TIMELINE_MIN_W }}>

          {/* Month header — labels only, no overlapping lines */}
          <div className="flex mb-0" style={{ marginLeft: TITLE_COL }}>
            <div className="flex-1 relative h-7">
              {MONTH_SEGMENTS.map((m) => (
                <div
                  key={m.label}
                  className="absolute top-0 h-7 flex items-center justify-center"
                  style={{ left: `${m.left}%`, width: `${m.width}%` }}
                >
                  <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider + month tick marks */}
          <div className="flex mb-1" style={{ marginLeft: TITLE_COL }}>
            <div className="flex-1 relative h-2">
              <div className="absolute inset-x-0 top-0 h-px bg-border/60" />
              {MONTH_SEGMENTS.slice(1).map((m) => (
                <div
                  key={`tick-${m.label}`}
                  className="absolute top-0 w-px h-2 bg-border/50"
                  style={{ left: `${m.left}%` }}
                />
              ))}
            </div>
          </div>

          {/* Schedule rows */}
          <div className="space-y-px">
            {items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Main row */}
                  <div
                    className="flex items-stretch cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                  >
                    {/* Title */}
                    <div
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-3 border-r border-border"
                      style={{ width: TITLE_COL }}
                    >
                      {isOpen ? <ChevronUp className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />}
                      <span className="text-xs text-foreground leading-tight">{item.title}</span>
                    </div>
                    {/* Bar */}
                    <div className="flex-1 relative h-10">
                      <GanttBar startDate={item.startDate} endDate={item.endDate} />
                    </div>
                    {/* Status badge */}
                    <div className="flex-shrink-0 flex items-center px-3" onClick={e => e.stopPropagation()}>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded border whitespace-nowrap", STATUS_CLASS[item.status])}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                  </div>

                  {/* Edit panel */}
                  {isOpen && (
                    <div className="px-4 py-4 border-t border-border bg-muted/10 space-y-4">
                      {/* Title */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Título</label>
                        <input
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>

                      {/* Planejamento — dates */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Planejamento</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Início</p>
                            <input
                              type="date"
                              value={item.startDate ?? ""}
                              onChange={(e) => updateItem(item.id, { startDate: e.target.value || null })}
                              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Fim</p>
                            <input
                              type="date"
                              value={item.endDate ?? ""}
                              onChange={(e) => updateItem(item.id, { endDate: e.target.value || null })}
                              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                        <select
                          value={item.status}
                          onChange={(e) => updateItem(item.id, { status: e.target.value as Status })}
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="a_comecar">A começar</option>
                          <option value="em_andamento">Em andamento</option>
                          <option value="concluido">Concluído</option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Notas</label>
                        <textarea
                          value={item.notes}
                          onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                          rows={2}
                          placeholder="Observações sobre esta etapa..."
                          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                        />
                      </div>

                      {/* Remove */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remover etapa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add item */}
          <button onClick={addItem} className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
                {item.events.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 italic">Nenhum evento ainda.</p>
                )}
                {item.events.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3">
                    <input
                      type="date"
                      value={ev.date}
                      onChange={(e) => updateEvent(item.id, ev.id, { date: e.target.value })}
                      className="rounded-md border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <input
                      value={ev.title}
                      onChange={(e) => updateEvent(item.id, ev.id, { title: e.target.value })}
                      placeholder="Nome do evento..."
                      className="flex-1 rounded-md border border-border bg-background px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                    />
                    <button onClick={() => removeEvent(item.id, ev.id)} className="p-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addEvent(item.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                >
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
