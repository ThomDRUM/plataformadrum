"use client";

import type { MentoradoDetail } from "@/lib/mentor/mentorado-detail";
import { ADMIN_OVERLAY } from "@/components/admin/overlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModuleList } from "./module-list";

const STUDENT_TYPE_LABEL: Record<string, string> = {
  successor: "Sucessor",
  succeeded: "Sucedido",
};

interface Props {
  fullName: string;
  mentorId: string;
  /** Buscado por quem abre o dialog — ver `handleShowDetail` em `MentoradosTable`. */
  detail: MentoradoDetail | null;
  error: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MentoradoDetalheDialog({ fullName, mentorId, detail, error, open, onOpenChange }: Props) {
  const typeLabel = detail?.studentType ? STUDENT_TYPE_LABEL[detail.studentType] ?? null : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName={ADMIN_OVERLAY} className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fullName}</DialogTitle>
          {typeLabel && <DialogDescription>{typeLabel}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">
          {error ? (
            <p className="py-10 text-center text-sm text-destructive">{error}</p>
          ) : !detail ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
          ) : !detail.hasTrail ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              A jornada deste mentorado ainda não foi configurada.
            </p>
          ) : (
            <ModuleList userId={detail.id} mentorId={mentorId} modules={detail.modules} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
