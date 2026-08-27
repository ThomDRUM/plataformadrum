"use client";

import { useMemo, useState } from "react";
import { addDays } from "date-fns";
import { Calendar, Check, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { VariantProps } from "class-variance-authority";

import {
  updateScheduleItem,
  addScheduleItem,
  deleteScheduleItem,
  updateProjectDates,
} from "@/lib/actions/mentor";
import { colorForTipo, FASE_COLOR, FASE_LABEL } from "@/lib/mentor/alinhamentos";
import { Badge, type badgeVariants } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import { EventCalendarNav, EventCalendarToolbar } from "@/components/reui/event-calendar/event-calendar-nav";
import type {
  CalendarEvent,
  EventCalendarOccurrence,
} from "@/components/reui/event-calendar/event-calendar-types";
import { EtapaDialog, type EtapaItem, type EtapaStatus } from "./etapa-dialog";
import { ReuniaoDialog, type ReuniaoInfo } from "./reuniao-dialog";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  familyName: string;
  startDate: string | null;
  endDate: string | null;
  items: EtapaItem[];
  meetings: ReuniaoInfo[];
}

type CronogramaEventData =
  | { kind: "schedule"; itemId: string }
  | { kind: "meeting"; meeting: ReuniaoInfo };

function formatDateBR(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/** `new Date("YYYY-MM-DD")` parseia como UTC e pode cair no dia anterior em
 *  fusos negativos — construir a partir das partes fica sempre no dia certo. */
function parseDateOnly(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const STATUS_LABEL: Record<EtapaStatus, string> = {
  a_comecar: "A começar",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

const STATUS_BADGE_VARIANT: Record<EtapaStatus, VariantProps<typeof badgeVariants>["variant"]> = {
  a_comecar: "outline",
  em_andamento: "warning-light",
  concluido: "success-light",
};

/** Cor do chip no calendário — `undefined` cai no tom padrão do componente. */
const STATUS_EVENT_COLOR: Record<EtapaStatus, string | undefined> = {
  a_comecar: undefined,
  em_andamento: "var(--color-amber-500)",
  concluido: "var(--color-emerald-500)",
};

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
      <div className="space-y-3">
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
      className="group flex w-full items-center gap-6 text-left"
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

export function CronogramaClient({ projectId, familyName, startDate, endDate, items: initialItems, meetings }: Props) {
  const [items, setItems] = useState<EtapaItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<ReuniaoInfo | null>(null);

  const editingItem = items.find((it) => it.id === editingId) ?? null;

  // ── Schedule mutations ─────────────────────────────────────────────────────

  function patchLocal(id: string, patch: Partial<EtapaItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function handleSaveItem(item: EtapaItem) {
    await updateScheduleItem(item.id, {
      title: item.title,
      start_date: item.start_date,
      end_date: item.end_date,
      status: item.status,
      mentor_notes: item.mentor_notes,
    });
    toast.success("Etapa salva.");
  }

  async function handleAddItem() {
    const result = await addScheduleItem(projectId, items.length);
    if (result) {
      setItems((prev) => [...prev, {
        id: result.id, title: "Nova etapa",
        start_date: null, end_date: null,
        status: "a_comecar", mentor_notes: "",
      }]);
      setEditingId(result.id);
    }
  }

  async function handleRemoveItem(id: string) {
    await deleteScheduleItem(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (editingId === id) setEditingId(null);
    toast.success("Etapa removida.");
  }

  // ── Calendar events ────────────────────────────────────────────────────────

  const { datedItems, undatedItems } = useMemo(() => {
    const datedItems: EtapaItem[] = [];
    const undatedItems: EtapaItem[] = [];
    for (const item of items) (item.start_date ? datedItems : undatedItems).push(item);
    return { datedItems, undatedItems };
  }, [items]);

  const events = useMemo<CalendarEvent<CronogramaEventData>[]>(() => {
    const scheduleEvents: CalendarEvent<CronogramaEventData>[] = datedItems.map((item) => {
      const start = parseDateOnly(item.start_date as string);
      // fim é exclusivo: soma 1 dia ao último dia (ou ao início, se não houver fim)
      const end = addDays(item.end_date ? parseDateOnly(item.end_date) : start, 1);
      return {
        id: `schedule-${item.id}`,
        title: item.title,
        start,
        end,
        allDay: true,
        color: STATUS_EVENT_COLOR[item.status],
        data: { kind: "schedule", itemId: item.id },
      };
    });

    const meetingEvents: CalendarEvent<CronogramaEventData>[] = meetings
      .filter((m): m is ReuniaoInfo & { meeting_date: string } => !!m.meeting_date)
      .map((m) => {
        const start = parseDateOnly(m.meeting_date);
        return {
          id: `meeting-${m.id}`,
          title: m.name,
          start,
          end: addDays(start, 1),
          allDay: true,
          color: colorForTipo(m.tipo) ?? "#a78bfa",
          data: { kind: "meeting", meeting: m },
        };
      });

    return [...scheduleEvents, ...meetingEvents];
  }, [datedItems, meetings]);

  function handleEventClick(occurrence: EventCalendarOccurrence<CronogramaEventData>) {
    const data = occurrence.event.data;
    if (!data) return;
    if (data.kind === "schedule") setEditingId(data.itemId);
    else setViewingMeeting(data.meeting);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium mb-2">{familyName}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Cronograma</h1>
        <div className="mt-4 inline-block rounded-lg border border-border p-3">
          <ProjectDates projectId={projectId} startDate={startDate} endDate={endDate} />
        </div>
      </div>

      <Card className="w-full py-0">
        <CardContent className="p-0">
          <EventCalendar
            events={events}
            defaultView="month"
            views={["month", "week", "agenda"]}
            interactions={{ drag: false, resize: false, selectSlot: false }}
            defaultDate={startDate ? parseDateOnly(startDate) : undefined}
            onEventClick={handleEventClick}
            className="h-[640px] w-full"
          >
            <div className="flex flex-wrap items-center gap-2 px-2 pt-2">
              <EventCalendarNav className="min-w-0 flex-1" />
              <EventCalendarToolbar>
                <Button size="sm" onClick={handleAddItem}>
                  <Plus className="size-4" aria-hidden="true" />
                  Nova etapa
                </Button>
              </EventCalendarToolbar>
            </div>
            <EventCalendarContent />
          </EventCalendar>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(STATUS_LABEL) as EtapaStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Badge variant={STATUS_BADGE_VARIANT[status]} size="xs">{STATUS_LABEL[status]}</Badge>
            </span>
          ))}
        </div>
        {meetings.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {([0, 1, 2] as const).map((fase) => (
              <span key={fase} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: FASE_COLOR[fase] }} />
                {FASE_LABEL[fase]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Etapas sem data definida — não têm como aparecer no grid do calendário */}
      {undatedItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Etapas sem data definida
          </p>
          <div className="space-y-1.5">
            {undatedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setEditingId(item.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm text-foreground">{item.title}</span>
                <Badge variant={STATUS_BADGE_VARIANT[item.status]} size="sm">
                  {STATUS_LABEL[item.status]}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {editingItem && (
        <EtapaDialog
          item={editingItem}
          open={editingId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
          onChange={(patch) => patchLocal(editingItem.id, patch)}
          onSave={() => handleSaveItem(editingItem)}
          onDelete={() => handleRemoveItem(editingItem.id)}
        />
      )}

      {viewingMeeting && (
        <ReuniaoDialog
          meeting={viewingMeeting}
          open={viewingMeeting !== null}
          onOpenChange={(open) => {
            if (!open) setViewingMeeting(null);
          }}
        />
      )}
    </div>
  );
}
