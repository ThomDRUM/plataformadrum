"use client";

import Link from "next/link";

import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ReuniaoInfo {
  id: string;
  name: string;
  meeting_date: string | null;
  tipo: string | null;
}

function formatDateBR(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

interface Props {
  meeting: ReuniaoInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Reunião de alinhamento: só leitura aqui — edição vive na página Alinhamentos. */
export function ReuniaoDialog({ meeting, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName={ADMIN_OVERLAY} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{meeting.name}</DialogTitle>
          <DialogDescription>
            {meeting.tipo ?? "Sem tipo"} · {formatDateBR(meeting.meeting_date)}
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Reunião de alinhamento — editada na página{" "}
          <Link href="/mentor/alinhamentos" className="underline underline-offset-2 hover:text-foreground">
            Alinhamentos
          </Link>
          .
        </p>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Fechar</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
