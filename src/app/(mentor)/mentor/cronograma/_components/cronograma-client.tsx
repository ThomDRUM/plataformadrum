"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, Pencil, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  updateScheduleItem,
  addScheduleItem,
  deleteScheduleItem,
  updateProjectDates,
} from "@/lib/actions/mentor";
import { colorForTipo, FASE_COLOR, FASE_LABEL, TIPO_TO_FASE } from "@/lib/mentor/alinhamentos";

// ── Types ──────────────────────────────────────────────────────────────────────

type Status = "a_comecar" | "em_andamento" | "concluido";

interface ScheduleItem {
  id: string; title: string;
  start_date: string | null; end_date: string | null;
  status: Status; mentor_notes: string;
}
interface Meeting { id: string; name: string; meeting_date: string | null; tipo: string | null }

interface Props {
  projectId: string;
  familyName: string;
  startDate: string | null;
  endDate: string | null;
  projectStart: string;
  projectEnd: string;
  items: ScheduleItem[];
  meetings: Meeting[];
}

function formatDateBR(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
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

// ── Meeting dot with tooltip ───────────────────────────────────────────────────

function MeetingDot({
  color, left, yOffset, label,
}: { color: string; left: number; yOffset: number; label: string }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinned) return;
    function handleOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [pinned]);

  const showTooltip = hovered || pinned;

  return (
    <div
      ref={rootRef}
      className="absolute"
      style={{ left: `${left}%`, top: "50%", transform: `translate(-50%, calc(-50% + ${yOffset}px))`, zIndex: showTooltip ? 30 : 10 }}
    >
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); setPinned((v) => !v); }}
        className="block w-3 h-3 rounded-full border-2 border-background flex-shrink-0 cursor-pointer"
        style={{ backgroundColor: color }}
        aria-label={label}
      />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-md bg-foreground text-background text-[11px] whitespace-nowrap shadow-md z-40">
          {label}
        </div>
      )}
    </div>
  );
}

// ── Project dates ────────────────────────────────────────────────────────────

function ProjectDates({
  projectId, startDate, endDate,
}: {
  projectId: string; startDate: string | null; endDate: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(startDate ?? "");
  const [end, setEnd] = useState(endDate ?? "");
  const [savedStart, setSavedStart] = useState(startDate);
  const [savedEnd, setSavedEnd] = useState(endDate);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setStart(savedStart ?? "");
    setEnd(savedEnd ?? "");
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setError(null);
    setEditing(false);
  }

  async function save() {
    if (start && end && end <= start) {
      setError("O término deve ser posterior ao início.");
      return;
    }
    await updateProjectDates(projectId, start || null, end || null);
    setSavedStart(start || null);
    setSavedEnd(end || null);
    setError(null);
    setEditing(false);
    toast.success("Datas atualizadas");
  }

  if (editing) {
    return (
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Início
            </p>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Término
            </p>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <button onClick={save} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
            <Check className="w-3 h-3" /> Salvar
          </button>
          <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className="group flex items-center gap-6 text-left hover:bg-muted/30 -mx-2 px-2 py-1.5 rounded-md transition-colors"
    >
      <Calendar className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Início</span>
        <span className="text-sm text-foreground tabular-nums">{formatDateBR(savedStart)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Término</span>
        <span className="text-sm text-foreground tabular-nums">{formatDateBR(savedEnd)}</span>
      </div>
      <Pencil className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors" />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CronogramaClient({ projectId, familyName, startDate, endDate, projectStart, projectEnd, items: initialItems, meetings }: Props) {
  const [items, setItems] = useState<ScheduleItem[]>(initialItems);
  const [openId, setOpenId] = useState<string | null>(null);

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
      }]);
      setOpenId(result.id);
    }
  }

  async function handleRemoveItem(id: string) {
    await deleteScheduleItem(id);
    setItems(prev => prev.filter(it => it.id !== id));
    if (openId === id) setOpenId(null);
  }

  return (
    <div className="-mx-10 -my-10 flex flex-col" style={{ minHeight: "100vh" }}>

      {/* Header */}
      <div className="px-10 pt-10 pb-8">
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-2">{familyName}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Cronograma</h1>
        <div className="mt-4">
          <ProjectDates projectId={projectId} startDate={startDate} endDate={endDate} />
        </div>
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

          {/* Reuniões de Alinhamento — somente leitura, integradas ao Gantt */}
          {meetings.length > 0 && (
            <>
              <div className="flex items-stretch mt-4 border border-border rounded-lg overflow-visible bg-violet-50/30">
                <div className="flex-shrink-0 flex items-center gap-2 px-3 py-3 border-r border-border" style={{ width: TITLE_COL }}>
                  <Users className="w-3 h-3 text-violet-600/70 flex-shrink-0" />
                  <span className="text-xs text-foreground leading-tight">Reuniões de Alinhamento</span>
                </div>
                <div className="flex-1 relative h-20">
                  {(() => {
                    const LANE_Y: Record<0 | 1 | 2, number> = { 0: -16, 1: 0, 2: 16 };

                    const positioned = meetings
                      .filter(m => m.meeting_date)
                      .map(m => ({ m, left: pct(new Date(m.meeting_date as string)), fase: TIPO_TO_FASE[m.tipo ?? ""] ?? 1 }))
                      .sort((a, b) => a.left - b.left);

                    const seenByFase: Record<number, number[]> = { 0: [], 1: [], 2: [] };
                    return positioned.map(({ m, left, fase }) => {
                      const seenLefts = seenByFase[fase];
                      const collisionIndex = seenLefts.filter(l => Math.abs(l - left) < 1.5).length;
                      seenLefts.push(left);
                      const collisionOffset = collisionIndex % 2 === 0
                        ? Math.ceil(collisionIndex / 2) * 4
                        : -Math.ceil(collisionIndex / 2) * 4;
                      const yOffset = LANE_Y[fase] + collisionOffset;
                      const color = colorForTipo(m.tipo) ?? "#a78bfa";
                      const dateLabel = formatDateBR(m.meeting_date);
                      return (
                        <MeetingDot
                          key={m.id}
                          color={color}
                          left={left}
                          yOffset={yOffset}
                          label={`${m.name} · ${m.tipo ?? "Sem tipo"} · ${dateLabel}`}
                        />
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-5 mt-2 flex-wrap" style={{ marginLeft: TITLE_COL }}>
                {([0, 1, 2] as const).map((fase) => (
                  <span key={fase} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: FASE_COLOR[fase] }} />
                    {FASE_LABEL[fase]}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
