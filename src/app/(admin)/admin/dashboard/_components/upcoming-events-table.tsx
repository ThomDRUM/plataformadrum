import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Badge, type BadgeProps } from "@/components/reui/badge";
import { SCHEDULE_STATUS_LABEL } from "@/lib/admin/types";
import type { DashboardUpcomingEvent } from "@/lib/admin/queries";

// Evita `new Date(iso)`: a data vem como "YYYY-MM-DD" e o construtor a lê como
// UTC meia-noite, o que pode virar o dia anterior no fuso local ao formatar.
function formatDateBR(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

const SCHEDULE_STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  a_comecar: "secondary",
  em_andamento: "warning-light",
  concluido: "success-light",
};

export function UpcomingEventsTable({ events }: { events: DashboardUpcomingEvent[] }) {
  return (
    <Frame spacing="xs">
      <FramePanel className="p-0!">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Família</TableHead>
              <TableHead>Etapa do cronograma</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum evento agendado nos próximos dias.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.familyName ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.scheduleTitle ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateBR(event.date)}
                  </TableCell>
                  <TableCell>
                    {event.scheduleStatus ? (
                      <Badge
                        variant={SCHEDULE_STATUS_VARIANT[event.scheduleStatus] ?? "secondary"}
                        size="sm"
                      >
                        {SCHEDULE_STATUS_LABEL[event.scheduleStatus] ?? event.scheduleStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  );
}
